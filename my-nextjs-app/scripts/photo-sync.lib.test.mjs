// scripts/photo-sync.lib.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeName, parseGeneratedMap, folderFromPath,
  pickSourceImage, resolveTie, emitGeneratedText,
} from "./photo-sync.lib.mjs";

test("normalizeName trims, collapses whitespace, strips trailing dot", () => {
  assert.equal(normalizeName("Zoologischer Garten + Aquarium Berlin. "),
    "Zoologischer Garten + Aquarium Berlin");
  assert.equal(normalizeName("Daytime Sightseeing Cruise "), "Daytime Sightseeing Cruise");
  assert.equal(normalizeName("Urban Planet Las Rejas"), "Urban Planet Las Rejas");
});

test("parseGeneratedMap reads name -> string[] entries", () => {
  const ts = `export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {\n` +
    `  "Park Güell": ["/destinations/barcelona/2-park-guell/1.jpg"],\n` +
    `  "British Museum": ["/destinations/london/10-british-museum/1.jpg","/destinations/london/10-british-museum/2.jpg"],\n` +
    `};\n`;
  const m = parseGeneratedMap(ts);
  assert.deepEqual(m.get("Park Güell"), ["/destinations/barcelona/2-park-guell/1.jpg"]);
  assert.equal(m.get("British Museum").length, 2);
});

test("folderFromPath extracts id + folder", () => {
  assert.deepEqual(folderFromPath("/destinations/barcelona/4-casa-mila-la-pedrera/1.jpg"),
    { id: "barcelona", folder: "4-casa-mila-la-pedrera" });
  assert.equal(folderFromPath("not-a-path"), null);
});

test("pickSourceImage returns the lone image regardless of extension", () => {
  assert.equal(pickSourceImage(["photo-123.avif"]), "photo-123.avif");
  assert.equal(pickSourceImage(["readme.txt"]), null);
});

test("resolveTie prefers the generated map and reads its real folder", () => {
  const gen = new Map([
    ["Casa Milà (La Pedrera)", ["/destinations/barcelona/4-casa-mila-la-pedrera/1.jpg"]],
  ]);
  const r = resolveTie("Casa Milà (La Pedrera)", gen, []);
  assert.deepEqual(r, { name: "Casa Milà (La Pedrera)", id: "barcelona", folder: "4-casa-mila-la-pedrera", inMap: true });
});

test("resolveTie matches across trailing-dot drift via normalization", () => {
  const gen = new Map([
    ["Zoologischer Garten + Aquarium Berlin. ", ["/destinations/berlin/11-zoologischer-garten-aquarium-berlin/1.jpg"]],
  ]);
  const r = resolveTie("Zoologischer Garten + Aquarium Berlin", gen, []);
  assert.equal(r.name, "Zoologischer Garten + Aquarium Berlin. ");
  assert.equal(r.folder, "11-zoologischer-garten-aquarium-berlin");
  assert.equal(r.inMap, true);
});

test("resolveTie falls back to the catalogue when not in the map", () => {
  const cat = [{ name: "Explora", cityId: "rome", folder: "9-explora" }];
  const r = resolveTie("Explora", new Map(), cat);
  assert.deepEqual(r, { name: "Explora", id: "rome", folder: "9-explora", inMap: false });
});

test("resolveTie returns null when nothing matches", () => {
  assert.equal(resolveTie("Nope", new Map(), []), null);
});

test("emitGeneratedText sorts keys and keeps the canonical header", () => {
  const m = new Map([
    ["Zebra", ["/destinations/x/1-z/1.jpg"]],
    ["Apple", ["/destinations/x/2-a/1.jpg"]],
  ]);
  const out = emitGeneratedText(m);
  assert.ok(out.startsWith("/* eslint-disable */\n"));
  assert.ok(out.includes("export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {"));
  assert.ok(out.indexOf('"Apple"') < out.indexOf('"Zebra"'));
  assert.ok(out.includes(`  "Apple": ["/destinations/x/2-a/1.jpg"],`));
});
