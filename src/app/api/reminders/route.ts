import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkReminderLimit, incrementReminderCount } from "@/lib/rate-limit";

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

export async function GET(request: NextRequest) {
  try {
    const session = getUserFromToken(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }

    return NextResponse.json({ reminders });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getUserFromToken(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkReminderLimit(session.userId);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: "Reminder limit reached", 
        message: `You've used all ${rateLimit.limit} reminders this month. Upgrade to Pro for unlimited reminders!`,
        remaining: 0,
        limit: rateLimit.limit,
        resetAt: rateLimit.resetAt,
      }, { status: 429 });
    }

    const { message, reminderTime, platform } = await request.json();

    if (!message || !reminderTime || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({
        user_id: session.userId,
        message,
        reminder_time: reminderTime,
        platform,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
    }

    await incrementReminderCount(session.userId);

    return NextResponse.json({ 
      reminder, 
      remaining: rateLimit.remaining,
      limit: rateLimit.limit,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
