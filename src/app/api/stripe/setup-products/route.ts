import { NextRequest, NextResponse } from "next/server";
import { stripe, SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const proProduct = await stripe.products.create({
      name: "Milo Pro",
      description: "Unlimited reminders, 100 API calls/day, Priority support",
    });
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: SUBSCRIPTION_TIERS.pro.price,
      currency: "usd",
      recurring: { interval: "month" },
    });

    const enterpriseProduct = await stripe.products.create({
      name: "Milo Enterprise",
      description: "Unlimited reminders, Unlimited API calls, Team features, API access",
    });
    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: SUBSCRIPTION_TIERS.enterprise.price,
      currency: "usd",
      recurring: { interval: "month" },
    });

    return NextResponse.json({
      success: true,
      products: {
        pro: { productId: proProduct.id, priceId: proPrice.id },
        enterprise: { productId: enterpriseProduct.id, priceId: enterprisePrice.id },
      },
      message: "Add these to your .env: STRIPE_PRO_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID",
    });
  } catch (error) {
    console.error("Error creating Stripe products:", error);
    return NextResponse.json({ error: "Failed to create products" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { stripe, SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const proProduct = await stripe.products.create({
      name: "Milo Pro",
      description: "Unlimited reminders, 100 API calls/day, Priority support",
    });
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: SUBSCRIPTION_TIERS.pro.price,
      currency: "usd",
      recurring: { interval: "month" },
    });

    const enterpriseProduct = await stripe.products.create({
      name: "Milo Enterprise",
      description: "Unlimited reminders, Unlimited API calls, Team features, API access",
    });
    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: SUBSCRIPTION_TIERS.enterprise.price,
      currency: "usd",
      recurring: { interval: "month" },
    });

    return NextResponse.json({
      success: true,
      products: {
        pro: { productId: proProduct.id, priceId: proPrice.id },
        enterprise: { productId: enterpriseProduct.id, priceId: enterprisePrice.id },
      },
      message: "Add these to your .env: STRIPE_PRO_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID",
    });
  } catch (error) {
    console.error("Error creating Stripe products:", error);
    return NextResponse.json({ error: "Failed to create products" }, { status: 500 });
  }
}
