// src/components/ViewSavedConversation.js
// This component fetches a saved conversation and displays it,
// relying on the Message component's default audio controls for playback.

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // useParams to get ID from URL
import ConversationDisplay from "./ConversationDisplay"; // Reuse the display component
import config from "../config"; // Import config if using API_BASE_URL

function ViewSavedConversation() {
  // Get the conversation ID from the URL parameter
  const { conversationId } = useParams();

  const [savedConversation, setSavedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Removed all state/refs/effects related to audio queue management in this component

  // Effect to fetch the specific saved conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching conversation with ID: ${conversationId}`); // Log the ID being fetched
        // Call the backend endpoint to get the specific conversation by ID
        // This endpoint now generates fresh S3 pre-signed URLs
        const response = await fetch(
          `${config.API_BASE_URL}/get-conversation/${conversationId}`
        );
        if (!response.ok) {
          let errorData = { error: response.statusText };
          try {
            errorData = await response.json();
          } catch (e) {
            /* ignore */
          }
          throw new Error(
            `Failed to fetch conversation ${conversationId}: ${errorData.error}`
          );
        }
        const data = await response.json();
        console.log("Fetched conversation data:", data); // *** Log the fetched data here ***
        // Assuming backend returns { conversation: { ... } } with refreshed audioUrls
        setSavedConversation(data.conversation);

        // No need to populate a global audio queue here anymore.
        // The Message components will receive the audioUrls directly.
      } catch (err) {
        console.error(`Error fetching conversation ${conversationId}:`, err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]); // Re-run effect if conversationId changes

  // Removed Effect to manage sequential audio playback

  // Removed Playback Controls for Saved Conversation

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
        Loading conversation...
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!savedConversation) {
    return <div>Conversation not found.</div>;
  }

  return (
    <div className="view-saved-conversation">
      <h1
        style={{
          fontSize: "1.6em",
        }}
        className="topic-input-title"
      >
        Conversation on "{savedConversation.topic}" between{" "}
        {savedConversation.personalities.join(" and ")}
      </h1>
      <p
        style={{
          color: "var(--success)",
        }}
      >
        Saved on: {new Date(savedConversation.timestamp).toLocaleString()}
      </p>

      {/* Reuse the ConversationDisplay component to show messages */}
      {/* Note: ConversationDisplay expects 'conversation' prop, which is an array of messages */}
      {/* The Message component will render <audio controls> for each message with an audioUrl */}
      <ConversationDisplay conversation={savedConversation.messages} />

      <Link to="/saved" className="back-to-chat-link">
        Back to Saved List
      </Link>
    </div>
  );
}

export default ViewSavedConversation;
