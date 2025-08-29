import { useState } from "react";
import "./App.css";
import IDsDropdown from "./components/IDsDropdown";
import RepoDetails from "./components/RepoDetails";

function App() {
  const [owner, setOwner] = useState("");

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="brand">Alex Eagles</h1>
          <p className="brand-sub">UAV Development & Training</p>
        </div>
      </header>

      <main className="container">
        <section className="controls-card">
          <div className="controls-grid">
            <div>
              <label className="label">Trainee ID</label>
              <IDsDropdown setOwner={setOwner} />
            </div>

            
          </div>
        </section>

        <section className="repos-section">
          <RepoDetails owner={owner} />
        </section>
      </main>

      <footer className="app-footer">
        <small>Alex Eagles — internal tool</small>
      </footer>
    </div>
  );
}

export default App;
