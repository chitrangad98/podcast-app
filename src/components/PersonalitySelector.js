// src/components/PersonalitySelector.js
import React from "react";

const availablePersonalities = [
  "Kanye West",
  "Elon Musk",
  "Oprah Winfrey",
  "Neil deGrasse Tyson",
  // Add more personalities here
];

function PersonalitySelector({
  selectedPersonalities,
  setSelectedPersonalities,
}) {
  const handleSelect = (index, value) => {
    const newSelected = [...selectedPersonalities];
    newSelected[index] = value;
    setSelectedPersonalities(newSelected);
  };

  return (
    <div>
      <h2>Select Personalities (2)</h2>
      <select
        value={selectedPersonalities[0] || ""}
        onChange={(e) => handleSelect(0, e.target.value)}
      >
        <option value="">--Select Personality 1--</option>
        {availablePersonalities.map((p) => (
          <option key={p} value={p} disabled={selectedPersonalities[1] === p}>
            {p}
          </option>
        ))}
      </select>
      <select
        value={selectedPersonalities[1] || ""}
        onChange={(e) => handleSelect(1, e.target.value)}
      >
        <option value="">--Select Personality 2--</option>
        {availablePersonalities.map((p) => (
          <option key={p} value={p} disabled={selectedPersonalities[0] === p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PersonalitySelector;
