import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Fast text advisor endpoint for executive insights
  app.post("/api/ai/advisor", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const { prompt, systemContext } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt || "Provide an executive daily priority assessment.",
        config: {
          systemInstruction: systemContext || `You are EVOLVE OS Executive Advisor. Provide concise, high-clarity tactical guidance. When writing or responding in Georgian, use grammatically flawless, natural, executive Georgian with correct case and verb agreements, keeping simple international terms (Task, CRM, Pipeline, etc.) where appropriate.`,
        },
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Advisor error:", error);
      return res.status(500).json({ error: error.message || "Advisor error" });
    }
  });

  // WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("connection", async (clientWs) => {
    console.log("[Live API] Client connected to /api/live");

    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is not set on the server." }));
      clientWs.close();
      return;
    }

    let session: any = null;

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: `You are EVOLVE OS Chief of Staff - an elite, hyper-competent executive partner and strategic Chief of Staff.
Your role:
- Conduct sharp morning executive briefings (highlighting today's top priorities, daily revenue target, routine discipline, workout block).
- Act as a sparring partner for high-value client negotiations, pricing, and strategic decisions.
- Conduct evening debriefs (what needle was moved, what money was locked in, what needs attention tomorrow).
- Communicate with brevity, razor-sharp focus, calm confidence, and executive authority.

CRITICAL LINGUISTIC & GRAMMAR DIRECTIVES FOR GEORGIAN (ქართული ენა და ვოისოვერი):
- When interacting or generating voice in Georgian, your speech MUST be grammatically pristine, natural, and eloquent (სრულყოფილად გამართული, ცოცხალი და დახვეწილი ქართული მეტყველება).
- Use proper Georgian case endings (ბრუნვები: სახელობითი, მოთხრობითი, მიცემითი და ა.შ.) and correct subject-verb-object agreement (ზმნური შეთანხმება).
- STRICTLY AVOID clumsy, robotic word-for-word machine translations or awkward literal calques from English. Speak with the natural cadence of a high-caliber Georgian executive.
- Keep simple, established international professional terms in English where natural (e.g., Task, CRM, Pipeline, Cash, Follow-up, Deadline, Project), while seamlessly integrating them into fluent, grammatically correct Georgian sentences.
- When spoken to in Georgian, always respond in immaculate Georgian. When spoken to in English, respond in English. Keep spoken voiceover responses concise, crisp, and actionable.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Audio response parts
            const audioData =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }

            // User speech interruption
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }

            // Text output if model returned text
            const textData = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (textData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ text: textData }));
            }
          },
          onclose: () => {
            console.log("[Live API] Session closed by Gemini");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
          onerror: (err) => {
            console.error("[Live API] Session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: err.message || "Session error" }));
            }
          },
        },
      });

      // Notify client that connection to Gemini Live is established
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ status: "connected", model: "gemini-3.1-flash-live-preview" }));
      }

      clientWs.on("message", (raw) => {
        try {
          const payload = JSON.parse(raw.toString());

          if (payload.audio && session) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (payload.text && session) {
            session.sendRealtimeInput({
              text: payload.text,
            });
          } else if (payload.systemContext && session) {
            session.sendRealtimeInput({
              text: `[SYSTEM_CONTEXT_UPDATE: ${payload.systemContext}]`,
            });
          }
        } catch (e) {
          console.error("[Live API] Error processing client packet:", e);
        }
      });

      clientWs.on("close", () => {
        console.log("[Live API] Client disconnected");
        try {
          session?.close?.();
        } catch (e) {}
      });
    } catch (err: any) {
      console.error("[Live API] Initialization error:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err.message || "Failed to initialize Gemini Live API session" }));
        clientWs.close();
      }
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`EVOLVE OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
