import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("admin palette is defined once with the approved values", () => {
  for (const [name, value] of [
    ["canvas", "#0b0b0c"], ["panel", "#111113"], ["raised", "#16161a"], ["selected", "#1c1c21"],
    ["line", "#222227"], ["line-strong", "#2e2e35"], ["fg", "#ededee"], ["fg-2", "#a1a1a8"],
    ["fg-3", "#7a7a83"], ["accent", "#ff5a1f"], ["accent-fg", "#1a0800"], ["accent-text", "#ff8a5c"],
    ["success", "#3ecf8e"], ["success-text", "#5fd49a"], ["danger", "#f2555a"],
  ]) {
    assert.match(css, new RegExp(`--admin-${name}:\\s*${value};`), name);
    assert.match(css, new RegExp(`--color-admin-${name}:\\s*var\\(--admin-${name}\\);`), `${name} utility`);
  }
  assert.match(css, /--font-pixel:\s*var\(--font-bitcount\)/);
  assert.match(css, /--font-admin-mono:\s*var\(--font-jetbrains-mono\)/);
});

test("shadcn overrides only apply while an admin surface is mounted", () => {
  const scoped = css.match(/:root:has\(\[data-admin-theme\]\)\s*\{([^}]+)\}/)?.[1] ?? "";
  for (const variable of ["--primary", "--primary-foreground", "--border", "--input", "--ring", "--popover", "--muted-foreground", "--destructive"]) {
    assert.match(scoped, new RegExp(`${variable}:`), variable);
  }
  assert.match(scoped, /--primary:\s*#ff5a1f;/);
  const dark = css.match(/\.dark\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.doesNotMatch(dark, /ff5a1f/);
});

test("the admin mono font is declared without preloading on public pages", () => {
  assert.match(layout, /JetBrains_Mono\(/);
  assert.match(layout, /variable:\s*"--font-jetbrains-mono"/);
  assert.match(layout, /preload:\s*false/);
  assert.match(layout, /\$\{jetbrainsMono\.variable\}/);
});
