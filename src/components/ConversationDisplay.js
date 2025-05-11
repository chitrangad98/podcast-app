// src/components/ConversationDisplay.js
import React, { useRef, useEffect } from "react";
import Message from "./Message"; // Create this component next

function ConversationDisplay({ conversation }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]); // Scroll to bottom when conversation updates

  return (
    <div
      className="conversation-box"
      style={{
        height: "400px",
        overflowY: "scroll",
        border: "1px solid #ccc",
        padding: "10px",
      }}
    >
      {conversation.map((msg, index) => (
        <Message
          key={index}
          speaker={msg.speaker}
          text={msg.text}
          audioUrl={msg.audioUrl}
        />
      ))}
      <div ref={messagesEndRef} /> {/* Element to scroll to */}
    </div>
  );
}

export default ConversationDisplay;
