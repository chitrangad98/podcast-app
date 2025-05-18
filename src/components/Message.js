// src/components/Message.js
import React, { useRef, useEffect } from "react";

// Message component displays the audio element with default browser controls
function Message({ speaker, text, audioUrl }) {
  // Ref for the audio element specific to this message
  const audioRef = useRef(null);

  // Effect to ensure the audio element is linked if needed (less critical with single audioRef in App)
  // but kept for clarity if this component were to manage its own audio instance.
  // In the current App.js setup (using a single audioRef), this useEffect might not be strictly necessary
  // for playback control managed in App.js, but it's harmless.
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      // The audio source is set by the parent component (App or ViewSavedConversation)
      // The parent component is also responsible for calling .play()
      // This effect primarily ensures the ref is linked to the element.
    }
  }, [audioUrl]);

  return (
    // Assign a class based on the speaker for potential styling
    <div
      style={{
        marginBottom: "1rem",
      }}
      className={`message ${speaker.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Display the speaker's name in bold */}
      <strong>{speaker}:</strong>
      {/* Display the message text */}
      {text}

      {/* Render the audio player if an audioUrl is provided */}
      {audioUrl && (
        // Display the audio element with default browser controls
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          style={{ display: "block", marginTop: "5px" }}
        />
      )}
    </div>
  );
}

export default Message;
