"use client";

import type { RotatingText } from "@/constants/auth.constants";
import { useRotatingText } from "@/hooks/use-rotating-text";

export function RotatingCopy({ items }: { items: RotatingText[] }) {
  const { current, fadeState } = useRotatingText(items);

  return (
    <div
      className={`transition-all duration-500 transform ease-in-out ${
        fadeState === "in" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <h2 className="text-4xl font-bold leading-tight tracking-tight mb-2 text-white">
        {current.title}
      </h2>
      <h3 className="text-2xl font-medium text-[#5fa8ff] mb-6 leading-snug">
        {current.subtitle}
      </h3>
      <p className="text-lg text-white/70 leading-relaxed font-normal">{current.description}</p>
    </div>
  );
}
