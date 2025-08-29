import React,{useState} from "react";


function RepoUrlField({repoUrl, setRepoUrl, setIsSent}){


    function handleButtonClick() {
        setIsSent(true);
    }

    return (
        <>
        <input type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
        <button onClick={handleButtonClick}>set URL</button>
        </>
    )


}


export default RepoUrlField;