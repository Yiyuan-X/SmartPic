import { onRequest } from "firebase-functions/v2/https";

export const geminiProxy = onRequest(async (req, res) => {
  res.json({ message: "Gemini Proxy is alive!" });
});
