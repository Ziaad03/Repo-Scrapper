// CommonJS (safe default)
const AdmZip = require("adm-zip");

// For Node.js < 18, you might need to install and require node-fetch
// const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const { owner, repo, branch, id } = req.query;
    if (!owner || !repo || !branch) {
      return res.status(400).send("Missing params: owner, repo, branch are required");
    }

    console.log(`[REQUEST] ${owner}/${repo} branch=${branch}`);

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(branch)}`;
    const headers = {
      'User-Agent': 'Repo-Scrapper/1.0.0'
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      console.log('[AUTH] Using GitHub token');
    } else {
      console.log('[WARNING] No GitHub token found');
    }

    console.log(`[FETCH] Fetching from: ${apiUrl}`);

    const ghRes = await fetch(apiUrl, { 
      headers, 
      redirect: "follow",
      follow: 10
    });

    console.log(`[FETCH] Status: ${ghRes.status}`);

    if (!ghRes.ok) {
      const txt = await ghRes.text().catch(() => "<no body>");
      console.error("GitHub fetch failed", ghRes.status, txt);
      return res.status(ghRes.status).json({ 
        error: `Failed to fetch from GitHub: ${ghRes.status}`,
        details: txt
      });
    }

    // read response body as arrayBuffer -> Buffer
    const arrayBuffer = await ghRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[ZIP] Original zip size: ${buffer.length} bytes`);

    // read zip, rebuild with custom folder name
    const zip = new AdmZip(buffer);
    const newZip = new AdmZip();
    const customFolderName = id ? `${id}-${branch}` : `${branch}`;

    let fileCount = 0;
    zip.getEntries().forEach(entry => {
      if (!entry.isDirectory && entry.entryName) {
        const parts = entry.entryName.split("/");
        if (parts.length > 1) {
          // remove top-level repo folder name
          const newPath = `${customFolderName}/${parts.slice(1).join("/")}`;
          newZip.addFile(newPath, entry.getData());
          fileCount++;
        }
      }
    });

    console.log(`[ZIP] Processed ${fileCount} files`);

    const outBuf = newZip.toBuffer();
    console.log(`[ZIP] New zip size: ${outBuf.length} bytes`);

    // If debug flag passed, return JSON with sizes and first bytes for diagnosis
    if (req.query.debug === '1') {
      const firstBytes = outBuf.slice(0, 4).toString('hex');
      return res.status(200).json({
        originalSize: buffer.length,
        processedSize: outBuf.length,
        firstBytesHex: firstBytes,
        startsWithPK: firstBytes === '504b0304'
      });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${customFolderName}.zip"`);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", outBuf.length);

    console.log(`[SUCCESS] Sending: ${customFolderName}.zip`);
    return res.status(200).send(outBuf);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ 
      error: "Server error", 
      details: err.message 
    });
  }
};
