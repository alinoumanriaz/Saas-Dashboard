"use client";

import { Boxes, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type LoadingScreenProps = {
  appName?: string;
  message?: string;
  tips?: string[];
  logoUrl?: string;
};

const defaultTips = [
  "✨ Did you know? We process 10M requests daily.",
  "⌨️ Use keyboard shortcuts to save time.",
  "🔒 Your data is encrypted end‑to‑end.",
  "🤖 New AI features are coming soon!",
  "🎨 You can customize your dashboard layout.",
];

export default function LoadingScreen({
  appName = "Your App",
  message = "Preparing your workspace…",
  tips = defaultTips,
  logoUrl,
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, [tips]);

  // Animate progress from 0 to 100 over 3 seconds, then repeat
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 3000; // 3 seconds per cycle
      const rawProgress = (elapsed % 1) * 100;
      setProgress(rawProgress);
      animationFrame = requestAnimationFrame(animateProgress);
    };

    animationFrame = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <main
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-background transition-opacity duration-700"
      role="status"
      aria-live="polite"
      aria-label="Loading application"
    >
      {/* Subtle background decoration */}
      <div
        aria-hidden="true"
        className="absolute"
      />

      <Loader className="animate-spin size-6" />

      {/* Hidden screen-reader text */}
      <span className="sr-only">Application is loading. Please wait.</span>
    </main>
  );
}