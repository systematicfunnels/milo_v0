import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookAuth } from "@/lib/webhook-auth";

export async function POST(request: NextRequest) {
  const auth = verifyWebhookAuth(request);
  if (!auth.isValid) return auth.error!;

  try {
    const body = await request.json();
    const { reminder_id, status = "sent" } = body;

    if (!reminder_id) {
      return NextResponse.json({ error: "reminder_id required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: reminder, error } = await supabase
      .from("reminders")
      .update({
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", reminder_id)
      .select(`
        *,
        users:user_id (
          telegram_chat_id,
          whatsapp_phone,
          bot_name,
          email
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Reminder status updated to ${status}`,
      reminder: {
        id: reminder.id,
        message: reminder.message,
        reminder_time: reminder.reminder_time,
        platform: reminder.platform,
        status: reminder.status,
        sent_at: reminder.sent_at,
        user: reminder.users
      },
      action: "status_updated"
    });
  } catch (error) {
    console.error("Update reminder error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = verifyWebhookAuth(request);
  if (!auth.isValid) return auth.error!;

  try {
    const supabase = await createServiceClient();
    const now = new Date().toISOString();

    const { data: dueReminders, error } = await supabase
      .from("reminders")
      .select(`
        id,
        user_id,
        message,
        reminder_time,
        platform,
        status,
        created_at,
        users:user_id (
          id,
          email,
          telegram_chat_id,
          whatsapp_phone,
          bot_name
        )
      `)
      .eq("status", "pending")
      .lte("reminder_time", now)
      .order("reminder_time", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Fetch due reminders error:", error);
      return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }

    const formattedReminders = (dueReminders || []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      message: r.message,
      reminder_time: r.reminder_time,
      platform: r.platform,
      status: r.status,
      created_at: r.created_at,
      telegram_chat_id: r.users?.telegram_chat_id,
      whatsapp_phone: r.users?.whatsapp_phone,
      bot_name: r.users?.bot_name,
      user_email: r.users?.email,
    }));

    return NextResponse.json({
      success: true,
      reminders: formattedReminders,
      count: formattedReminders.length,
      checked_at: now,
      action: "due_reminders_fetched"
    });
  } catch (error) {
    console.error("Fetch due reminders error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
