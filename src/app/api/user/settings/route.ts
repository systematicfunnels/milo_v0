import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

export async function PATCH(request: NextRequest) {
  try {
    const session = getUserFromToken(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { botName } = await request.json();
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from("users")
      .update({ 
        bot_name: botName,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.userId);

    if (error) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
