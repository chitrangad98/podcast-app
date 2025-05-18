// api/continue-conversation.js
// This function continues the conversation, generates the next message and audio,
// uploads to S3, and returns a pre-signed URL.

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

        They should take turns speaking, reflecting their described personas, tone, and references. Keep each turn relatively short. Continue the dialogue based on the previous messages. The next speaker should respond to the last message.`,
    };

    const apiHistoryMessages = [systemMessage];
    conversationHistory.forEach((msg, index) => {
      // Alternate roles for the historical turns.
      const role = index % 2 === 0 ? "user" : "assistant";
      apiHistoryMessages.push({
        role: role,
        content: `${msg.speaker}: ${msg.text}`,
      });
    });

    // Determine the next speaker based on the last speaker in the history
    const lastSpeaker =
      conversationHistory[conversationHistory.length - 1].speaker;
    const nextSpeaker = lastSpeaker === p1Name ? p2Name : p1Name;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model
      messages: apiHistoryMessages,
      max_tokens: 100,
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
    const filename = `${S3_FOLDER}${uuidv4()}.mp3`; // Unique filename
    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: filename,
      Body: audioBuffer,
      ContentType: "audio/mpeg", // Important for playback
    };

    await s3.upload(uploadParams).promise(); // Upload the file

    // Generate a pre-signed URL for the uploaded object
    const audioUrl = s3.getSignedUrl("getObject", {
      Bucket: S3_BUCKET_NAME,
      Key: filename,
      Expires: 60 * 5, // URL expires in 5 minutes (adjust as needed)
    });

    // Return the next message text and audio URL
    res.status(200).json({
      speaker: nextSpeaker,
      text: nextMessageText,
      audioUrl: audioUrl, // Return the S3 pre-signed URL
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
