// src/components/TopicInput.js
import React from "react";

function TopicInput({ topic, setTopic }) {
  return (
    <div>
      <h2>Enter Topic</h2>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g., The future of transportation"
      />
    </div>
  );
}

export default TopicInput;
