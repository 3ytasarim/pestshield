"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

/** Sayıyı 0'dan (veya önceki değerden) hedefe doğru yumuşak bir şekilde sayar. */
export function AnimatedNumber({ value, format, duration = 0.8, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration]);

  const formatted = format ? format(display) : Math.round(display).toString();

  return <span className={className}>{formatted}</span>;
}
