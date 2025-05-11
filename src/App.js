// src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import PersonalitySelector from "./components/PersonalitySelector";
import TopicInput from "./components/TopicInput";
import ControlPanel from "./components/ControlPanel";
import ConversationDisplay from "./components/ConversationDisplay";

function App() {
  const [selectedPersonalities, setSelectedPersonalities] = useState([]);
  const [topic, setTopic] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [personalityParams, setPersonalityParams] = useState({});

  const audioRef = useRef(new Audio()); // Use a single audio element and update its source

  // Function to handle starting the conversation
  const handleStartConversation = async () => {
    if (selectedPersonalities.length < 2 || !topic) {
      alert("Please select two personalities and enter a topic.");
      return;
    }

    setIsLoading(true);
    setConversation([]); // Clear previous conversation
    setAudioQueue([]); // Clear previous audio queue
    setPersonalityParams({}); // Clear previous parameters
    setIsPlayingAudio(false); // Stop any ongoing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clear audio source
    }

    try {
      // --- Step 1: Get Personality Parameters from AI ---
      const params = {};
      for (const personality of selectedPersonalities) {
        // Call your serverless function endpoint
        const paramsResponse = await fetch("/api/get-persona-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personalityName: personality }),
        });
        if (!paramsResponse.ok) {
          const errorData = await paramsResponse.json();
          throw new Error(
            `Failed to get params for ${personality}: ${errorData.error}`
          );
        }
        const data = await paramsResponse.json();
        params[personality] = data.summary; // Assuming backend returns { summary: "..." }
      }
      setPersonalityParams(params);
      console.log("Fetched personality parameters:", params);

      // --- Step 2: Start the Main Conversation ---
      // Call your serverless function endpoint
      const startConversationResponse = await fetch("/api/start-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalities: selectedPersonalities,
          topic: topic,
          personalityParams: params,
        }),
      });

      if (!startConversationResponse.ok) {
        const errorData = await startConversationResponse.json();
        throw new Error(`Failed to start conversation: ${errorData.error}`);
      }

      const firstMessage = await startConversationResponse.json();
      // Assuming backend now returns { speaker: "...", text: "...", audioUrl: "..." }
      setConversation([firstMessage]);
      setAudioQueue([firstMessage.audioUrl]); // Add audio URL to queue
      // isPlayingAudio will be set to true by the useEffect below
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert(`Failed to start conversation: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Function to handle stopping the conversation
  const handleStopConversation = () => {
    setIsLoading(false);
    setConversation([]);
    setAudioQueue([]);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clear audio source
    }
    // You might need to send a signal to the backend to stop any ongoing generation
    console.log("Conversation stopped.");
  };

  // Effect to manage audio playback queue
  useEffect(() => {
    // If there's audio in the queue and we're not already playing
    if (audioQueue.length > 0 && !isPlayingAudio) {
      setIsPlayingAudio(true); // Set playing state to true
      audioRef.current.src = audioQueue[0]; // Set the source of the single audio element

      audioRef.current.onended = () => {
        // Remove the played audio from the queue
        setAudioQueue((prevQueue) => prevQueue.slice(1));
        setIsPlayingAudio(false); // Set playing state to false, will trigger effect again if queue has more items
      };

      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        setAudioQueue((prevQueue) => prevQueue.slice(1)); // Skip problematic audio
        setIsPlayingAudio(false); // Stop playing on error
        setIsLoading(false); // Stop loading on error
        alert("Error playing audio.");
      };

      // Attempt to play the audio
      audioRef.current.play().catch((error) => {
        console.error("Audio play promise rejected:", error);
        // Handle cases where play() fails (e.g., browser autoplay restrictions)
        // You might need a user interaction to resume playback
        setIsPlayingAudio(false); // Set playing state to false
        // Optionally, show a message asking the user to click to resume
      });
    }
  }, [audioQueue, isPlayingAudio]); // Dependencies for the effect

  // Effect to trigger continuation when audio finishes and conditions are met
  useEffect(() => {
    // Only continue if audio has just finished playing (isPlayingAudio is false)
    // and we are still in a loading state (meaning the conversation hasn't been stopped)
    // and we haven't reached the maximum number of turns.
    const maxTurns = 10; // Limit conversation length (approx 2 mins)
    if (
      !isPlayingAudio &&
      isLoading &&
      conversation.length > 0 &&
      conversation.length < maxTurns
    ) {
      handleContinueConversation();
    } else if (
      !isPlayingAudio &&
      isLoading &&
      conversation.length >= maxTurns
    ) {
      // If audio finished and we reached max turns while still loading, stop loading.
      setIsLoading(false);
      console.log("Reached maximum turns.");
    }
  }, [isPlayingAudio, isLoading, conversation.length]);

  // Function to handle continuing the conversation
  const handleContinueConversation = async () => {
    setIsLoading(true); // Keep loading state true while fetching next turn
    try {
      // Call your serverless function endpoint
      const continueConversationResponse = await fetch(
        "/api/continue-conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationHistory: conversation, // Send the full history
            personalities: selectedPersonalities,
            topic: topic,
            personalityParams: personalityParams,
          }),
        }
      );

      if (!continueConversationResponse.ok) {
        const errorData = await continueConversationResponse.json();
        throw new Error(`Failed to continue conversation: ${errorData.error}`);
      }

      const nextMessage = await continueConversationResponse.json();
      // Assuming backend returns { speaker: "...", text: "...", audioUrl: "..." }

      setConversation((prevConversation) => [...prevConversation, nextMessage]);
      setAudioQueue((prevQueue) => [...prevQueue, nextMessage.audioUrl]); // Add next audio URL to queue
      // isPlayingAudio will be set to true by the useEffect when the queue is processed
    } catch (error) {
      console.error("Error continuing conversation:", error);
      alert(`Failed to continue conversation: ${error.message}. Ending chat.`);
      setIsLoading(false); // Stop loading on error
    }
  };

  // Removed base64toBlob function as we are now expecting URLs

  return (
    <div className="App">
      <h1>AI Podcast Chat</h1>
      <div className="setup-section">
        <PersonalitySelector
          selectedPersonalities={selectedPersonalities}
          setSelectedPersonalities={setSelectedPersonalities}
        />
        <TopicInput topic={topic} setTopic={setTopic} />
        <ControlPanel
          onStart={handleStartConversation}
          onStop={handleStopConversation}
          isLoading={isLoading}
          canStart={
            selectedPersonalities.length === 2 &&
            topic.trim() !== "" &&
            !isLoading
          }
        />
      </div>
      <div className="conversation-section">
        <ConversationDisplay conversation={conversation} />
      </div>
    </div>
  );
}

export default App;
