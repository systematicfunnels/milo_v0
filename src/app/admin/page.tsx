"use client";

import { motion } from "framer-motion";
import { Bell, Users, Clock, CheckCircle2, XCircle, MessageCircle, Send, Crown, RefreshCw, Loader2, ArrowLeft, TrendingUp, Activity, Calendar } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Stats {
  users: {
    total: number;
    verified: number;
    whatsapp_connected: number;
    telegram_connected: number;
    pro_subscribers: number;
    enterprise_subscribers: number;
  };
  reminders: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    sent_today: number;
    created_today: number;
  };
  platforms: {
    whatsapp_users: number;
    telegram_users: number;
  };
}

interface RecentReminder {
  id: string;
  message: string;
  reminder_time: string;
  platform: string;
  status: string;
  created_at: string;
}

interface RecentUser {
  id: string;
  email: string;
  created_at: string;
  whatsapp_connected: boolean;
  telegram_connected: boolean;
  subscription_tier: string;
}

function getAuthToken() {
  if (typeof window === "undefined") return null;
  const localToken = localStorage.getItem("auth_token");
  if (localToken) return localToken;
  
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
  
  if (cookieToken) {
    localStorage.setItem("auth_token", cookieToken);
    return cookieToken;
  }
  return null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReminders, setRecentReminders] = useState<RecentReminder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/stats", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.NEXT_PUBLIC_ADMIN_API_KEY || token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentReminders(data.recent?.reminders || []);
        setRecentUsers(data.recent?.users || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: { 
    title: string; 
    value: number | string; 
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <h3 className="text-muted-foreground font-medium">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground/70 mt-1">{subtitle}</p>}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 hero-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern pointer-events-none" />

      <nav className="sticky top-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Milo Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={fetchStats} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={stats?.users.total || 0} 
            icon={Users}
            color="bg-indigo-500"
            subtitle={`${stats?.users.verified || 0} verified`}
          />
          <StatCard 
            title="Total Reminders" 
            value={stats?.reminders.total || 0} 
            icon={Clock}
            color="bg-purple-500"
            subtitle={`${stats?.reminders.created_today || 0} today`}
          />
          <StatCard 
            title="Sent Reminders" 
            value={stats?.reminders.sent || 0} 
            icon={CheckCircle2}
            color="bg-green-500"
            subtitle={`${stats?.reminders.sent_today || 0} today`}
          />
          <StatCard 
            title="Pending Reminders" 
            value={stats?.reminders.pending || 0} 
            icon={Calendar}
            color="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="WhatsApp Users" 
            value={stats?.platforms.whatsapp_users || 0} 
            icon={MessageCircle}
            color="bg-[#25D366]"
          />
          <StatCard 
            title="Telegram Users" 
            value={stats?.platforms.telegram_users || 0} 
            icon={Send}
            color="bg-[#0088cc]"
          />
          <StatCard 
            title="Pro Subscribers" 
            value={stats?.users.pro_subscribers || 0} 
            icon={Crown}
            color="bg-gradient-to-br from-indigo-500 to-purple-600"
          />
          <StatCard 
            title="Failed Reminders" 
            value={stats?.reminders.failed || 0} 
            icon={XCircle}
            color="bg-red-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent Reminders</h2>
            </div>

            {recentReminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent reminders</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      reminder.status === "sent" ? "bg-green-500/20" :
                      reminder.status === "failed" ? "bg-red-500/20" : "bg-amber-500/20"
                    }`}>
                      {reminder.status === "sent" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : reminder.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{reminder.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(reminder.reminder_time).toLocaleString()}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span className="capitalize flex items-center gap-1">
                          {reminder.platform === "whatsapp" ? (
                            <MessageCircle className="w-3 h-3" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          {reminder.platform}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reminder.status === "sent" ? "bg-green-500/20 text-green-400" :
                      reminder.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {reminder.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent Users</h2>
            </div>

            {recentUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent users</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-medium text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{user.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <div className="flex items-center gap-1">
                          {user.whatsapp_connected && (
                            <MessageCircle className="w-3 h-3 text-[#25D366]" />
                          )}
                          {user.telegram_connected && (
                            <Send className="w-3 h-3 text-[#0088cc]" />
                          )}
                          {!user.whatsapp_connected && !user.telegram_connected && (
                            <span>Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.subscription_tier === "pro" ? "bg-indigo-500/20 text-indigo-400" :
                      user.subscription_tier === "enterprise" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"
                    }`}>
                      {user.subscription_tier || "free"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Quick Stats Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-green-400">
                {stats?.reminders.total ? 
                  Math.round((stats.reminders.sent / stats.reminders.total) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Delivery Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-indigo-400">
                {stats?.users.total ?
                  Math.round(((stats.platforms.whatsapp_users + stats.platforms.telegram_users) / stats.users.total) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Connection Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-purple-400">
                {stats?.users.total ?
                  Math.round(((stats.users.pro_subscribers + stats.users.enterprise_subscribers) / stats.users.total) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Paid Users</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-amber-400">
                {stats?.users.total && stats.reminders.total ?
                  (stats.reminders.total / stats.users.total).toFixed(1) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Reminders/User</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
