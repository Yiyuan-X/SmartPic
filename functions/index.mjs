import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { fetchAiNews } from "./ai-news-fetch.mjs";

setGlobalOptions({
  region: "us-central1",
  timeoutSeconds: 540,
  memory: "1GiB",
});

export const scheduledFetchAiNews = onSchedule("every day 06:00", async () => {
  console.log("🕒 Daily SmartPicture News Update...");
  await fetchAiNews();
});

export const manualRun = onRequest(async (req, res) => {
  const limit = Number(req.query.limit) || 6;
  try {
    const result = await fetchAiNews({ limit });
    res.json({ status: "success", url: result });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});
