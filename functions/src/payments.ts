import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const createCheckoutSession = onRequest(async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Gemini AI Access" },
            unit_amount: 1000
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel"
    });

    res.json({ id: session.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
