import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SYSTEM_INSTRUCTION = `You are BizMind, a world-class business consultant and AI assistant.
Your expertise covers:
- Strategic planning and entrepreneurship.
- Logistics and supply chain management.
- Marketing, branding, and sales.
- Corporate finance and investment.
- Human resources and organizational culture.
- Business law and ethics.
- Economics and market analysis.

Your goal is to help businesses, students, and entrepreneurs make informed decisions, solve complex problems, and grow their ventures.
Be professional, analytical, yet encouraging. Provide structured answers (using Markdown, lists, and bold text) to ensure clarity.
When asked about specific domains you're an expert in, provide deep insights. If a topic is outside business, try to relate it back to a business context if possible, or politely maintain focus on your core expertise.

Always respond in the user's language. If they greet you in Spanish, respond in Spanish.`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    // We convert the message format to what Google GenAI expects
    // BizMind uses a stateless approach here for simplicity, 
    // but we send the history to the API.
    
    // Last message is the user prompt
    const userMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Prepare contents list for the API
    const contents = [
      ...history.map((h: any) => ({
        role: h.role,
        parts: h.parts
      })),
      { role: "user", parts: [{ text: userMessage }] }
    ];

    const result = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL
        }
      }
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the 'dist' directory relative to the current working directory
    const distPath = path.resolve(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    
    console.log(`[Production] Serving static files from: ${distPath}`);
    console.log(`[Production] Expected index.html at: ${indexPath}`);
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.type("html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Production] Error sending index.html: ${err.message}`);
          res.status(500).send("Error loading application. Please ensure the build completed successfully.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizMind server running on http://localhost:${PORT}`);
  });
}

startServer();
