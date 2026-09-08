#!/usr/bin/env node

/**
 * Read-only production performance sampler.
 *
 * Examples:
 *   node scripts/measure-performance-baseline.mjs --news-path /news/<published-post-id>
 *   node scripts/measure-performance-baseline.mjs --news-path /news/<published-post-id> --samples 7
 *   node scripts/measure-performance-baseline.mjs --news-path /news/<published-post-id> --database
 *
 * `--database` performs only Prisma count queries. It requires a local database
 * environment variable and never prints connection strings or query results.
 */

import { performance } from "node:perf_hooks";

const DEFAULT_BASE_URL = "https://www.nonacola3.com";
const args = new Map();

for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (!argument.startsWith("--")) continue;
  const [key, value] = argument.slice(2).split("=", 2);
  args.set(key, value ?? (!process.argv[index + 1]?.startsWith("--") ? process.argv[++index] : true));
}

const baseUrl = String(args.get("base-url") ?? process.env.PERF_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
const newsPath = args.get("news-path") ?? process.env.PERF_NEWS_PATH;
const samples = Number(args.get("samples") ?? process.env.PERF_SAMPLES ?? 5);

if (!Number.isInteger(samples) || samples < 1 || samples > 20) {
  throw new Error("--samples must be an integer from 1 to 20.");
}

if (!newsPath || !String(newsPath).startsWith("/news/")) {
  throw new Error("Provide a published post path with --news-path /news/<id> (or PERF_NEWS_PATH).");
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function summarize(results) {
  const ttfb = results.map((item) => item.ttfbMs);
  const sizes = results.map((item) => item.responseBytes).filter((size) => size !== null);
  return {
    status: results.map((item) => item.status),
    ttfbMs: { median: Math.round(percentile(ttfb, 0.5)), p95: Math.round(percentile(ttfb, 0.95)) },
    responseBytes: sizes.length ? { median: Math.round(percentile(sizes, 0.5)), p95: Math.round(percentile(sizes, 0.95)) } : null,
    samples: results,
  };
}

async function measure(url, method = "GET") {
  const startedAt = performance.now();
  const response = await fetch(url, { method, redirect: "follow", cache: "no-store" });
  const ttfbMs = Math.round(performance.now() - startedAt);
  const contentLength = response.headers.get("content-length");
  let responseBytes = contentLength === null ? null : Number(contentLength);

  if ((responseBytes === null || !Number.isFinite(responseBytes)) && method !== "HEAD") {
    const body = await response.arrayBuffer();
    responseBytes = body.byteLength;
  }

  return { status: response.status, ttfbMs, responseBytes };
}

async function sampleEndpoint(path) {
  const url = new URL(path, `${baseUrl}/`).toString();
  const results = [];
  for (let index = 0; index < samples; index += 1) results.push(await measure(url));
  return summarize(results);
}

async function measureDatabase() {
  const hasDatabaseUrl = ["POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED", "DATABASE_URL"]
    .some((name) => Boolean(process.env[name]));
  if (!hasDatabaseUrl) throw new Error("--database requires a local database environment variable.");

  const { db } = await import("../lib/db.ts");
  const results = [];
  try {
    for (let index = 0; index < 3; index += 1) {
      const startedAt = performance.now();
      await db.video.count();
      results.push({ elapsedMs: Math.round(performance.now() - startedAt) });
    }
  } finally {
    await db.$disconnect();
  }
  return results;
}

const heroApiPath = "/api/hero";
const homepage = await sampleEndpoint("/");
const news = await sampleEndpoint(String(newsPath));
const heroApi = await sampleEndpoint(heroApiPath);

const heroResponse = await fetch(new URL(heroApiPath, `${baseUrl}/`), { cache: "no-store" });
if (!heroResponse.ok) throw new Error(`Cannot read Hero URL: API returned ${heroResponse.status}.`);
const hero = await heroResponse.json();
if (!hero?.blobUrl || typeof hero.blobUrl !== "string") throw new Error("Hero API response did not include blobUrl.");

const report = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  samples,
  endpoints: { homepage, news, heroApi },
  heroFileHead: await measure(hero.blobUrl, "HEAD"),
  databaseReadOnlyCounts: args.has("database") ? await measureDatabase() : null,
};

console.log(JSON.stringify(report, null, 2));
