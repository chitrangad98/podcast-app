// api/get-conversation/[conversationId].js
// This function fetches a specific saved conversation by ID from DynamoDB
// and generates fresh pre-signed S3 URLs for the audio files.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import AWS from "aws-sdk"; // Import AWS SDK for S3 URL generation

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

// Create a DynamoDB Document Client
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Configure AWS S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME; // Get S3 bucket name from env

export default async function handler(req, res) {
  // Ensure the request method is GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract the conversation ID from the request path/query
  const { conversationId } = req.query;

  // Validate input
  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required." });
  }

  // Prepare the GetCommand parameters to fetch the conversation from DynamoDB
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      conversationId: conversationId, // Specify the Partition Key value
    },
  };

  try {
    // --- Step 1: Fetch the conversation item from DynamoDB ---
    console.log(`Workspaceing conversation ${conversationId} from DynamoDB...`);
    const data = await ddbDocClient.send(new GetCommand(params));
    console.log("Raw data fetched from DynamoDB:", data); // *** Add this console log ***

    // Check if an item was found
    if (!data.Item) {
      console.log(`Conversation ${conversationId} not found in DB.`);
      return res.status(404).json({ error: "Conversation not found." });
    }

    const savedConversation = data.Item;
    console.log("Conversation item fetched:", savedConversation); // Log the item

    // --- Step 2: Generate fresh pre-signed S3 URLs for each message's audio ---
    console.log("Generating S3 URLs...");
    if (
      savedConversation.messages &&
      Array.isArray(savedConversation.messages)
    ) {
      for (const message of savedConversation.messages) {
        console.log("Processing message for S3 URL:", message); // Log each message being processed
        // Assuming the saved message object includes the S3 Key (filename)
        if (message.audioKey) {
          console.log(`Generating URL for audioKey: ${message.audioKey}`);
          try {
            // Generate a new pre-signed URL for the S3 object Key
            const newAudioUrl = s3.getSignedUrl("getObject", {
              Bucket: S3_BUCKET_NAME,
              Key: message.audioKey, // Use the stored S3 Key
              Expires: 60 * 15, // New URL expires in 15 minutes (adjust as needed)
            });
            // Update the message object with the new URL
            message.audioUrl = newAudioUrl;
            console.log(`Generated URL: ${newAudioUrl}`);
          } catch (s3Error) {
            console.error(
              `Error generating pre-signed URL for key ${message.audioKey}:`,
              s3Error
            );
            // If URL generation fails, set audioUrl to null
            message.audioUrl = null;
          }
        } else {
          console.log("audioKey not found on message:", message);
          // If no audioKey is present, ensure audioUrl is null or undefined
          message.audioUrl = null;
        }
      }
    } else {
      console.log(
        "No messages array found on conversation:",
        savedConversation
      );
    }

    // --- Step 3: Return the fetched conversation item with refreshed URLs ---
    console.log("Returning conversation with updated URLs:", savedConversation);
    res.status(200).json({ conversation: savedConversation });
  } catch (error) {
    console.error(
      `Error fetching conversation ${conversationId} from DynamoDB or generating S3 URLs:`,
      error
    );
    // Return an error response
    res
      .status(500)
      .json({ error: `Failed to fetch conversation: ${error.message}` });
  }
}
