import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Initialize Gemini outside startServer so it can be used if needed, but it's better to keep it close to usage
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

async function startServer() {
  const app = express();
  
  // Important: express.json() MUST come before any routes that use it
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("[API] GEMINI_API_KEY is not defined in the environment.");
      return res.status(500).json({ error: "Configuration error: Missing API Key" });
    }

    try {
      // Convert message history to the format expected by the Google GenAI SDK
      const contents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      console.log(`[API] calling Gemini (gemini-1.5-flash): ${contents.length} messages`);

      const result = await ai.models.generateContentStream({
        model: "gemini-1.5-flash",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(text);
        }
      }

      res.end();
    } catch (error: any) {
      console.error("Chat error detail:", error);
      
      let errorMessage = "Lo siento, ocurrió un error al procesar tu consulta.";
      
      // Detect quota exceeded or rate limit errors
      const errStr = String(error.message || "").toLowerCase();
      const status = error.status || (error.response && error.response.status);
      
      if (status === 429 || errStr.includes("429") || errStr.includes("quota") || errStr.includes("limit") || errStr.includes("exhausted")) {
        errorMessage = "Has excedido el límite de consultas gratuitas de la IA por hoy. Por favor, intenta de nuevo en unos minutos o mañana.";
        res.status(429);
      } else {
        res.status(500);
      }

      // If headers were already sent, we can't send a JSON response
      if (res.headersSent) {
        res.write(`\n\n[ERROR: ${errorMessage}]`);
        return res.end();
      }
      
      res.json({ error: errorMessage });
    }
  });

  // Contact endpoint
  app.post("/api/contact", (req, res) => {
    const { subject, email, comment } = req.body;
    
    if (!subject || !email || !comment) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    console.log(`[CONTACT FORM SUBMITTED]
      Asunto: ${subject}
      Remitente: ${email}
      Comentario: ${comment}
    `);

    return res.json({ success: true });
  });

  // Prevent fallthrough of missing API routes to the SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
  });

  // Vite/Production middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizMind server running on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
