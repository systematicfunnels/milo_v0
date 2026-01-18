"use client";

import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Loader2, ArrowLeft, Sparkles, Crown, Building2, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslation } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { useLocationCurrency } from "@/hooks/useLocationCurrency";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface Plan {
  id: string;
  name: string;
  price: number;
  priceInr?: number;
  priceId: string | null;
  features: readonly string[];
  icon: React.ReactNode;
  popular?: boolean;
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

function CheckoutForm({ 
  onSuccess, 
  onCancel,
  t,
}: { 
  onSuccess: () => void;
  onCancel: () => void;
  t: ReturnType<typeof getTranslation>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "An error occurred");
      setIsProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      toast.success("Subscription activated!");
      onSuccess();
    } else {
      setError("Payment was not completed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-secondary/30 rounded-xl p-4 max-h-[400px] overflow-y-auto">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isProcessing}
        >
          {t.pricingPage.cancel}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.pricingPage.processing}
            </>
          ) : (
            t.pricingPage.subscribeNow
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const { currency } = useLocationCurrency();
  const t = getTranslation(lang);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const plans: Plan[] = [
    {
      id: "free",
      name: SUBSCRIPTION_TIERS.free.name,
      price: SUBSCRIPTION_TIERS.free.price,
      priceId: SUBSCRIPTION_TIERS.free.priceId,
      icon: <Sparkles className="w-6 h-6" />,
      features: SUBSCRIPTION_TIERS.free.features,
    },
    {
      id: "pro",
      name: SUBSCRIPTION_TIERS.pro.name,
      price: SUBSCRIPTION_TIERS.pro.price,
      priceInr: SUBSCRIPTION_TIERS.pro.priceInr,
      priceId: SUBSCRIPTION_TIERS.pro.priceId,
      icon: <Crown className="w-6 h-6" />,
      popular: true,
      features: SUBSCRIPTION_TIERS.pro.features,
    },
    {
      id: "enterprise",
      name: SUBSCRIPTION_TIERS.enterprise.name,
      price: SUBSCRIPTION_TIERS.enterprise.price,
      priceInr: SUBSCRIPTION_TIERS.enterprise.priceInr,
      priceId: SUBSCRIPTION_TIERS.enterprise.priceId,
      icon: <Building2 className="w-6 h-6" />,
      features: SUBSCRIPTION_TIERS.enterprise.features,
    },
  ];

  const fetchSubscription = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/stripe/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTier(data.tier);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === "free" || plan.id === currentTier) return;
    
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!plan.priceId) {
      toast.error("This plan is not available yet");
      return;
    }

    setSelectedPlan(plan);
    setIsCreatingSubscription(true);

    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: plan.priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.status === "active" || data.status === "trialing") {
        // If no payment intent but status is active/trialing, it's successful (e.g. $0 plan)
        toast.success("Subscription activated!");
        handlePaymentSuccess();
      } else {
        throw new Error("No payment required but subscription status unknown");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setSelectedPlan(null);
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setClientSecret(null);
    fetchSubscription();
    router.push("/dashboard");
  };

  const handleCancel = () => {
    setSelectedPlan(null);
    setClientSecret(null);
  };

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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.nav.backToDashboard}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t.pricingPage.title1} <span className="gradient-text">{t.pricingPage.title2}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.pricingPage.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card rounded-2xl p-6 relative ${
                plan.popular ? "ring-2 ring-indigo-500" : ""
              } ${currentTier === plan.id ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                    {t.pricing.mostPopular}
                  </span>
                </div>
              )}
              
              {currentTier === plan.id && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 rounded-full bg-green-500 text-xs font-semibold text-white">
                    {t.pricing.currentPlan}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-indigo-400">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {currency === "INR" && plan.priceInr 
                        ? `₹${plan.priceInr}` 
                        : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">/{t.pricingPage.month}</span>}
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={plan.id === "free" || currentTier === plan.id || isCreatingSubscription}
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {currentTier === plan.id ? (
                  t.pricing.currentPlan
                ) : plan.id === "free" ? (
                  t.pricingPage.freeForever
                ) : isCreatingSubscription && selectedPlan?.id === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.pricingPage.loading}
                  </>
                ) : (
                  t.pricingPage.upgradeNow
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedPlan && clientSecret && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{t.pricingPage.subscribeTo} {selectedPlan.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {currency === "INR" && selectedPlan.priceInr 
                        ? `₹${selectedPlan.priceInr}` 
                        : `$${selectedPlan.price}`}/{t.pricingPage.month}
                    </p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#6366f1",
                        colorBackground: "#12121a",
                        colorText: "#fafafa",
                        colorDanger: "#ef4444",
                        borderRadius: "8px",
                      },
                    },
                  }}
                >
                  <CheckoutForm onSuccess={handlePaymentSuccess} onCancel={handleCancel} t={t} />
                </Elements>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
