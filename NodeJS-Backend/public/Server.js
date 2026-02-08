import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

console.log("Loaded API KEY:", process.env.AIRIA_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const AIRIA_API_KEY = process.env.AIRIA_API_KEY;
const AGENT_ID = "821be54f-ff2f-4f8f-b30c-deecc74ef4a2";


// ======================================================
// CHAT ENDPOINT — Supports state, continue, history
// ======================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, state, continue: shouldContinue, history } = req.body;

    console.log("\n===== INCOMING REQUEST =====");
    console.log("User message:", message);
    console.log("State:", state);
    console.log("Continue flag:", shouldContinue);
    console.log("History length:", history?.length || 0);

    const response = await fetch(
      `https://api.airia.ai/v2/PipelineExecution/${AGENT_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": AIRIA_API_KEY,
        },
        body: JSON.stringify({
          userInput: message,
          state: state || "idle",
          continue: shouldContinue || false,
          history: history || [],
          asyncOutput: false
        }),
      }
    );

    const raw = await response.text();
    console.log("\n===== RAW RESPONSE FROM AIRIA =====");
    console.log(raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSON PARSE ERROR:", e);
      return res.status(500).json({
        error: "Airia returned invalid or empty JSON",
        raw,
      });
    }

    // Airia agent should return:
    // { reply: "...", nextState: "..." }
    const reply =
  data.reply ||
  data.result ||
  data.result?.reply ||
  data.output?.text ||
  data.output?.result ||
  data.output?.message ||
  data.response ||
  data.finalOutput ||
  data.agentResponse ||
  data.answer ||
  "No response from AI";

    const nextState =
      data.nextState ||
      data.result?.nextState ||
      data.output?.nextState ||
      null;

    console.log("\n===== CLEANED OUTPUT =====");
    console.log("Reply:", reply);
    console.log("Next State:", nextState);

    return res.json({
      reply,
      nextState
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); 
// ======================================================
// START SERVER
// ======================================================
const PORT = process.env.PORT || 7860;
app.listen(PORT, () => {
  console.log(`Backend running at:${PORT}`);
});