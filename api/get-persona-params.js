// api/get-persona-params.js
// This function fetches a summary of a personality's public persona from OpenAI.

// Import necessary libraries
import OpenAI from "openai";

// Load environment variables if running locally (dotenv is not needed in Vercel/Netlify production)
// require('dotenv').config();

// Initialize the OpenAI client
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
    // Craft the prompt to get the personality summary with more detail
    const messages = [
      {
        role: "system",
        content: `Describe the public persona of "${personalityName}" in detail. Focus on:
        - Key personality traits and characteristics.
        - Distinctive speaking style, tone, and common mannerisms or quirks.
        - Frequent topics, interests, or areas of expertise they are known for.
        - Any notable catchphrases or unique ways of expressing themselves.
        - Provide this information as a detailed summary or a list of specific traits and examples. Avoid making up information or stating opinions as facts. Base your description on widely perceived public image and known public statements.`,
      },
      {
        role: "user",
        content: `Provide a detailed public persona description for ${personalityName}.`,
      },
    ];

    // Call the OpenAI Chat Completions API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model
      messages: messages,
      max_tokens: 200, // Increase max tokens to allow for more detail
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
