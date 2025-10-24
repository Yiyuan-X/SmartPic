import {onRequest} from "firebase-functions/v2/https";
import {Stripe} from "stripe";
import admin from "firebase-admin";
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {apiVersion:"2024-06-20"});

export const stripeWebhook = onRequest({cors:true}, async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(501).json({error:"Stripe not configured"});
  const sig = req.header("stripe-signature")!;
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err:any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const uid = session.client_reference_id as string;
    const amount = (session.amount_total ?? 0) / 100;
    const add = Math.round(amount * 10);
    await db.doc(`users/${uid}`).set({points: admin.firestore.FieldValue.increment(add)}, {merge:true});
  }
  res.json({received:true});
});
