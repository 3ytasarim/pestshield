"use client";

import * as React from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  primaryValue: number;
  primarySuffix?: string;
  secondaryValue: string;
  secondaryLabel: string;
  icon: React.ReactNode;
}

const AnimatedStatsCard = React.forwardRef<HTMLDivElement, AnimatedStatsCardProps>(
  ({ title, primaryValue, primarySuffix = "", secondaryValue, secondaryLabel, icon, className, ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: "-80px" });

    const spring = useSpring(0, { damping: 50, stiffness: 200, mass: 1 });
    const displayValue = useTransform(spring, (v) =>
      Number.isInteger(primaryValue) ? Math.round(v).toString() : v.toFixed(1)
    );

    React.useEffect(() => {
      if (isInView) spring.set(primaryValue);
    }, [isInView, primaryValue, spring]);

    return (
      <div
        ref={cardRef}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300",
          "hover:-translate-y-1",
          className
        )}
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        {...props}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(247,148,29,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {title}
          </h3>
          <div
            className="rounded-full p-2"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
          >
            {icon}
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex items-end justify-between gap-3 mt-auto">
          {/* Animated primary value */}
          <div className="flex items-baseline gap-1" aria-live="polite">
            <motion.span
              className="font-display font-bold leading-none text-white"
              style={{ fontSize: "clamp(42px, 5vw, 64px)" }}
            >
              {displayValue}
            </motion.span>
            {primarySuffix && (
              <span className="font-display font-bold text-2xl" style={{ color: "var(--accent)" }}>
                {primarySuffix}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="flex-1 h-px mb-3" style={{ background: "var(--border-hover)" }} />

          {/* Secondary */}
          <div className="flex flex-col items-end shrink-0">
            <span className="font-display font-semibold text-2xl text-white">{secondaryValue}</span>
            <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {secondaryLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

AnimatedStatsCard.displayName = "AnimatedStatsCard";
export { AnimatedStatsCard };
