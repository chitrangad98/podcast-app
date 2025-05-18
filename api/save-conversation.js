// api/save-conversation.js
// This function receives conversation data and saves it to DynamoDB.
// It ensures that the S3 Key for audio is saved, not just the temporary URL.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid"; // For generating a unique conversation ID

// require('dotenv').config(); // For local development

// Configure DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    // Use credentials from environment variables
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create a DynamoDB Document Client for easier data manipulation
const ddbDocClient = DynamoDBDocumentClient.from(client);

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

export default async function handler(req, res) {
  // Ensure the request method is POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract conversation data from the request body
  const { personalities, topic, timestamp, messages } = req.body;

  console.log("Received data in save-conversation:", req.body); // *** Add this console log ***
  console.log("Received messages array:", messages); // *** Add this console log ***

  // Validate input
  if (
    !personalities ||
    personalities.length === 0 ||
    !topic ||
    !timestamp ||
    !messages ||
    messages.length === 0
  ) {
    console.error("Invalid input received for save-conversation.");
    return res
      .status(400)
      .json({ error: "Invalid conversation data provided." });
  }

  // Generate a unique ID for the conversation
  const conversationId = uuidv4(); // Or use a timestamp-based ID

  // Prepare the item to be saved in DynamoDB
  const params = {
    TableName: DYNAMODB_TABLE_NAME, // Typo fixed here, should be DYNAMODB_TABLE_NAME
    Item: {
      conversationId: conversationId, // Partition Key
      personalities: personalities,
      topic: topic,
      timestamp: timestamp,
      messages: messages.map((msg) => ({
        // Map messages to ensure only necessary data is saved
        speaker: msg.speaker,
        text: msg.text,
        audioKey: msg.audioKey || null, // Ensure audioKey is explicitly included here
      })),
    },
  };
  console.log("Saving item to DynamoDB:", params.Item); // Log the item being saved

  try {
    // Use the PutCommand to save the item to DynamoDB
    await ddbDocClient.send(new PutCommand(params));

    // Return a success response, maybe including the new conversation ID
    res.status(200).json({
      message: "Conversation saved successfully!",
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("Error saving conversation to DynamoDB:", error);
    // Return an error response
    res
      .status(500)
      .json({ error: `Failed to save conversation: ${error.message}` });
  }
}
