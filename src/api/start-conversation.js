// api/start-conversation.js
// This function starts the conversation by generating the first message,
// generating its audio, uploading to S3, and returning a pre-signed URL.

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

  const { personalities, topic, personalityParams } = req.body;

  if (
    !personalities ||
    personalities.length !== 2 ||
    !topic ||
    !personalityParams ||
    Object.keys(personalityParams).length !== 2
  ) {
    return res.status(400).json({
      error:
        "Invalid input parameters: personalities, topic, or personalityParams missing/incorrect.",
    });
  }

  const [p1Name, p2Name] = personalities;
  const p1Params = personalityParams[p1Name];
  const p2Params = personalityParams[p2Name];

  if (!p1Params || !p2Params) {
    return res.status(400).json({
      error: "Personality parameters missing for one or more personalities.",
    });
  }

  try {
    // --- Step 1: Generate the first message using Chat Completions ---
    const chatMessages = [
      {
        role: "system",
        content: `Simulate a podcast conversation between two individuals about "${topic}".

        Individual 1 is ${p1Name}. Their public persona is perceived as: ${p1Params}
        Individual 2 is ${p2Name}. Their public persona is perceived as: ${p2Params}

        They should take turns speaking, reflecting their described personas, tone, and references. Keep each turn relatively short, like a natural conversation opening. ${p1Name} should speak first.`,
      },
      {
        role: "user",
        content: `Start the conversation about ${topic}.`,
      },
    ];

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model
      messages: chatMessages,
      max_tokens: 100,
      temperature: 0.8,
    });

    const firstMessageText = chatCompletion.choices[0].message.content.trim();
    const speaker = p1Name; // Assuming p1Name speaks first as per prompt

    // --- Step 2: Generate audio for the first message using Text-to-Speech ---
    const voice1 = "alloy"; // Example voice for personality 1
    const voice2 = "fable"; // Example voice for personality 2
    const selectedVoice = speaker === p1Name ? voice1 : voice2;

    const audioResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice,
      input: firstMessageText,
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

    // Return the message text and audio URL
    res.status(200).json({
      speaker: speaker,
      text: firstMessageText,
      audioUrl: audioUrl, // Return the S3 pre-signed URL
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({
      error: `Failed to start conversation due to an internal error: ${error.message}`,
    });
  }
}
