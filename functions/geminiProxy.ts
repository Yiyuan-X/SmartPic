/* eslint-disable */
import { onRequest } from "firebase-functions/v2/https";

export const geminiProxy = onRequest(async (req: any, res: any) => {
  res.json({ message: "Gemini Proxy is alive!" });
});
