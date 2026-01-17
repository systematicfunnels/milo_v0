"use client";

import { motion } from "framer-motion";
import { Bell, MessageCircle, Zap, Clock, Shield, Brain, ArrowRight, CheckCircle, Send, Mic, Star, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Language, getTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const featureIcons = [Brain, MessageCircle, Mic, Zap, Clock, Shield];
const stepIcons = [MessageCircle, Send, Bell];

const testimonialAvatars = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
];

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.replace("+", "") || "1234567890";
const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "Milo_Bot";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const t = getTranslation(lang);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "hi")) {
      setLang(savedLang);
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const openExternalUrl = (url: string) => {
    window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="fixed inset-0 hero-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="fixed inset-0 noise-overlay pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Milo</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.features}</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.howItWorks}</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.pricing}</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher currentLang={lang} onLanguageChange={handleLanguageChange} />
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t.nav.login}
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t.nav.getStarted}
              </Link>
            </div>

            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass-card border-t border-border"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">{t.nav.features}</a>
              <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">{t.nav.howItWorks}</a>
              <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">{t.nav.pricing}</a>
              <div className="pt-3 border-t border-border space-y-3">
                <LanguageSwitcher currentLang={lang} onLanguageChange={handleLanguageChange} />
                <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">{t.nav.login}</Link>
                <Link href="/login" className="block w-full text-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium">
                  {t.nav.getStarted}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t.hero.badge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              {t.hero.title1}
              <br />
              <span className="gradient-text">{t.hero.title2}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              {t.hero.description}
            </motion.p>

<motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center justify-center gap-4"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <button
                    onClick={() => openExternalUrl(`https://wa.me/${WHATSAPP_PHONE}?text=Hi! I want to set up reminders with Milo`)}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-lg hover:bg-[#22c55e] transition-all flex items-center justify-center gap-3"
                  >
                    <MessageCircle className="w-5 h-5" /> {t.cta.startWhatsApp}
                  </button>
                  <button
                    onClick={() => openExternalUrl(`https://t.me/${TELEGRAM_BOT}`)}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0088cc] text-white font-semibold text-lg hover:bg-[#0077b5] transition-all flex items-center justify-center gap-3"
                  >
                    <Send className="w-5 h-5" /> {t.cta.startTelegram}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <span>{t.cta.orConnectWith}</span>
                  <Link
                    href="/login"
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                </div>
              </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{t.hero.freePlan}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{t.hero.noCard}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{t.hero.setup}</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="max-w-lg mx-auto">
              <div className="glass-card rounded-2xl p-4 shadow-2xl">
                <div className="bg-[#0b141a] rounded-xl overflow-hidden">
                  <div className="bg-[#1f2c33] px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Milo Bot</p>
                      <p className="text-[#8696a0] text-xs">{t.chat.online}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3 min-h-[280px]">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 }}
                      className="flex justify-end"
                    >
                      <div className="bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-2 max-w-[80%]">
                        <p className="text-white text-sm">{t.chat.msg1}</p>
                        <p className="text-[#8696a0] text-[10px] text-right mt-1">10:42 AM</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5 }}
                      className="flex justify-start"
                    >
                      <div className="bg-[#1f2c33] rounded-lg rounded-tl-none px-3 py-2 max-w-[80%]">
                        <p className="text-white text-sm">{t.chat.reply1}</p>
                        <p className="text-[#8696a0] text-[10px] text-right mt-1">10:42 AM</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2 }}
                      className="flex justify-end"
                    >
                      <div className="bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-2 max-w-[80%]">
                        <p className="text-white text-sm">{t.chat.msg2}</p>
                        <p className="text-[#8696a0] text-[10px] text-right mt-1">10:43 AM</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.5 }}
                      className="flex justify-start"
                    >
                      <div className="bg-[#1f2c33] rounded-lg rounded-tl-none px-3 py-2 max-w-[80%]">
                        <p className="text-white text-sm">{t.chat.reply2}</p>
                        <p className="text-[#8696a0] text-[10px] text-right mt-1">10:43 AM</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.features.title1} <span className="gradient-text">{t.features.title2}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.howItWorks.title1} <span className="gradient-text">{t.howItWorks.title2}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="glass-card rounded-2xl p-8 text-center h-full">
                    <div className="text-6xl font-bold text-indigo-500/20 mb-4">{String(index + 1).padStart(2, "0")}</div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.testimonials.title1} <span className="gradient-text">{t.testimonials.title2}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.testimonials.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.testimonials.items.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-6">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonialAvatars[index]}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.pricing.title1} <span className="gradient-text">{t.pricing.title2}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.pricing.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.pricing.plans.map((plan, index) => {
              const isPopular = index === 1;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card rounded-2xl p-8 relative ${
                    isPopular ? "border-indigo-500/50 scale-105" : ""
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium">
                      {t.pricing.mostPopular}
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${
                      isPopular
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                        : "glass-card hover:bg-white/5"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

<section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  {t.cta.title}
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  {t.cta.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => openExternalUrl(`https://wa.me/${WHATSAPP_PHONE}?text=Hi! I want to set up reminders with Milo`)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#22c55e] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" /> {t.cta.startWhatsApp}
                  </button>
                  <button
                    onClick={() => openExternalUrl(`https://t.me/${TELEGRAM_BOT}`)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0088cc] text-white font-semibold hover:bg-[#0077b5] transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" /> {t.cta.startTelegram}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Milo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t.footer.terms}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t.footer.contact}</a>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
