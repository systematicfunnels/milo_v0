import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookAuth } from "@/lib/webhook-auth";

export async function GET(request: NextRequest) {
  const auth = verifyWebhookAuth(request);
  if (!auth.isValid) return auth.error!;

  try {
    const supabase = await createServiceClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: verifiedUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);

    const { count: totalReminders } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true });

    const { count: sentReminders } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent");

    const { count: pendingReminders } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: failedReminders } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    const { count: remindersSentToday } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", todayISO);

    const { count: remindersCreatedToday } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayISO);

    const { count: whatsappUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("whatsapp_connected", true);

    const { count: telegramUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("telegram_connected", true);

    const { count: proUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("subscription_tier", "pro");

    const { count: enterpriseUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("subscription_tier", "enterprise");

    const { data: recentReminders } = await supabase
      .from("reminders")
      .select("id, message, reminder_time, platform, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: recentUsers } = await supabase
      .from("users")
      .select("id, email, created_at, whatsapp_connected, telegram_connected, subscription_tier")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
          verified: verifiedUsers || 0,
          whatsapp_connected: whatsappUsers || 0,
          telegram_connected: telegramUsers || 0,
          pro_subscribers: proUsers || 0,
          enterprise_subscribers: enterpriseUsers || 0,
        },
        reminders: {
          total: totalReminders || 0,
          pending: pendingReminders || 0,
          sent: sentReminders || 0,
          failed: failedReminders || 0,
          sent_today: remindersSentToday || 0,
          created_today: remindersCreatedToday || 0,
        },
        platforms: {
          whatsapp_users: whatsappUsers || 0,
          telegram_users: telegramUsers || 0,
        },
      },
      recent: {
        reminders: recentReminders || [],
        users: recentUsers || [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
