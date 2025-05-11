// src/components/ControlPanel.js
import React from "react";

function ControlPanel({ onStart, onStop, isLoading }) {
  const isStartDisabled = isLoading; // Add conditions later based on selected personalities and topic

  return (
    <div>
      <button onClick={onStart} disabled={isStartDisabled}>
        {isLoading ? "Generating..." : "Start Conversation"}
      </button>
      <button onClick={onStop} disabled={!isLoading && true}>
        {" "}
        {/* Disable stop initially */}
        Stop
      </button>
    </div>
  );
}

export default ControlPanel;
