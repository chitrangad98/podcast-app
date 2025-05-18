// api/get-conversations.js
// This function fetches a list of all saved conversations from DynamoDB.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

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

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

export default async function handler(req, res) {
  // Ensure the request method is GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Prepare the Scan command parameters
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    // Use Expression Attribute Names for reserved keywords like 'timestamp'
    ProjectionExpression: "conversationId, personalities, topic, #ts",
    ExpressionAttributeNames: {
      "#ts": "timestamp", // Define an alias for the 'timestamp' attribute
    },
  };

  try {
    // Use the ScanCommand to get all items from the table
    const data = await ddbDocClient.send(new ScanCommand(params));

    // Return the list of conversations
    res.status(200).json({ conversations: data.Items || [] });
  } catch (error) {
    console.error("Error fetching conversations from DynamoDB:", error);
    // Return an error response
    res
      .status(500)
      .json({ error: `Failed to fetch conversations: ${error.message}` });
  }
}
