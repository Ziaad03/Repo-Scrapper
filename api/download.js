// CommonJS (safe default)
const AdmZip = require("adm-zip");

module.exports = async (req, res) => {
  try {
    const { owner, repo, branch, id } = req.query;
    if (!owner || !repo || !branch) {
      return res.status(400).send("Missing params: owner, repo, branch are required");
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(branch)}`;
    const headers = {};
    if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

    const ghRes = await fetch(apiUrl, { headers, redirect: "follow" });

    if (!ghRes.ok) {
      const txt = await ghRes.text().catch(() => "<no body>");
      console.error("GitHub fetch failed", ghRes.status, txt);
      return res.status(ghRes.status).send(`Failed to fetch from GitHub: ${ghRes.status}`);
    }

    // read response body as arrayBuffer -> Buffer
    const arrayBuffer = await ghRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // read zip, rebuild with custom folder name
    const zip = new AdmZip(buffer);
    const newZip = new AdmZip();
    const customFolderName = id ? `${id}-${branch}` : `${branch}`;

    zip.getEntries().forEach(entry => {
      if (!entry.isDirectory) {
        const parts = entry.entryName.split("/");
        // remove top-level repo folder name
        const newPath = `${customFolderName}/${parts.slice(1).join("/")}`;
        newZip.addFile(newPath, entry.getData());
      }
    });

    const outBuf = newZip.toBuffer();

    res.setHeader("Content-Disposition", `attachment; filename="${customFolderName}.zip"`);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", outBuf.length);

    return res.status(200).send(outBuf);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).send("Server error");
  }
};
