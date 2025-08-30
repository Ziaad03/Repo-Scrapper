// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import AdmZip from "adm-zip";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const __dirname = path.resolve();

import { Buffer } from "buffer";

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // adjust if needed
// serve static files
app.use(express.static(path.join(__dirname, "build"))); // or "dist" for Vite
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // prefer env

app.get('/download', async (req, res) => {
  const { owner, repo, branch, id } = req.query;
  if (!owner || !repo || !branch) return res.status(400).send("Missing params");

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(branch)}`;
  console.log(`[REQUEST] ${owner}/${repo} branch=${branch}`);
  console.log(`[FETCH] Fetching from API: ${apiUrl}`);

  try {
    // Build headers safely
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Repo-Scrapper",
    };
    if (GITHUB_TOKEN) {
      // prefer Bearer for newer token types, fall back to token prefix
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
      console.log('[AUTH] GitHub token present (masked):', `${GITHUB_TOKEN.slice(0,4)}...${GITHUB_TOKEN.slice(-4)}`);
    } else {
      console.log('[AUTH] No GitHub token configured');
    }

    let resp = await fetch(apiUrl, { headers, redirect: 'follow' });
    console.log(`[FETCH] initial status=${resp.status} finalUrl=${resp.url}`);

    // If token was present but we got 401, try unauthenticated fetch (public repo case)
    if (resp.status === 401) {
      console.warn('[AUTH] Received 401 from GitHub with token; trying unauthenticated request in case repo is public');
      // try again without Authorization header
      const publicHeaders = { Accept: headers.Accept, "User-Agent": headers["User-Agent"] };
      resp = await fetch(apiUrl, { headers: publicHeaders, redirect: 'follow' });
      console.log(`[FETCH] unauthenticated retry status=${resp.status} finalUrl=${resp.url}`);
    }

    console.log(`[FETCH] status=${resp.status} finalUrl=${resp.url}`);
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "<no-body>");
      console.error('[ERROR] GitHub fetch failed:', resp.status, txt);
      // forward status and text to client for easier debugging
      return res.status(resp.status).json({ error: 'Failed to fetch from GitHub', status: resp.status, details: txt });
    }

    // Get the zip buffer
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("[ZIP] Processing zip file...");
    
    // Extract and modify the zip
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    // Create a new zip with custom folder name
    const newZip = new AdmZip();
    const customFolderName = id ? `${id}-${branch}` : `${branch}`;
    
    zipEntries.forEach((entry) => {
      if (!entry.isDirectory) {
        // Get the file path without the original repo folder
        const originalPath = entry.entryName;
        const pathParts = originalPath.split('/');
        
        // Skip the first folder (original repo name) and rebuild path
        if (pathParts.length > 1) {
          const newPath = `${customFolderName}/${pathParts.slice(1).join('/')}`;
          newZip.addFile(newPath, entry.getData());
        }
      }
    });

    // Send the modified zip
    const modifiedBuffer = newZip.toBuffer();
    const filename = `${customFolderName}.zip`;
    
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", modifiedBuffer.length);
    
    console.log(`[STREAM] Sending modified zip: ${filename}`);
    res.send(modifiedBuffer);
    
  } catch (err) {
    console.error("[EXCEPTION] proxy error:", err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 4000;
console.log('GITHUB_TOKEN set?', !!GITHUB_TOKEN);
app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}`));
