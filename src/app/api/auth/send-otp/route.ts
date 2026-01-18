import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      await supabase
        .from("users")
        .update({
          otp_code: otp,
          otp_expires_at: otpExpiresAt.toISOString(),
        })
        .eq("email", email);
    } else {
      await supabase.from("users").insert({
        email,
        otp_code: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
      });
    }

    console.log(`OTP for ${email}: ${otp}`);

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully",
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined
    });
  } catch (error) {
    console.error("Send OTP error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json({ 
      error: "Failed to send OTP",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}
