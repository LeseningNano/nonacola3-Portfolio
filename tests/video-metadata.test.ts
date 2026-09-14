import assert from "node:assert/strict";
import test from "node:test";
import { videoCreateSchema, videoUpdateSchema } from "../lib/schemas";

const requiredVideo = {
  title: "Numb Numb PV",
  category: "Virtual Singer Cover PV",
  embedUrl: "https://example.com/video",
};

test("create accepts optional role and tools", () => {
  const result = videoCreateSchema.parse({
    ...requiredVideo,
    role: "Motion Design / Compositing",
    tools: "After Effects · Blender",
  });
  assert.equal(result.role, "Motion Design / Compositing");
  assert.equal(result.tools, "After Effects · Blender");
});

test("update accepts explicit null and rejects oversized metadata", () => {
  assert.deepEqual(videoUpdateSchema.parse({ role: null, tools: null }), {
    role: null,
    tools: null,
  });
  assert.equal(videoUpdateSchema.safeParse({ role: "x".repeat(201) }).success, false);
  assert.equal(videoUpdateSchema.safeParse({ tools: "x".repeat(201) }).success, false);
});
