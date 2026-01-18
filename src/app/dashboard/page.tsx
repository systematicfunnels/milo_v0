"use client";

import { motion } from "framer-motion";
import { Bell, LogOut, MessageCircle, Send, Clock, CheckCircle2, Plus, Trash2, Loader2, Settings, ExternalLink, Crown, Sparkles, CreditCard, Zap } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { getTranslation } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface User {
  id: string;
  email: string;
  botName: string;
  whatsappConnected: boolean;
  telegramConnected: boolean;
  telegramChatId: string | null;
  whatsappPhone: string | null;
}

interface Subscription {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  remindersUsed: number;
  apiCallsUsed: number;
  stripeSubscription: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface Reminder {
  id: string;
  message: string;
  reminder_time: string;
  platform: "whatsapp" | "telegram";
  status: "pending" | "sent" | "failed";
  created_at: string;
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

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export default function DashboardPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const t = getTranslation(lang);
  const [user, setUser] = useState<User | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [botName, setBotName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const fetchUser = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setBotName(data.user.botName || "Milo Bot");
      } else {
        localStorage.removeItem("auth_token");
        router.push("/login");
      }
    } catch {
      localStorage.removeItem("auth_token");
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.reminders) {
        setReminders(data.reminders);
      }
    } catch {
      console.error("Failed to fetch reminders");
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/subscription", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch {
      console.error("Failed to fetch subscription");
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchReminders();
    fetchSubscription();
  }, [fetchUser, fetchReminders, fetchSubscription]);

  const handleLogout = () => {
    // Clear all client-side state
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
    
    // Reset local state
    setUser(null);
    setReminders([]);
    setSubscription(null);
    
    // Force a full page reload to the home page to ensure all state is wiped
    window.location.href = "/";
  };

  const handleSaveBotName = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ botName }),
      });
      if (res.ok) {
        toast.success(t.dashboard.botNameUpdated);
        if (user) setUser({ ...user, botName });
      }
    } catch {
      toast.error(t.dashboard.failedToUpdate);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setReminders(reminders.filter((r) => r.id !== id));
        toast.success(t.dashboard.reminderDeleted);
      }
    } catch {
      toast.error(t.dashboard.failedToDelete);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription?.stripeSubscription) {
      router.push("/pricing");
      return;
    }

    setIsLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.url) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: data.url } }, "*");
      } else {
        toast.error(t.dashboard.failedPortal);
      }
    } catch {
      toast.error(t.dashboard.failedPortal);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const getTierInfo = () => {
    const tier = subscription?.tier || "free";
    switch (tier) {
      case "pro":
        return { name: "Pro", icon: <Crown className="w-4 h-4" />, color: "text-indigo-400", bg: "bg-indigo-500/20" };
      case "enterprise":
        return { name: "Enterprise", icon: <Zap className="w-4 h-4" />, color: "text-purple-400", bg: "bg-purple-500/20" };
      default:
        return { name: "Free", icon: <Sparkles className="w-4 h-4" />, color: "text-gray-400", bg: "bg-gray-500/20" };
    }
  };

  const tierInfo = getTierInfo();
  const reminderLimit = subscription?.tier === "free" ? 5 : (subscription?.tier === "pro" ? -1 : -1);
  const apiLimit = subscription?.tier === "free" ? 10 : (subscription?.tier === "pro" ? 100 : -1);

  const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "Milo_Bot";
  const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.replace("+", "") || "1234567890";

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
              <span className="text-xl font-bold">Milo</span>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierInfo.bg} ${tierInfo.color}`}>
                {tierInfo.icon}
                <span className="text-sm font-medium">{tierInfo.name}</span>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t.nav.logout}
              </Button>
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
          <h1 className="text-3xl font-bold mb-2">{t.dashboard.welcomeBack}</h1>
          <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{t.dashboard.connectPlatforms}</h2>
                <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.dashboard.connect}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-border">
                    <DialogHeader>
                      <DialogTitle>{t.dashboard.connectTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <a
                        href={`https://wa.me/${WHATSAPP_PHONE}?text=Hi! I want to connect my Milo account.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">WhatsApp</p>
                          <p className="text-sm text-muted-foreground">{t.dashboard.clickToOpenWhatsApp}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                      </a>
                      
                      <a
                        href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center">
                          <Send className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">Telegram</p>
                          <p className="text-sm text-muted-foreground">{t.dashboard.clickToOpenTelegram}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {t.dashboard.sendMessageToConnect}
                    </p>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${user?.whatsappConnected ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-secondary/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.whatsappConnected ? 'bg-[#25D366]' : 'bg-secondary'}`}>
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.whatsappConnected ? (
                          <span className="text-green-500">{t.dashboard.connected}</span>
                        ) : (
                          t.dashboard.notConnected
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${user?.telegramConnected ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-secondary/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.telegramConnected ? 'bg-[#0088cc]' : 'bg-secondary'}`}>
                      <Send className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Telegram</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.telegramConnected ? (
                          <span className="text-green-500">{t.dashboard.connected}</span>
                        ) : (
                          t.dashboard.notConnected
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{t.dashboard.yourReminders}</h2>
                <span className="text-sm text-muted-foreground">{reminders.length} {t.dashboard.total}</span>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">{t.dashboard.noReminders}</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.sendMessageToCreate}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        reminder.status === "sent" ? "bg-green-500/20" :
                        reminder.status === "failed" ? "bg-red-500/20" : "bg-indigo-500/20"
                      }`}>
                        {reminder.status === "sent" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{reminder.message}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(reminder.reminder_time).toLocaleString()}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          <span className="capitalize">{reminder.platform}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{t.dashboard.botSettings}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.dashboard.botName}</label>
                  <Input
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="bg-secondary/50 border-border"
                    placeholder="Milo Bot"
                  />
                </div>
                <Button 
                  onClick={handleSaveBotName} 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.dashboard.saveChanges}
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">{t.dashboard.subscription}</h2>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${tierInfo.bg} ${tierInfo.color}`}>
                  {tierInfo.icon}
                  <span className="text-xs font-medium">{tierInfo.name}</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.dashboard.remindersThisMonth}</span>
                  <span className={reminderLimit === -1 ? "text-green-400" : ""}>
                    {subscription?.remindersUsed || 0}{reminderLimit === -1 ? ` / ${t.dashboard.unlimited}` : ` / ${reminderLimit}`}
                  </span>
                </div>
                {reminderLimit !== -1 && (
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(((subscription?.remindersUsed || 0) / reminderLimit) * 100, 100)}%` }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.dashboard.apiCallsToday}</span>
                  <span className={apiLimit === -1 ? "text-green-400" : ""}>
                    {subscription?.apiCallsUsed || 0}{apiLimit === -1 ? ` / ${t.dashboard.unlimited}` : ` / ${apiLimit}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {subscription?.tier === "free" ? (
                  <Link href="/pricing" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">
                      <Crown className="w-4 h-4 mr-2" />
                      {t.dashboard.upgrade}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={handleManageSubscription} 
                    disabled={isLoadingPortal}
                    variant="outline"
                    className="flex-1"
                  >
                    {isLoadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : t.dashboard.manage}
                  </Button>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">{t.dashboard.quickGuide}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 shrink-0">1</span>
                  <p className="text-muted-foreground">{t.dashboard.guideStep1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 shrink-0">2</span>
                  <p className="text-muted-foreground">{t.dashboard.guideStep2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 shrink-0">3</span>
                  <p className="text-muted-foreground">{t.dashboard.guideStep3}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 shrink-0">4</span>
                  <p className="text-muted-foreground">{t.dashboard.guideStep4}</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 p-6">
                <h3 className="font-semibold mb-2">{t.dashboard.tryExamples}</h3>
                <div className="space-y-2 text-sm text-muted-foreground font-mono">
                  <p>{t.dashboard.example1}</p>
                  <p>{t.dashboard.example2}</p>
                  <p>{t.dashboard.example3}</p>
                  <p>{t.dashboard.example4}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
