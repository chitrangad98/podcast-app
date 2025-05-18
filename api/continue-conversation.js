// api/continue-conversation.js
// This function continues the conversation based on history (including potential user input)
// and generates the next message and audio.

import OpenAI from "openai";
import AWS from "aws-sdk"; // Import AWS SDK
import { v4 as uuidv4 } from "uuid"; // Import uuid for unique filenames

// require('dotenv').config(); // For local development

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure AWS S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const S3_FOLDER = "audio/"; // Optional: store audio in a specific folder

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { conversationHistory, personalities, topic, personalityParams } =
    req.body;

  if (
    !conversationHistory ||
    !Array.isArray(conversationHistory) ||
    conversationHistory.length === 0 ||
    !personalities ||
    personalities.length !== 2 ||
    !topic ||
    !personalityParams ||
    Object.keys(personalityParams).length !== 2
  ) {
    return res
      .status(400)
      .json({ error: "Invalid input parameters or empty history." });
  }

  const [p1Name, p2Name] = personalities;
  const p1Params = personalityParams[p1Name];
  const p2Params = personalityParams[p2Name];

  if (!p1Params || !p2Params) {
    return res
      .status(400)
      .json({
        error: "Personality parameters missing for one or more personalities.",
      });
  }

  try {
    // --- Step 1: Prepare messages for Chat Completions, including history ---
    const systemMessage = {
      role: "system",
      content: `Continue the podcast conversation between ${p1Name} and ${p2Name} about "${topic}".

        Individual 1 is ${p1Name}. Their public persona is perceived as: ${p1Params}
        Individual 2 is ${p2Name}. Their public persona is perceived as: ${p2Params}

        They should take turns speaking, reflecting their described personas, tone, and references. Keep each turn relatively short. Continue the dialogue based on the previous messages. The next speaker should respond directly to the immediately preceding message in the history, regardless of who sent it. If the preceding message was from "User", respond directly to the user's input as if you heard it during the podcast.`, // Refined instruction for user input
    };

    const apiHistoryMessages = [systemMessage];
    conversationHistory.forEach((msg) => {
      // Removed index as it's less reliable with user input
      // Map roles based on speaker.
      let role;
      if (msg.speaker === "User") {
        role = "user"; // User input is always a 'user' role
      } else if (msg.speaker === p1Name) {
        role = "user"; // Treat P1's turns as 'user' role for the AI
      } else {
        // msg.speaker === p2Name
        role = "assistant"; // Treat P2's turns as 'assistant' role for the AI
      }

      apiHistoryMessages.push({
        role: role,
        content: `${msg.speaker}: ${msg.text}`, // Include speaker name in content for clarity
      });
    });

    // Determine the next speaker from the personalities.
    // If the last message in history was from 'User', the next speaker should be the personality
    // who *would* have spoken next based on the last *personality* message.
    // If the last message was from a personality, the next speaker is the other personality.
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    let nextSpeaker;

    if (lastMessage.speaker === "User") {
      // If the last message was from the user, figure out which personality was supposed to speak next
      // before the user jumped in. Find the last message *not* from 'User'.
      const lastPersonalityMessage = conversationHistory
        .filter((m) => m.speaker !== "User")
        .pop();
      if (lastPersonalityMessage) {
        // The next speaker is the one who wasn't the last personality to speak
        nextSpeaker =
          lastPersonalityMessage.speaker === p1Name ? p2Name : p1Name;
      } else {
        // This case should ideally not happen if the conversation starts with a personality,
        // but as a fallback, assume P1 speaks first.
        nextSpeaker = p1Name;
      }
    } else {
      // If the last message was from a personality, the next speaker is the other personality.
      nextSpeaker = lastMessage.speaker === p1Name ? p2Name : p1Name;
    }

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model
      messages: apiHistoryMessages,
      max_tokens: 150, // Allow a bit more for responding to user + continuing
      temperature: 0.8,
    });

    const nextMessageText = chatCompletion.choices[0].message.content.trim();

    // --- Step 2: Generate audio for the next message using Text-to-Speech ---
    const voice1 = "alloy"; // Example voice for personality 1
    const voice2 = "fable"; // Example voice for personality 2
    const selectedVoice = nextSpeaker === p1Name ? voice1 : voice2;

    const audioResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice,
      input: nextMessageText,
      response_format: "mp3", // Specify the format
    });

    // Convert ArrayBuffer to a Buffer
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    // --- Step 3: Upload audio to S3 and get a pre-signed URL ---
    const filename = `${S3_FOLDER}${uuidv4()}.mp3`; // Unique filename (S3 Key)
    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: filename, // This is the S3 Key
      Body: audioBuffer,
      ContentType: "audio/mpeg", // Important for playback
    };

    await s3.upload(uploadParams).promise(); // Upload the file

    // Generate a pre-signed URL for the uploaded object
    const audioUrl = s3.getSignedUrl("getObject", {
      Bucket: S3_BUCKET_NAME,
      Key: filename, // Use the S3 Key to generate the URL
      Expires: 60 * 5, // URL expires in 5 minutes (adjust as needed for live)
    });

    // Return the next message text, audio URL, AND the S3 Key
    res.status(200).json({
      speaker: nextSpeaker, // Indicate who is speaking this turn
      text: nextMessageText,
      audioUrl: audioUrl, // Temporary URL for live playback
      audioKey: filename, // Include the S3 Key here
    });
  } catch (error) {
    console.error("Error continuing conversation:", error);
    res
      .status(500)
      .json({
        error: `Failed to continue conversation due to an internal error: ${error.message}`,
      });
  }
}
