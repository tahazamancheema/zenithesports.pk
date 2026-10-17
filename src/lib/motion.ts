/**
 * ============================================================================
 *  ZENITH ESPORTS — MOTION SYSTEM
 *  Import easing and duration values from here.
 *  Never define easing curves inline.
 * ============================================================================
 */

/** Named easing curves for all animations */
export const ease = {
  /** Standard UI transitions (nav, buttons, inputs) */
  snappy: [0.22, 1, 0.36, 1] as const,
  /** Hero entrances, page reveals */
  launch: [0.0, 0, 0.2, 1] as const,
  /** Modals dropping in, drawers sliding */
  settle: [0.4, 0, 0.6, 1] as const,
  /** Success states, confirmations */
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const;

/** Duration tokens in seconds */
export const duration = {
  /** Micro-interactions: toggles, focus rings */
  fast: 0.15,
  /** Standard UI: buttons, hovers, tabs */
  base: 0.22,
  /** Larger transitions: panels, cards */
  slow: 0.35,
  /** Ambient: hero reveals, page transitions */
  crawl: 0.6,
} as const;

/** Maximum stagger between children in seconds */
export const STAGGER_MAX = 0.08;

/**
 * Framer Motion transition presets.
 * Use these in `<motion.div transition={transitions.snappy}>`.
 */
export const transitions = {
  snappy: { duration: duration.base, ease: ease.snappy },
  launch: { duration: duration.crawl, ease: ease.launch },
  settle: { duration: duration.slow, ease: ease.settle },
  bounce: { duration: duration.slow, ease: ease.bounce },
  /** For staggered children containers */
  stagger: {
    staggerChildren: STAGGER_MAX,
    delayChildren: 0.1,
  },
} as const;

/**
 * Common Framer Motion animation variants.
 * Use with `<motion.div variants={variants.fadeUp}>`.
 */
export const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  /** Container variant for staggered children */
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_MAX,
        delayChildren: 0.1,
      },
    },
  },
} as const;
