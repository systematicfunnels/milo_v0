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

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromToken(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: "Price ID required" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user.id },
    });

    // Properly handle expanded types
    let latestInvoice = subscription.latest_invoice as any;
    
    if (typeof latestInvoice === "string") {
      console.log("Invoice not expanded, fetching manually...");
      latestInvoice = await stripe.invoices.retrieve(latestInvoice, {
        expand: ["payment_intent"],
      });
    }

    console.log("Subscription details:", {
      id: subscription.id,
      status: subscription.status,
      invoiceId: latestInvoice?.id,
      amountDue: latestInvoice?.amount_due,
      total: latestInvoice?.total,
      paymentIntentId: typeof latestInvoice?.payment_intent === "string" ? latestInvoice.payment_intent : latestInvoice?.payment_intent?.id,
      hasPaymentIntent: !!latestInvoice?.payment_intent
    });

    if (!latestInvoice) {
      return NextResponse.json({ error: "Failed to retrieve subscription invoice" }, { status: 500 });
    }

    let paymentIntent = latestInvoice.payment_intent;

    // If payment intent is still a string, retrieve it
    if (typeof paymentIntent === "string") {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
    }

    if (!paymentIntent) {
      // If payment intent is missing, it might be a $0 invoice or trial
      if (latestInvoice.amount_due === 0 || latestInvoice.total === 0) {
        return NextResponse.json({
          subscriptionId: subscription.id,
          clientSecret: null, // No payment needed now
          status: "active"
        });
      }
      
      console.error("Payment intent missing for non-zero invoice:", {
        amountDue: latestInvoice.amount_due,
        total: latestInvoice.total,
        invoiceId: latestInvoice.id
      });
      return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
    }

    if (!paymentIntent.client_secret) {
      console.error("Payment intent missing client secret:", paymentIntent.id);
      return NextResponse.json({ error: "Payment intent missing client secret" }, { status: 500 });
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
