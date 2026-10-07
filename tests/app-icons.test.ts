import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import sharp from "sharp";

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test("favicon.ico embeds 16, 32 and 48px avatar PNGs", () => {
  const ico = readFileSync(file("app/favicon.ico"));
  assert.equal(ico.readUInt16LE(2), 1, "ICO type");
  const count = ico.readUInt16LE(4);
  const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + i * 16));
  assert.deepEqual(sizes, [16, 32, 48]);
  // 每个条目都是 PNG 数据（不是 Next 脚手架自带的默认图标）
  for (let i = 0; i < count; i++) {
    const offset = ico.readUInt32LE(6 + i * 16 + 12);
    assert.equal(ico.subarray(offset, offset + 4).toString("latin1"), "\x89PNG");
  }
});

test("icon.png and apple-icon.png are small square avatar crops", async () => {
  const icon = await sharp(readFileSync(file("app/icon.png"))).metadata();
  assert.equal(icon.width, 192);
  assert.equal(icon.height, 192);

  const apple = await sharp(readFileSync(file("app/apple-icon.png"))).metadata();
  assert.equal(apple.width, 180);
  assert.equal(apple.height, 180);
  assert.ok(readFileSync(file("app/icon.png")).length < 60_000, "icon stays light");
});
