"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type IntentPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  href: string;
};

const prefetchedUrls = new Set<string>();

export function IntentPrefetchLink({ href, ...props }: IntentPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  const enableFullPrefetch = () => {
    if (prefetchedUrls.has(href)) return;
    prefetchedUrls.add(href);
    setShouldPrefetch(true);
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={shouldPrefetch ? true : false}
      onPointerEnter={enableFullPrefetch}
      onFocus={enableFullPrefetch}
      onPointerDown={(event) => {
        if (event.pointerType === "touch" || event.pointerType === "pen") {
          enableFullPrefetch();
        }
      }}
    />
  );
}
