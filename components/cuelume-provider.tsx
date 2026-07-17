"use client";

import { useEffect } from "react";
import { bind } from "cuelume";

export function CuelumeProvider() {
  useEffect(() => {
    bind();
  }, []);
  return null;
}
