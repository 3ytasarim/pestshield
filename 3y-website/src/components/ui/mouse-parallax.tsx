"use client";

import { useRef, useEffect, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface LayerProps {
  children: ReactNode;
  depth?: number; // 0.0 = no move, 1.0 = full move
  className?: string;
  style?: React.CSSProperties;
}

export function ParallaxLayer({ children, depth = 0.5, className, style }: LayerProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      x.set(dx * depth * 22);
      y.set(dy * depth * 14);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [depth, x, y]);

  return (
    <motion.div style={{ x: sx, y: sy, ...style }} className={className}>
      {children}
    </motion.div>
  );
}

interface SceneProps {
  children: ReactNode;
  className?: string;
}

export function ParallaxScene({ children, className }: SceneProps) {
  return (
    <div className={className} style={{ perspective: 1200, perspectiveOrigin: "50% 50%" }}>
      {children}
    </div>
  );
}
