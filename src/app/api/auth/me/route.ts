import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ user: null });
    }

    const token = authHeader.split(" ")[1];
    
    let session;
    try {
      session = JSON.parse(Buffer.from(token, "base64").toString());
    } catch {
      return NextResponse.json({ user: null });
    }
    
    if (session.exp < Date.now()) {
      return NextResponse.json({ user: null });
    }

    const supabase = await createServiceClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, bot_name, whatsapp_connected, telegram_connected, telegram_chat_id, whatsapp_phone")
      .eq("id", session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        botName: user.bot_name,
        whatsappConnected: user.whatsapp_connected,
        telegramConnected: user.telegram_connected,
        telegramChatId: user.telegram_chat_id,
        whatsappPhone: user.whatsapp_phone,
      }
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
