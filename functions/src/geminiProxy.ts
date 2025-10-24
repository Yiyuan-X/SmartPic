// functions/src/geminiProxy.js
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import fetch from "node-fetch";

/**
 * 安全加载 Google Vertex AI Gemini API Key
 * 你需要在 Firebase 中运行：
 *   firebase functions:secrets:set GEMINI_API_KEY
 */
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

/**
 * Gemini 2.5 Flash-Lite 代理接口
 * 用于从前端安全访问 Vertex AI，不暴露 API 密钥
 */
export const geminiProxy = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true },
  async (req, res) => {
    try {
      // 1️⃣ 获取用户请求的 prompt
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Missing 'prompt' in request body" });
        return;
      }

      // 2️⃣ 向 Gemini API 发送请求
      const response = await fetch(
        `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent?key=${GEMINI_API_KEY.value()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      // 3️⃣ 解析 Gemini 返回结果
      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      console.error("Gemini Proxy Error:", err);
      res.status(500).json({ error: "Gemini API request failed" });
    }
  }
);
