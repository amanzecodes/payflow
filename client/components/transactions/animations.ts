import type { Variants } from "framer-motion";

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const panelVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

export const rowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
