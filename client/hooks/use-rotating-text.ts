import { useEffect, useState } from "react";
import type { RotatingText } from "@/constants/auth.constants";

const FADE_OUT_DELAY_MS = 500;
const ROTATION_INTERVAL_MS = 4500;

export function useRotatingText(items: RotatingText[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        setFadeState("in");
      }, FADE_OUT_DELAY_MS);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [items.length]);

  return { current: items[currentIndex], fadeState };
}
