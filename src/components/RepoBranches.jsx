import { useState } from 'react'

function RepoBranches ({repoUrl}) {
    // Parse the URL to get the Owner and the repo name
    const [owner, repoName] = repoUrl.split("/").slice(-2);
    const [branches, setBranches] = useState([]);
    const [error, setError] = useState(null);

    function showBranches() {
        // Fetch the branches from the GitHub API
        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/branches`;
        console.log(apiUrl);

        fetch(apiUrl)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch branches");
                return res.json();
            })
            .then((data) => setBranches(data))
            .catch((err) => setError(err.message));
    }

    return (
        <div>
            <h2>Repo Details</h2>
            <p>Owner: {owner}</p>
            <p>Repo Name: {repoName}</p>
            <button onClick={showBranches}>Show branches</button>

            <div className="p-4 bg-gray-100 rounded-xl shadow">
                <h2 className="text-lg font-bold mb-2">Branches</h2>

                {error && <p className="text-red-500">{error}</p>}

                {branches.length === 0 ? (
                    <p>No branches found.</p>
                ) : (
                    <ul className="list-disc pl-5">
                        {branches.map((branch) => {
                            const downloadUrl = `https://github.com/${owner}/${repoName}/archive/refs/heads/${branch.name}.zip`;
                            const filename = `${owner}-${branch.name}.zip`;
                            return (
                                <li key={branch.name} className="py-1 flex items-center gap-4">
                                    <span>{branch.name}</span>
                                    <a
                                        href={downloadUrl}
                                        download={filename}
                                        className="text-blue-600 hover:underline"
                                    >
                                        ⬇ Download
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default RepoBranches;
