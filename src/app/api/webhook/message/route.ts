import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookAuth } from "@/lib/webhook-auth";
import { parseReminderFromNaturalLanguage } from "@/lib/ai-parser";

export async function POST(request: NextRequest) {
  const auth = verifyWebhookAuth(request);
  if (!auth.isValid) return auth.error!;

  try {
    const body = await request.json();
    const { 
      platform,
      sender_id,
      chat_id,
      phone,
      message_text,
      title,
      date,
      time,
      user_id,
      location,
      timezone = "Asia/Kolkata",
      action = "create_reminder",
      use_ai_parsing = true
    } = body;


    const supabase = await createServiceClient();

    if (action === "connect") {
      if (platform === "telegram" && chat_id) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("telegram_chat_id", chat_id)
          .single();

        if (existingUser) {
          return NextResponse.json({ 
            success: true, 
            message: "Already connected!",
            user_id: existingUser.id,
            action: "already_connected"
          });
        }

        if (user_id) {
          const { data: user, error } = await supabase
            .from("users")
            .update({
              telegram_connected: true,
              telegram_chat_id: chat_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user_id)
            .select()
            .single();

          if (error) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
          }

          return NextResponse.json({ 
            success: true, 
            message: `Connected to Telegram!`,
            user_id: user.id,
            action: "connected"
          });
        }

        return NextResponse.json({ 
          success: false, 
          message: "Please sign up first at our website",
          action: "signup_required"
        });
      }

      if (platform === "whatsapp" && phone) {
        const normalizedPhone = phone.replace(/\D/g, "");
        
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("whatsapp_phone", normalizedPhone)
          .single();

        if (existingUser) {
          return NextResponse.json({ 
            success: true, 
            message: "Already connected!",
            user_id: existingUser.id,
            action: "already_connected"
          });
        }

        if (user_id) {
          const { data: user, error } = await supabase
            .from("users")
            .update({
              whatsapp_connected: true,
              whatsapp_phone: normalizedPhone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user_id)
            .select()
            .single();

          if (error) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
          }

          return NextResponse.json({ 
            success: true, 
            message: `Connected to WhatsApp!`,
            user_id: user.id,
            action: "connected"
          });
        }

        return NextResponse.json({ 
          success: false, 
          message: "Please sign up first at our website",
          action: "signup_required"
        });
      }

      return NextResponse.json({ error: "Invalid connection request" }, { status: 400 });
    }

    if (action === "create_reminder") {
      let reminderMessage = message_text || title || "";
      let reminderTime: Date | null = null;
      let reminderLocation = location || null;

      if (use_ai_parsing && reminderMessage && (!date || !time)) {
        const parsed = await parseReminderFromNaturalLanguage(reminderMessage, timezone);
        
        if (!parsed.is_reminder) {
          return NextResponse.json({
            success: false,
            error: parsed.error_message || "This doesn't look like a reminder request. Try: 'remind me tomorrow at 3pm to call mom'",
            action: "not_a_reminder",
            hint: "Say something like: 'remind me tomorrow at 3pm to call mom' or 'याद दिलाओ कल 9 बजे meeting है'"
          }, { status: 400 });
        }

        reminderMessage = parsed.message;
        reminderLocation = parsed.location || reminderLocation;
        
        if (parsed.date && parsed.time) {
          try {
            reminderTime = new Date(`${parsed.date}T${parsed.time}`);
            if (isNaN(reminderTime.getTime())) {
              reminderTime = null;
            }
          } catch {
            reminderTime = null;
          }
        }
      } else if (date && time) {
        try {
          reminderTime = new Date(`${date}T${time}`);
          if (isNaN(reminderTime.getTime())) {
            reminderTime = null;
          }
        } catch {
          reminderTime = null;
        }
      }

      if (!reminderMessage) {
        return NextResponse.json({ 
          error: "Missing message or title",
          action: "missing_data"
        }, { status: 400 });
      }

      if (!reminderTime) {
        return NextResponse.json({ 
          error: "Could not parse date/time. Please try: 'remind me tomorrow at 3pm to call mom'",
          action: "invalid_datetime"
        }, { status: 400 });
      }

      let userQuery;
      if (platform === "telegram" && (chat_id || sender_id)) {
        userQuery = supabase
          .from("users")
          .select("id, subscription_tier, reminders_count_this_month")
          .eq("telegram_chat_id", chat_id || sender_id)
          .single();
      } else if (platform === "whatsapp" && phone) {
        const normalizedPhone = phone.replace(/\D/g, "");
        userQuery = supabase
          .from("users")
          .select("id, subscription_tier, reminders_count_this_month")
          .eq("whatsapp_phone", normalizedPhone)
          .single();
      } else if (user_id) {
        userQuery = supabase
          .from("users")
          .select("id, subscription_tier, reminders_count_this_month")
          .eq("id", user_id)
          .single();
      } else {
        return NextResponse.json({ 
          error: "User identifier required (chat_id, phone, or user_id)",
          action: "missing_user"
        }, { status: 400 });
      }

      const { data: user, error: userError } = await userQuery;

      if (userError || !user) {
        return NextResponse.json({ 
          error: "User not connected. Please connect your account first.",
          action: "connect_required"
        }, { status: 404 });
      }

      const tier = user.subscription_tier || "free";
      const reminderLimit = tier === "free" ? 5 : -1;
      const currentCount = user.reminders_count_this_month || 0;

      if (reminderLimit > 0 && currentCount >= reminderLimit) {
        return NextResponse.json({ 
          error: `You've reached your monthly limit of ${reminderLimit} reminders. Upgrade to Pro for unlimited reminders!`,
          action: "limit_reached",
          limit: reminderLimit,
          used: currentCount
        }, { status: 403 });
      }

        const { data: reminder, error: reminderError } = await supabase
          .from("reminders")
          .insert({
            user_id: user.id,
            message: reminderMessage,
            reminder_time: reminderTime.toISOString(),
            platform: platform || "telegram",
            status: "pending",
            location: reminderLocation,
          })
          .select()
          .single();


      if (reminderError) {
        console.error("Reminder insert error:", reminderError);
        return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
      }

      await supabase
        .from("users")
        .update({ 
          reminders_count_this_month: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        message: `Reminder set for ${reminderTime.toLocaleString()}`,
        reminder: {
          id: reminder.id,
          message: reminder.message,
          reminder_time: reminder.reminder_time,
          platform: reminder.platform,
          status: reminder.status
        },
        action: "reminder_created"
      });
    }

    if (action === "list_reminders") {
      let userQuery;
      if (platform === "telegram" && (chat_id || sender_id)) {
        userQuery = supabase
          .from("users")
          .select("id")
          .eq("telegram_chat_id", chat_id || sender_id)
          .single();
      } else if (platform === "whatsapp" && phone) {
        const normalizedPhone = phone.replace(/\D/g, "");
        userQuery = supabase
          .from("users")
          .select("id")
          .eq("whatsapp_phone", normalizedPhone)
          .single();
      } else if (user_id) {
        userQuery = supabase
          .from("users")
          .select("id")
          .eq("id", user_id)
          .single();
      } else {
        return NextResponse.json({ error: "User identifier required" }, { status: 400 });
      }

      const { data: user, error: userError } = await userQuery;
      if (userError || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const { data: reminders, error: remindersError } = await supabase
        .from("reminders")
        .select("id, message, reminder_time, platform, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("reminder_time", { ascending: true })
        .limit(10);

      if (remindersError) {
        return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        reminders: reminders || [],
        count: reminders?.length || 0,
        action: "reminders_listed"
      });
    }

    if (action === "cancel_reminder") {
      const { reminder_id } = body;
      if (!reminder_id) {
        return NextResponse.json({ error: "reminder_id required" }, { status: 400 });
      }

      const { data: reminder, error } = await supabase
        .from("reminders")
        .update({ status: "cancelled" })
        .eq("id", reminder_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Reminder cancelled",
        reminder,
        action: "reminder_cancelled"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = verifyWebhookAuth(request);
  if (!auth.isValid) return auth.error!;

  return NextResponse.json({
    status: "ok",
    message: "Message webhook is running with AI-powered natural language parsing",
    supported_actions: ["connect", "create_reminder", "list_reminders", "cancel_reminder"],
    expected_fields: {
      connect: ["platform", "chat_id/phone", "user_id (optional)"],
      create_reminder: {
        required: ["platform", "chat_id/phone/user_id", "message_text"],
        optional: ["date", "time", "timezone", "use_ai_parsing"],
        note: "If date/time not provided, AI will parse from message_text (e.g., 'remind me tomorrow at 3pm to call mom')"
      },
      list_reminders: ["platform", "chat_id/phone/user_id"],
      cancel_reminder: ["reminder_id"]
    },
    ai_parsing: {
      enabled: true,
      supported_languages: ["English", "Hindi"],
      examples: [
        "remind me tomorrow at 3pm to call mom",
        "याद दिलाओ कल सुबह 9 बजे दवाई लेनी है",
        "set reminder for meeting in 2 hours",
        "remind me next Monday at 10am to submit report"
      ]
    }
  });
}
