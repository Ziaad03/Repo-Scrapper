import React, { useState } from "react";
import owners from "../assets/owners.json";
import "../App.css";

const IDsDropdown = ({ setOwner }) => {
  const [selectedId, setSelectedId] = useState("");

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setOwner(owners[id] || "");
  };

  return (
    <div className="ids-dropdown">
      <select value={selectedId} onChange={handleChange} className="select">
        <option value="">Select ID</option>
        {Object.keys(owners).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </div>
  );
};

export default IDsDropdown;
