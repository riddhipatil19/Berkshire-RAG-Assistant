# Berkshire Hathaway RAG Assistant

A Retrieval-Augmented Generation (RAG) system for answering questions using Berkshire Hathaway shareholder letters.

## Overview

This project implements a RAG system that processes PDF documents of Berkshire Hathaway shareholder letters, stores text embeddings in a vector database, and retrieves relevant context to answer user queries. When an OpenAI API key is provided, the system generates synthesized answers using a language model.

## Features

- PDF ingestion and text extraction
- Text chunking and embedding generation
- Vector storage using PostgreSQL with pgvector
- Semantic retrieval of relevant document passages
- Answer generation using language model
- Chat-style user interface
- Local chat history storage in browser

## Screenshots

### Chat Interface
![Chat Interface](screenshots/chat-interface.png)

### Mastra Studio
![Mastra Studio](screenshots/mastra-studio.png)

## Tech Stack

### Backend
- Mastra: AI agent and workflow framework
- Node.js: Runtime environment
- TypeScript: Type-safe development
- PostgreSQL with pgvector: Vector database
- OpenAI: Embeddings and language model (when API key provided)
- PDF.js: PDF parsing

### Frontend
- Next.js (App Router): React framework
- TypeScript: Type-safe development
- shadcn/ui: UI components
- Tailwind CSS: Styling
- Lucide React: Icons

## Project Structure

```
berkshire/
├── berkshire-rag-assistant/
│   ├── src/mastra/
│   │   ├── workflows/          # PDF ingestion, retrieval, and RAG workflows
│   │   └── services/           # Retrieval service
│   ├── data/berkshire_letters/ # PDF documents
│   └── package.json
└── berskshire_frontend/
    ├── app/                    # Next.js app directory
    ├── components/             # UI components
    └── package.json
```

## Local Setup

1. Clone the repository and navigate to the project directory.

2. Install backend dependencies:
   ```bash
   cd berkshire-rag-assistant
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../berskshire_frontend
   npm install
   ```

4. Set up PostgreSQL database with pgvector extension.

5. Create a `.env` file in `berkshire-rag-assistant` with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   OPENAI_API_KEY=your_api_key_here
   ```

6. Place Berkshire Hathaway letter PDFs in `berkshire-rag-assistant/data/berkshire_letters/`.

7. Run the ingestion workflow to process documents.

## Testing with Mastra Studio

Mastra provides a Studio UI for testing workflows:

1. Start the backend in development mode:
   ```bash
   cd berkshire-rag-assistant
   npm run dev
   ```

2. Open Mastra Studio 

3. Use the Studio interface to test workflows and API endpoints.

## API Key Behavior

- **With OpenAI API Key**: The system generates synthesized answers using the language model, combining retrieved context with AI reasoning.

API keys can be added or removed without code changes by updating the environment variables.

## Running the Application

1. Start the backend:
   ```bash
   cd berkshire-rag-assistant
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd berskshire_frontend
   npm run dev
   ```

3. Access the application at the frontend URL (typically http://localhost:3000).
