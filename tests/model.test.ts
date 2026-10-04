import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT,
  OPTIONS,
  keysFor,
  parseJSON,
  validate,
  fromURL,
  toURL,
  buildSheet,
} from "../src/model.ts";
test("each layout has unique physical codes and non-overlapping key rectangles", () => {
  for (const layout of OPTIONS.layout) {
    const keys = keysFor(layout);
    assert.equal(new Set(keys.map((k) => k.code)).size, keys.length);
    for (const a of keys)
      for (const b of keys) {
        if (a === b || a.z !== b.z) continue;
        assert.ok(
          Math.abs(a.x - b.x) >= (a.w + b.w) / 2 - 0.001,
          `${layout}: ${a.code} overlaps ${b.code}`,
        );
      }
    for (const code of [
      "KeyA",
      "Space",
      "Enter",
      "Escape",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
    ])
      assert.ok(keys.some((k) => k.code === code));
    assert.equal(
      keys.some((k) => k.code === "F12"),
      layout !== "65",
    );
  }
});
test("every option validates and round-trips through JSON and URL", () => {
  for (const [key, values] of Object.entries(OPTIONS))
    for (const value of values) {
      const config = validate({ ...DEFAULT, [key]: value });
      assert.deepEqual(parseJSON(JSON.stringify(config)), config);
      assert.deepEqual(
        fromURL(toURL(config, "https://example.com/keyform/")),
        config,
      );
    }
});
test("untrusted configurations fail closed", () => {
  for (const raw of [
    "{}",
    "null",
    "[]",
    "oops",
    JSON.stringify({ ...DEFAULT, version: 2 }),
    JSON.stringify({ ...DEFAULT, layout: "100" }),
    JSON.stringify({ ...DEFAULT, input: "private" }),
    JSON.stringify({ ...DEFAULT, __proto__: {} }),
    " ".repeat(4100),
  ]) {
    if (raw === JSON.stringify(DEFAULT)) continue;
    assert.throws(() => parseJSON(raw));
  }
  assert.throws(() => fromURL("https://example.com/?build=%7Bbad"));
  assert.equal(fromURL("https://example.com/?other=1"), null);
});
test("build sheet identifies concept and never contains input data", () => {
  assert.match(buildSheet(DEFAULT, "en"), /compatibility is not claimed/);
  assert.match(buildSheet(DEFAULT, "ru"), /схематическая/);
  assert.ok(
    !toURL(DEFAULT, "https://example.com/?private=secret").includes("secret"),
  );
});
