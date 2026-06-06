"use client";

// Types `text` out one character at a time after an optional start delay, with
// a thin caret that blinks once typing finishes. Used for the search-field
// placeholders on the /start page.

import { useEffect, useState } from "react";

export function Typewriter({
  text,
  speed = 40,
  startDelay = 0,
  className,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  const done = count >= text.length;

  return (
    <span className={className}>
      {text.slice(0, count)}
      <span className="type-caret" data-done={done} aria-hidden />
    </span>
  );
}
