import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import owners from "../assets/owners.json";
import "../App.css";

export default function RepoDetails({ owner }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedRepo, setSelectedRepo] = useState(null);

  const token = import.meta.env.VITE_GITHUB_TOKEN; // prefer env usage

  async function fetchRepos() {
    if (!owner) {
      setError("Please select a Trainee ID first");
      return;
    }

    setLoading(true);
    setError(null);
    setRepos([]);
    setSelectedRepo(null);

    try {
      const reposResp = await fetch(`https://api.github.com/users/${owner}/repos`, {
        headers: token ? { Authorization: `token ${token}` } : {},
      });

      
      if (!reposResp.ok) throw new Error("Failed to fetch repos");
      const reposData = await reposResp.json();

      // reverse repos
      reposData.reverse();
      const reposWithBranches = await Promise.all(
        reposData.reverse().map(async (repo) => {
          const branchesResp = await fetch(
            `https://api.github.com/repos/${owner}/${repo.name}/branches`,
            { headers: token ? { Authorization: `token ${token}` } : {} }
          );
          const branchesData = branchesResp.ok ? await branchesResp.json() : [];
          return { ...repo, branches: branchesData };
        })
      );

      setRepos(reposWithBranches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  const handleRowClick = (repo) => setSelectedRepo(repo);

  async function handleDownloadBranch(repo, branch) {
    const repoName = repo.name;
    const branchName = branch.name;
    const id = Object.keys(owners).find((key) => owners[key] === owner) || "id";

    try {
      const resp = await fetch(
        `http://localhost:4000/download?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
          repoName
        )}&branch=${encodeURIComponent(branchName)}&id=${encodeURIComponent(id)}`
      );

      if (!resp.ok) throw new Error("Failed to download");
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${id}-${branchName}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed: " + err.message);
    }
    // try {
    //   // Use different URLs for development vs production
    //   const baseUrl = import.meta.env.DEV ? 'http://localhost:4000' : '';
    //   const resp = await fetch(
    //     `/api/download?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
    //       repoName
    //     )}&branch=${encodeURIComponent(branchName)}&id=${encodeURIComponent(id)}`
    //   );

    //   if (!resp.ok) throw new Error("Failed to download");
      
    //   const blob = await resp.blob();
    //   const link = document.createElement("a");
    //   link.href = URL.createObjectURL(blob);
    //   link.download = `${id}-${branchName}.zip`;
    //   document.body.appendChild(link);
    //   link.click();
    //   link.remove();
    //   URL.revokeObjectURL(link.href);
    // } catch (err) {
    //   console.error("Download failed", err);
    //   alert("Download failed: " + err.message);
    // }
  }

  return (
    <div className="repo-card">
      <div className="repo-card-header">
        <h2>Repositories</h2>
        <div>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchRepos}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : "Fetch"}
          </Button>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {repos.length > 0 && (
        <Paper className="repos-paper">
          <TableContainer sx={{ maxHeight: 340 }}>
            <Table stickyHeader aria-label="repos table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Repo Name</TableCell>
                  <TableCell align="right">Branches</TableCell>
                  <TableCell>Branch Names</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((repo) => (
                    <TableRow
                      hover
                      key={repo.id}
                      onClick={() => handleRowClick(repo)}
                      className="repo-row"
                    >
                      <TableCell className="repo-name-cell">
                        {/* subtle censoring: show last 18 chars, mask rest */}
                        {(() => {
                          const name = repo.name || "";
                          if (name.length <= 18) return "•".repeat(name.length);
                          const visible = name.slice(-18);
                          return `${"•".repeat(name.length - 18)}${visible}`;
                        })()}
                      </TableCell>
                      <TableCell align="right">{repo.branches.length}</TableCell>
                      <TableCell className="branch-names">
                        {repo.branches.map((b) => b.name).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={repos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {selectedRepo && (
        <div className="branches-card">
          <h3>Branches </h3>
          {selectedRepo.branches.length === 0 ? (
            <p className="muted">No branches found.</p>
          ) : (
            <ul className="branches-list">
              {selectedRepo.branches.map((branch) => (
                <li key={branch.name} className="branch-item">
                  <span className="branch-name">{branch.name}</span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDownloadBranch(selectedRepo, branch)}
                  >
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
