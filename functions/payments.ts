/* eslint-disable */
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2/options";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
setGlobalOptions({ secrets: [STRIPE_SECRET_KEY] });

const stripe = new Stripe(STRIPE_SECRET_KEY.value());

export const stripeWebhook = onRequest(async (req: any, res: any) => {
  try {
    // 你的逻辑...
    res.status(200).send("ok");
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
