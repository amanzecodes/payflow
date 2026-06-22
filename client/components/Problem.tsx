"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const steps = [
  {
    bold: "The treasurer shares one account number with the whole cooperative.",
    muted: "Money lands. Names don't.",
    quote: "“Who just sent ₦10k?”",
  },
  {
    bold: "So it moves to WhatsApp.",
    muted:
      "Screenshots, voice notes, “abeg confirm you don pay”. Every single cycle.",
    quote: "“Reminder — dues are due”",
  },
  {
    bold: "By the time it's reconciled in a notebook,",
    muted: "half the month is gone and someone's name is still missing.",
    quote: "“Let me check and reply you”",
  },
];

const Problem = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const index = Math.min(
        steps.length - 1,
        Math.floor(progress * steps.length),
      );
      setActive((prev) => (prev === index ? prev : index));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section>
      <div
        ref={wrapperRef}
        className="relative"
        style={{ height: `${steps.length * 100}vh` }}
      >
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center bg-linear-to-b from-blue-200 via-blue-100 to-white px-6 text-center">
          <h6 className="text-xs font-medium uppercase tracking-widest text-foreground/40">
            The Problem
          </h6>

          <div className="relative mt-6 h-48 w-full max-w-3xl md:h-40">
            <AnimatePresence>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col items-center"
              >
                <h1 className="text-4xl md:text-5xl font-semibold">
                  {steps[active].bold}{" "}
                  <span className="text">{steps[active].muted}</span>
                </h1>
                <p className="mt-6 text-lg italic text-foreground/50">
                  {steps[active].quote}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-0 bottom-12 flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                  i === active ? "bg-foreground/70" : "bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
