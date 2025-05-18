// src/components/SavedConversationsList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import config from "../config"; // Import config if you use API_BASE_URL

function SavedConversationsList() {
  const [savedConversations, setSavedConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // --- Fetch saved conversations from backend ---
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        // Call the backend endpoint to get the list of saved conversations
        // Use config.API_BASE_URL if you have it set up, otherwise use '/api'
        const response = await fetch(
          `${config.API_BASE_URL}/get-conversations`
        );
        if (!response.ok) {
          let errorData = { error: response.statusText };
          try {
            errorData = await response.json();
          } catch (e) {
            /* ignore */
          }
          throw new Error(`Failed to fetch conversations: ${errorData.error}`);
        }
        const data = await response.json();
        // Assuming backend returns { conversations: [...] }
        setSavedConversations(data.conversations || []);
      } catch (err) {
        console.error("Error fetching saved conversations:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []); // Empty dependency array means this runs once on component mount

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1rem",
          fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
          color: "var(--cream)",
        }}
      >
        Loading saved conversations...
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (savedConversations.length === 0) {
    return <div>No saved conversations yet.</div>;
  }

  return (
    <div className="saved-conversations-list">
      <h1
        style={{
          fontSize: "1.6em",
        }}
        className="topic-input-title"
      >
        Saved Conversations
      </h1>
      <ul>
        {/* Map through the list and create a link for each */}
        {savedConversations.map((convo) => (
          // Use convo.conversationId as the unique key and in the link URL
          <li key={convo.conversationId}>
            {/* Link to the individual conversation view page using conversationId */}
            <Link
              to={`/saved/${convo.conversationId}`}
              className="saved-conversation-item"
            >
              Conversation on "{convo.topic}" between{" "}
              {convo.personalities.join(" and ")} (
              {new Date(convo.timestamp).toLocaleDateString()})
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/" className="back-to-chat-link">
        Back to New Conversation
      </Link>
    </div>
  );
}

export default SavedConversationsList;
