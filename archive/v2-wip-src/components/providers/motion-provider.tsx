"use client";

import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { duration, ease } from "@/lib/motion";

interface MotionContextValue {
  /** True when the user prefers reduced motion */
  prefersReducedMotion: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  prefersReducedMotion: false,
});

/**
 * Access the motion context.
 * Use `prefersReducedMotion` to conditionally disable animations.
 *
 * @example
 * const { prefersReducedMotion } = useMotion();
 * <AnimatePresence initial={!prefersReducedMotion}>
 */
export function useMotion(): MotionContextValue {
  return useContext(MotionContext);
}

/**
 * Global motion provider.
 *
 * - Wraps the app in `LazyMotion` for tree-shaking
 * - Detects `prefers-reduced-motion` and kills all animations globally
 * - Provides a context so components can check `prefersReducedMotion`
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <MotionContext.Provider value={{ prefersReducedMotion }}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig
          reducedMotion={prefersReducedMotion ? "always" : "never"}
          transition={{
            duration: prefersReducedMotion ? 0 : duration.base,
            ease: prefersReducedMotion ? "linear" : (ease.snappy as any),
          }}
        >
          {children}
        </MotionConfig>
      </LazyMotion>
    </MotionContext.Provider>
  );
}
