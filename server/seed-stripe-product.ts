/**
 * Run this script to create the £1.99/month subscription product in Stripe.
 * Usage: npx tsx server/seed-stripe-product.ts
 */
import { getUncachableStripeClient } from "./stripeClient";

async function seedProduct() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'Humanity Hub Daily Check-In'" });
  if (existing.data.length > 0) {
    console.log("Product already exists:", existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    console.log("Prices:", prices.data.map((p) => `${p.id} — ${p.unit_amount} ${p.currency}`));
    return;
  }

  const product = await stripe.products.create({
    name: "Humanity Hub Daily Check-In",
    description: "Track your daily wellbeing: mood, stress, energy, motivation and productivity.",
    metadata: { feature: "daily_checkin" },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 199,
    currency: "gbp",
    recurring: { interval: "month" },
  });

  console.log("Created product:", product.id);
  console.log("Created price:", price.id, "— £1.99/month");
  console.log("\nSet this in your environment: STRIPE_PRICE_ID=" + price.id);
}

seedProduct().catch(console.error);
