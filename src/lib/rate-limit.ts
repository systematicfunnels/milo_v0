import { createServiceClient } from "@/lib/supabase/server";
import { getTierLimits, SubscriptionTier } from "./stripe";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  error?: string;
}

export async function checkReminderLimit(userId: string): Promise<RateLimitResult> {
  const supabase = await createServiceClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("subscription_tier, reminders_count_this_month, reminders_reset_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { allowed: false, remaining: 0, limit: 0, resetAt: new Date(), error: "User not found" };
  }

  const tier = (user.subscription_tier || "free") as SubscriptionTier;
  const limits = getTierLimits(tier);
  
  if (limits.remindersPerMonth === -1) {
    return { allowed: true, remaining: -1, limit: -1, resetAt: new Date() };
  }

  const now = new Date();
  const resetAt = user.reminders_reset_at ? new Date(user.reminders_reset_at) : now;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (resetAt < startOfMonth) {
    await supabase
      .from("users")
      .update({ reminders_count_this_month: 0, reminders_reset_at: startOfMonth.toISOString() })
      .eq("id", userId);
    
    return { allowed: true, remaining: limits.remindersPerMonth - 1, limit: limits.remindersPerMonth, resetAt: startOfMonth };
  }

  const currentCount = user.reminders_count_this_month || 0;
  const remaining = limits.remindersPerMonth - currentCount;

  if (remaining <= 0) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { allowed: false, remaining: 0, limit: limits.remindersPerMonth, resetAt: nextMonth };
  }

  return { allowed: true, remaining: remaining - 1, limit: limits.remindersPerMonth, resetAt: startOfMonth };
}

export async function incrementReminderCount(userId: string): Promise<void> {
  const supabase = await createServiceClient();
  
  const { data: user } = await supabase
    .from("users")
    .select("reminders_count_this_month")
    .eq("id", userId)
    .single();

  await supabase
    .from("users")
    .update({ reminders_count_this_month: (user?.reminders_count_this_month || 0) + 1 })
    .eq("id", userId);
}

export async function checkApiLimit(userId: string): Promise<RateLimitResult> {
  const supabase = await createServiceClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("subscription_tier, api_calls_today, api_calls_reset_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { allowed: false, remaining: 0, limit: 0, resetAt: new Date(), error: "User not found" };
  }

  const tier = (user.subscription_tier || "free") as SubscriptionTier;
  const limits = getTierLimits(tier);

  if (limits.apiCallsPerDay === -1) {
    return { allowed: true, remaining: -1, limit: -1, resetAt: new Date() };
  }

  const now = new Date();
  const resetAt = user.api_calls_reset_at ? new Date(user.api_calls_reset_at) : now;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (resetAt < startOfDay) {
    await supabase
      .from("users")
      .update({ api_calls_today: 0, api_calls_reset_at: startOfDay.toISOString() })
      .eq("id", userId);
    
    return { allowed: true, remaining: limits.apiCallsPerDay - 1, limit: limits.apiCallsPerDay, resetAt: startOfDay };
  }

  const currentCount = user.api_calls_today || 0;
  const remaining = limits.apiCallsPerDay - currentCount;

  if (remaining <= 0) {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { allowed: false, remaining: 0, limit: limits.apiCallsPerDay, resetAt: tomorrow };
  }

  return { allowed: true, remaining: remaining - 1, limit: limits.apiCallsPerDay, resetAt: startOfDay };
}

export async function incrementApiCount(userId: string): Promise<void> {
  const supabase = await createServiceClient();
  
  const { data: user } = await supabase
    .from("users")
    .select("api_calls_today")
    .eq("id", userId)
    .single();

  await supabase
    .from("users")
    .update({ api_calls_today: (user?.api_calls_today || 0) + 1 })
    .eq("id", userId);
}
