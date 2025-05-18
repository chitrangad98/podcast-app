// src/components/ConversationDisplay.js
import React, { useRef, useEffect } from "react";
import Message from "./Message"; // Import the Message component

// Simple ConversationDisplay component
function ConversationDisplay({ conversation }) {
  // Removed isSavedView prop
  // Ref for the element at the end of the messages to enable auto-scrolling
  const messagesEndRef = useRef(null);

  // Function to scroll to the bottom of the conversation display
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to scroll to the bottom whenever the conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  return (
    <div className="conversation-display">
      <h2 className="topic-input-title"> Conversation Transcript</h2>
      <div
        className="message-list"
        style={{
          height: "400px",
          overflowY: "scroll",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        {/* Map through the conversation array and render a Message component for each message */}
        {conversation.map((msg, index) => (
          <Message
            key={index}
            speaker={msg.speaker}
            text={msg.text}
            audioUrl={msg.audioUrl}
            // Removed autoPlay prop passing
          />
        ))}
        {/* This div is the target for scrolling to the bottom */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ConversationDisplay;
