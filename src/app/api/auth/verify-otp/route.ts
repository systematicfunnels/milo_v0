import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    let { email, otp } = await request.json();
    
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    email = email.toLowerCase().trim();

    const supabase = await createServiceClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      console.error(`Verification failed: User not found for email ${email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.otp_code !== otp) {
      console.error(`Verification failed: Invalid OTP for ${email}. Expected ${user.otp_code}, got ${otp}`);
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      console.error(`Verification failed: OTP expired for ${email}.`);
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    await supabase
      .from("users")
      .update({
        otp_code: null,
        otp_expires_at: null,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email);

    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })).toString("base64");

    return NextResponse.json({ 
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        botName: user.bot_name,
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
