"use client";

import { motion } from "framer-motion";
import { Bell, ArrowLeft, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getTranslation } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const t = getTranslation(lang);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(t.login.otpSent);
        if (data.devOtp) {
          setReceivedOtp(data.devOtp);
        }
        setStep("otp");
      } else {
        toast.error(data.error || t.login.otpFailed);
      }
    } catch {
      toast.error(t.login.somethingWrong);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem("auth_token", data.token);
        document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        toast.success(t.login.loginSuccess);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 200);
      } else {
        toast.error(data.error || t.login.invalidOtp);
      }
    } catch {
      toast.error(t.login.somethingWrong);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 hero-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.login.backToHome}
          </Link>
          <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Milo</h1>
              <p className="text-sm text-muted-foreground">
                {step === "email" ? t.login.signIn : t.login.enterCode}
              </p>
            </div>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.login.emailLabel}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (receivedOtp) setReceivedOtp(null);
                    }}
                    className="pl-10 bg-secondary/50 border-border focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.login.continueWithEmail
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t.login.emailHint}
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {t.login.codeSentTo} <span className="text-foreground font-medium">{email}</span>
                </p>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-secondary/50 border-border" />
                      <InputOTPSlot index={1} className="bg-secondary/50 border-border" />
                      <InputOTPSlot index={2} className="bg-secondary/50 border-border" />
                      <InputOTPSlot index={3} className="bg-secondary/50 border-border" />
                      <InputOTPSlot index={4} className="bg-secondary/50 border-border" />
                      <InputOTPSlot index={5} className="bg-secondary/50 border-border" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {receivedOtp && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center"
                >
                  <p className="text-xs text-indigo-400 uppercase tracking-wider font-semibold mb-1">Your Login Code</p>
                  <p className="text-2xl font-mono font-bold text-indigo-500 tracking-[0.5em] ml-[0.5em]">{receivedOtp}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.login.verifySignIn
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setReceivedOtp(null);
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.login.useDifferentEmail}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t.login.termsText}
        </p>
      </motion.div>
    </div>
  );
}
