// src/App.js
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import "./App.css";
import PersonalitySelector from "./components/PersonalitySelector";
import TopicInput from "./components/TopicInput";
import ControlPanel from "./components/ControlPanel";
import ConversationDisplay from "./components/ConversationDisplay";
import config from "./config";
import { PiGooglePodcastsLogo } from "react-icons/pi";

function App() {
  const [selectedPersonalities, setSelectedPersonalities] = useState([]);
  const [topic, setTopic] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]); // Audio queue for LIVE conversation
  const [isPlayingAudio, setIsPlayingAudio] = useState(false); // Playing state for LIVE conversation
  const [personalityParams, setPersonalityParams] = useState({});
  // isConversationFinished indicates if the conversation reached max turns or was stopped
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  // New state for user input question
  const [userQuestion, setUserQuestion] = useState("");

  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Single audio element ref for sequential playback in LIVE conversation
  const audioRef = useRef(new Audio());

  // Function to handle starting the conversation
  const handleStartConversation = async () => {
    if (selectedPersonalities.length < 2 || !topic) {
      alert("Please select two personalities and enter a topic.");
      return;
    }

    setIsLoading(true);
    setConversation([]); // Clear previous conversation when starting a new one
    setAudioQueue([]); // Clear previous audio queue
    setPersonalityParams({}); // Clear previous parameters
    setIsPlayingAudio(false); // Stop any ongoing audio
    setIsConversationFinished(false); // Reset finished state
    setUserQuestion(""); // Clear user question
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clear audio source
    }

    try {
      // --- Step 1: Get Personality Parameters from AI ---
      const params = {};
      for (const personality of selectedPersonalities) {
        const paramsResponse = await fetch(
          `${config.API_BASE_URL}/get-persona-params`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ personalityName: personality }),
          }
        );
        if (!paramsResponse.ok) {
          let errorData = { error: paramsResponse.statusText };
          try {
            errorData = await paramsResponse.json();
          } catch (e) {
            /* ignore */
          }
          throw new Error(
            `Failed to get params for ${personality}: ${errorData.error}`
          );
        }
        const data = await paramsResponse.json();
        params[personality] = data.summary;
      }
      setPersonalityParams(params);
      console.log("Fetched personality parameters:", params);

      // --- Step 2: Start the Main Conversation ---
      const startConversationResponse = await fetch(
        `${config.API_BASE_URL}/start-conversation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalities: selectedPersonalities,
            topic: topic,
            personalityParams: params,
          }),
        }
      );

      if (!startConversationResponse.ok) {
        let errorData = { error: startConversationResponse.statusText };
        try {
          errorData = await startConversationResponse.json();
        } catch (e) {
          /* ignore */
        }
        throw new Error(`Failed to start conversation: ${errorData.error}`);
      }

      const firstMessage = await startConversationResponse.json();
      setConversation([firstMessage]);
      setAudioQueue([firstMessage.audioUrl]); // Add first audio URL to queue
      // isPlayingAudio will be set to true by the useEffect below

      setTimer(120); // Start from 120 seconds

      // Clear previous interval if any
      if (timerRef.current) clearInterval(timerRef.current);

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsLoading(false);
            setIsConversationFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert(`Failed to start conversation: ${error.message}`);
      setIsLoading(false);
      setIsConversationFinished(true); // Mark as finished on error so user can potentially save partial
    }
  };

  // Function to handle stopping the conversation
  const handleStopConversation = () => {
    setIsLoading(false);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsConversationFinished(true);
    console.log("Conversation stopped by user.");
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
  };

  // Effect to manage audio playback queue and trigger next turn for LIVE conversation
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlayingAudio) {
      setIsPlayingAudio(true);
      audioRef.current.src = audioQueue[0];

      audioRef.current.onended = () => {
        setAudioQueue((prevQueue) => prevQueue.slice(1));
        setIsPlayingAudio(false);
      };

      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        setAudioQueue((prevQueue) => prevQueue.slice(1));
        setIsPlayingAudio(false);
        setIsLoading(false);
        setIsConversationFinished(true);
        alert("Error playing audio.");
      };

      audioRef.current.play().catch((error) => {
        console.error("Audio play promise rejected:", error);
        setIsPlayingAudio(false);
        console.log("Audio playback requires user interaction.");
      });
    }
  }, [audioQueue, isPlayingAudio]);

  // Effect to trigger continuation or mark conversation finished based on audio queue and loading state
  useEffect(() => {
    const maxTurns = 10;

    // Only continue if audio has just finished playing (!isPlayingAudio)
    // AND we are still in a loading state (meaning not stopped by user or encountered error)
    // AND there are no more audio segments in the queue to play for the current turn.
    // AND there is no pending user question.
    if (
      !isPlayingAudio &&
      isLoading &&
      audioQueue.length === 0 &&
      conversation.length > 0 &&
      conversation.length < maxTurns &&
      userQuestion === "" // Only continue automatically if no user question is pending
    ) {
      handleContinueConversation();
    } else if (
      !isPlayingAudio &&
      isLoading &&
      audioQueue.length === 0 &&
      conversation.length >= maxTurns
    ) {
      setIsLoading(false);
      setIsConversationFinished(true);
      console.log("Reached maximum turns. Conversation finished.");
    }
  }, [
    isPlayingAudio,
    isLoading,
    audioQueue.length,
    conversation.length,
    userQuestion,
  ]); // Add userQuestion to dependencies

  // Function to handle continuing the conversation
  const handleContinueConversation = async () => {
    setIsLoading(true);
    try {
      // Prepare conversation history, including the user's question if present
      const historyToSend = [...conversation];
      if (userQuestion) {
        // Add the user's question to the history before sending to backend
        historyToSend.push({
          speaker: "User", // Use 'User' as the speaker for user input
          text: userQuestion,
          audioUrl: null, // User input has no audio URL
          audioKey: null, // User input has no audio key
        });
        setUserQuestion(""); // Clear the user input field after adding to history
      }

      const continueConversationResponse = await fetch(
        `${config.API_BASE_URL}/continue-conversation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationHistory: historyToSend, // Send the potentially modified history
            personalities: selectedPersonalities,
            topic: topic,
            personalityParams: personalityParams,
          }),
        }
      );

      if (!continueConversationResponse.ok) {
        let errorData = { error: continueConversationResponse.statusText };
        try {
          errorData = await continueConversationResponse.json();
        } catch (e) {
          /* ignore */
        }
        throw new Error(`Failed to continue conversation: ${errorData.error}`);
      }

      const nextMessage = await continueConversationResponse.json();
      // If there was a user question, add it to the local conversation state *before* the AI response
      if (historyToSend.length > conversation.length) {
        // Check if a user message was added
        setConversation((prevConversation) => [
          ...prevConversation,
          historyToSend[historyToSend.length - 1],
          nextMessage,
        ]);
      } else {
        setConversation((prevConversation) => [
          ...prevConversation,
          nextMessage,
        ]);
      }

      setAudioQueue((prevQueue) => [...prevQueue, nextMessage.audioUrl]);
    } catch (error) {
      console.error("Error continuing conversation:", error);
      alert(`Failed to continue conversation: ${error.message}. Ending chat.`);
      setIsLoading(false);
      setIsConversationFinished(true);
    }
  };

  // Function to handle submitting user question
  const handleSubmitUserQuestion = () => {
    if (userQuestion.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    // Stop any ongoing audio before injecting user input
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
    // Trigger the continuation logic, which will now include the user question
    // We set isLoading to true to ensure the continuation effect runs
    setIsLoading(true);
    // The continuation effect will see userQuestion is not empty and handle it.
    // We don't call handleContinueConversation directly here because
    // the useEffect needs to see the state changes (isPlayingAudio, isLoading).
  };

  // Function to handle saving the conversation (remains the same)
  const handleSaveConversation = async () => {
    if (conversation.length === 0) {
      alert("Cannot save an empty conversation.");
      return;
    }

    try {
      setIsLoading(true);

      const saveResponse = await fetch(
        `${config.API_BASE_URL}/save-conversation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalities: selectedPersonalities,
            topic: topic,
            timestamp: new Date().toISOString(),
            messages: conversation,
          }),
        }
      );

      if (!saveResponse.ok) {
        let errorData = { error: saveResponse.statusText };
        try {
          errorData = await saveResponse.json();
        } catch (e) {
          /* ignore */
        }
        throw new Error(`Failed to save conversation: ${errorData.error}`);
      }

      const result = await saveResponse.json();
      alert("Conversation saved successfully!");
      console.log("Save result:", result);
    } catch (error) {
      console.error("Error saving conversation:", error);
      alert(`Failed to save conversation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear the current conversation (remains the same)
  const handleClearConversation = () => {
    if (isLoading) {
      alert("Cannot clear while a conversation is in progress. Stop it first.");
      return;
    }
    if (
      window.confirm("Are you sure you want to clear the current conversation?")
    ) {
      setConversation([]);
      setAudioQueue([]);
      setIsPlayingAudio(false);
      setIsConversationFinished(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // Clear audio source
      }
      setUserQuestion(""); // Clear user question on clear
      console.log("Current conversation cleared.");
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
  };

  return (
    <div className="App">
      {/* Add a link to navigate to saved conversations */}
      <div className="header">
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {" "}
          <svg
            className="venn-logo"
            viewBox="0 0 200 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="mesh-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
            </defs>
            <circle
              cx="70"
              cy="50"
              r="40"
              fill="var(--orange-red-60)"
              filter="url(#mesh-blur)"
            />
            <circle
              cx="130"
              cy="50"
              r="40"
              fill="var(--sky-blue-60)"
              filter="url(#mesh-blur)"
            />
          </svg>
          ConvoLab
        </h1>
        <Link to="/saved" className="saved-conversations-link">
          View Saved Conversations
        </Link>
      </div>

      <div className="setup-section">
        <PersonalitySelector
          selectedPersonalities={selectedPersonalities}
          setSelectedPersonalities={setSelectedPersonalities}
        />

        <TopicInput topic={topic} setTopic={setTopic} />

        <div className="setup-section-inner">
          <button
            onClick={handleStartConversation}
            disabled={
              selectedPersonalities.length !== 2 ||
              topic.trim() === "" ||
              isLoading
            }
            className="control-button-start-button"
          >
            {isLoading && conversation.length === 0
              ? "STARTING..."
              : "Start Conversation"}
          </button>
          <ControlPanel
            onStart={handleStartConversation}
            onStop={handleStopConversation}
            onSave={handleSaveConversation} // Pass the save handler
            onClear={handleClearConversation} // Pass the clear handler
            isLoading={isLoading}
            canStart={
              selectedPersonalities.length === 2 &&
              topic.trim() !== "" &&
              !isLoading
            }
            canSave={
              !isLoading && conversation.length > 0 && isConversationFinished
            }
            canClear={!isLoading && conversation.length > 0}
          />
        </div>
      </div>

      {/* New section for user input */}
      <div className="user-input-container">
        <div className="user-input-section">
          <h2 className="topic-input-title">Inject Prompt </h2>
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Type your question or prompt here..."
            className="user-question-input"
            // --- FIX: Only disable input if conversation hasn't started ---
            disabled={conversation.length === 0}
          />

          <button
            onClick={handleSubmitUserQuestion}
            className="submit-question-button"
            // Disable button while loading, no question, or conversation hasn't started
            disabled={
              isLoading ||
              userQuestion.trim() === "" ||
              conversation.length === 0
            }
          >
            Submit to Conversation
          </button>
          <h4
            className="topic-input-title"
            style={{ fontSize: "0.8rem", color: "lightgrey" }}
          >
            * This will be naturally injected into the conversation as context.
          </h4>
        </div>

        <div className="conversation-section">
          {isLoading && timer > 0 && (
            <div className="countdown-timer">
              <p>
                Chat will end in{" "}
                <span style={{ color: "var(--danger)" }}>{timer}</span> seconds
              </p>
            </div>
          )}

          <ConversationDisplay conversation={conversation} />
        </div>
      </div>
    </div>
  );
}

export default App;
