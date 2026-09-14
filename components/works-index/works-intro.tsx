"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getWorksHeadlineTokens } from "@/lib/works-index";
import styles from "./works-intro.module.css";

export function WorksIntro({ children }: { children: ReactNode }) {
  const tokens = getWorksHeadlineTokens();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={entered ? styles.entered : undefined}>
      <header>
        <p className={`${styles.supporting} text-xs tracking-[0.28em] text-neutral-400`}>
          MOTION DESIGNER · CHINA
        </p>
        <div className="mt-5 grid gap-7 md:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] md:items-end md:gap-12">
          <h1
            aria-label={tokens.map((token) => token.text).join(" ")}
            className="text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-6xl"
          >
            {tokens.map((token, index) => (
              <span
                key={`${token.text}-${index}`}
                aria-hidden="true"
                className={`${styles.word} ${token.highlighted ? "text-white" : "text-neutral-500"}`}
                style={{ "--word-index": index } as CSSProperties}
              >
                {token.text}{" "}
              </span>
            ))}
          </h1>
          <div className={styles.supporting}>
            <p className="text-sm leading-6 text-neutral-400 md:text-base">
              Available for motion design, compositing and promotional visual work.
            </p>
            <dl className="mt-5 space-y-2 border-y border-white/10 py-4 text-sm">
              <div className="grid grid-cols-[4rem_1fr] gap-3">
                <dt className="text-neutral-500">Focus</dt>
                <dd className="text-neutral-300">PV · Compositing · 3D</dd>
              </div>
              <div className="grid grid-cols-[4rem_1fr] gap-3">
                <dt className="text-neutral-500">Tools</dt>
                <dd className="text-neutral-300">After Effects · Blender</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>
      <div className={styles.supporting}>{children}</div>
    </div>
  );
}
