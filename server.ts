import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
    // Convert message history to the format expected by the Google GenAI SDK
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    console.log(`[API] Calling Gemini with ${contents.length} messages...`);

    if (!process.env.GEMINI_API_KEY) {
      console.error("[API] GEMINI_API_KEY is not defined in the environment.");
      return res.status(500).json({ error: "Configuration error: Missing API Key" });
    }

    const result = await ai.models.generateContentStream({
      model: "gemini-1.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (error: any) {
    console.error("Chat error:", error);
    
    let errorMessage = "Lo siento, ocurrió un error al procesar tu consulta.";
    
    // Detect quota exceeded or rate limit errors
    if (error.message?.includes("429") || error.message?.toLowerCase().includes("quota") || error.message?.toLowerCase().includes("limit")) {
      errorMessage = "Has excedido el límite de consultas gratuitas de la IA por hoy. Por favor, intenta de nuevo en unos minutos o mañana.";
    }

    // If headers were already sent, we can't send a JSON response
    if (res.headersSent) {
      res.write(`\n\n[ERROR: ${errorMessage}]`);
      return res.end();
    }
    
    res.status(500).json({ error: errorMessage });
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
