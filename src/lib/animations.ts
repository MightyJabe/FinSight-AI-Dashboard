import { Variants } from 'framer-motion';

/**
 * Reusable Framer Motion animation variants library
 * All animations respect prefers-reduced-motion automatically via Framer Motion
 */

/**
 * Fade in animation - simple opacity transition
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Fade in from bottom - common for cards and sections
 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1], // easeOutCubic
    },
  },
};

/**
 * Fade in from top - useful for headers and dropdowns
 */
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Scale in animation - good for modals and popups
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1], // easeOutBack
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

/**
 * Staggered list animation - parent container variant
 * Use with staggeredItem on children
 */
export const staggeredContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms delay between items
      delayChildren: 0.1, // Start after 100ms
    },
  },
};

/**
 * Staggered list animation - child item variant
 * Use with staggeredContainer on parent
 */
export const staggeredItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Lift effect for card hover - vertical lift with shadow
 */
export const cardHover = {
  rest: {
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1], // easeOutBack
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * Subtle scale on hover - for buttons and interactive elements
 */
export const scaleHover = {
  rest: {
    scale: 1,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * Slide in from left - for side panels and drawers
 */
export const slideInLeft: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Slide in from right - for side panels and drawers
 */
export const slideInRight: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Collapse/expand animation - for accordion-like components
 */
export const collapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

/**
 * Skeleton pulse animation - for loading states
 */
export const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Shimmer animation - for loading states with gradient effect
 */
export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Bounce in - for success states and notifications
 */
export const bounceIn: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: [0, 1.1, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55], // easeOutBack with bounce
    },
  },
};

/**
 * Glow effect - for highlighting important elements
 */
export const glow = {
  rest: {
    boxShadow: '0 0 0 rgba(var(--primary), 0)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  hover: {
    boxShadow: '0 0 20px rgba(var(--primary), 0.4)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Page transition - for route changes
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Spring animation - for playful interactions
 */
export const spring = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

/**
 * Easing presets for consistent motion
 */
export const easings = {
  easeOutCubic: [0.25, 0.1, 0.25, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInOutBack: [0.68, -0.55, 0.265, 1.55],
  easeOutQuint: [0.22, 1, 0.36, 1],
} as const;

/**
 * Duration presets for consistent timing
 */
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

/**
 * Transition presets combining duration and easing
 */
export const transitions = {
  default: {
    duration: durations.normal,
    ease: easings.easeOutCubic,
  },
  fast: {
    duration: durations.fast,
    ease: easings.easeOutCubic,
  },
  slow: {
    duration: durations.slow,
    ease: easings.easeOutCubic,
  },
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  bounce: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 10,
  },
} as const;
