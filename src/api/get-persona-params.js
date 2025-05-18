// api/get-persona-params.js
// This function fetches a summary of a personality's public persona from OpenAI.

// Import necessary libraries
// Use the appropriate import based on your Node.js environment (CommonJS or ES Modules)
// For Vercel/Netlify functions, ES Modules are often supported:
import OpenAI from "openai";
// For local testing with CommonJS:
// const OpenAI = require('openai');

// Load environment variables if running locally (dotenv is not needed in Vercel/Netlify production)
// require('dotenv').config();

// Initialize the OpenAI client
// The API key is automatically loaded from process.env.OPENAI_API_KEY in Vercel/Netlify
// If running locally with dotenv, ensure process.env.OPENAI_API_KEY is available
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Serverless function handler (standard format for Vercel/Netlify)
export default async function handler(req, res) {
  // Ensure the request method is POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract the personality name from the request body
  const { personalityName } = req.body;

  // Validate input
  if (!personalityName) {
    return res.status(400).json({ error: "Personality name is required" });
  }

  try {
    // Craft the prompt to get the personality summary
    const messages = [
      {
        role: "system",
        content: `Describe the public persona of "${personalityName}". Focus on key personality traits, common speaking style/tone, and frequent topics or references. Provide this information as a concise summary or a list of keywords and phrases. Avoid making up information or stating opinions as facts. Be neutral and base your description on widely perceived public image.`,
      },
      {
        role: "user",
        content: `Provide the public persona description for ${personalityName}.`,
      },
    ];

    // Call the OpenAI Chat Completions API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model like 'gpt-4-turbo' or 'gpt-3.5-turbo'
      messages: messages,
      max_tokens: 150, // Limit the length of the summary
      temperature: 0.7, // Controls randomness (lower is more focused)
    });

    // Extract the generated summary
    const summary = completion.choices[0].message.content.trim();

    // Return the summary in the response
    res.status(200).json({ summary: summary });
  } catch (error) {
    console.error("Error fetching personality parameters:", error);
    // Return an error response
    res.status(500).json({ error: "Failed to fetch personality parameters" });
  }
}
