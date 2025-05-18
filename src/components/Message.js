// src/components/Message.js
import React, { useRef, useEffect } from "react";

function Message({ speaker, text, audioUrl }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current
        .play()
        .catch((error) => console.error("Audio playback failed:", error));
    }
  }, [audioUrl]); // Play audio when audioUrl changes

  return (
    <div className={`message ${speaker.toLowerCase().replace(/\s+/g, "-")}`}>
      <strong>{speaker}:</strong> {text}
      {audioUrl && (
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
