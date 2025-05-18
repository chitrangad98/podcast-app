# Podcast Conversation App

A Next.js application that generates AI-powered podcast conversations between two personalities on any given topic.

## Features

- Generate natural conversations between two AI personalities
- Text-to-speech conversion of conversations
- Audio file storage using AWS S3
- Dynamic personality customization
- Real-time conversation generation

## Tech Stack

- Next.js
- OpenAI API (GPT-4 and Text-to-Speech)
- AWS S3 for audio storage
- Node.js

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_bucket_name
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /api/start-conversation

Starts a new conversation between two personalities.

**Request Body:**

```json
{
  "personalities": ["Personality1", "Personality2"],
  "topic": "Conversation Topic",
  "personalityParams": {
    "Personality1": "Description of personality 1",
    "Personality2": "Description of personality 2"
  }
}
```

**Response:**

```json
{
  "speaker": "Personality1",
  "text": "Generated conversation text",
  "audioUrl": "S3 pre-signed URL for audio"
}
```

## License

MIT
