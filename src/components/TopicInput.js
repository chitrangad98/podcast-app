// src/components/TopicInput.js
import React from "react";

function TopicInput({ topic, setTopic }) {
  return (
    <div className="topic-input-container">
      <h2 className="topic-input-title">Enter Context</h2>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="enter any topic"
        className="topic-input"
      />
    </div>
  );
}

export default TopicInput;
