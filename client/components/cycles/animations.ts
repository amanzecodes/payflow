import type { Variants } from "framer-motion";

export const viewVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

export const rowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
