import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

function getSessionFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const session = JSON.parse(Buffer.from(token, "base64").toString());
    if (session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromToken(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const { data: userData, error } = await supabase
      .from("users")
      .select("subscription_tier, subscription_status, stripe_subscription_id, subscription_current_period_end, reminders_count_this_month, api_calls_today")
      .eq("id", session.userId)
      .single();

    if (error) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeSubscription = null;
    if (userData?.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);
      } catch (e) {
        console.error("Error fetching subscription:", e);
      }
    }

    return NextResponse.json({
      tier: userData?.subscription_tier || "free",
      status: userData?.subscription_status || "active",
      currentPeriodEnd: userData?.subscription_current_period_end,
      remindersUsed: userData?.reminders_count_this_month || 0,
      apiCallsUsed: userData?.api_calls_today || 0,
      stripeSubscription: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
