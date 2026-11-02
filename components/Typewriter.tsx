"use client";

import { useEffect, useState } from "react";

/** Typewriter line in the accent colour, like the hero on volopay.com. Static first phrase under reduced motion. */
export default function Typewriter({ phrases }: { phrases: string[] }) {
  const [text, setText] = useState(phrases[0] ?? "");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    let i = 0, n = 0, del = false, t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = phrases[i];
      n += del ? -1 : 1;
      setText(full.slice(0, n));
      let wait = del ? 35 : 75;
      if (!del && n === full.length) { del = true; wait = 1400; }
      else if (del && n === 0) { del = false; i = (i + 1) % phrases.length; wait = 350; }
      t = setTimeout(tick, wait);
    };
    setText("");
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [phrases]);

  return (
    <span className="type" aria-live="off">
      <span aria-hidden={!reduced}>{text}</span>{!reduced && <span className="caret" aria-hidden />}
      <span style={{ position: "absolute", left: -9999 }}>{phrases.join(", ")}</span>
    </span>
  );
}
