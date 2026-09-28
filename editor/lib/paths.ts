import { resolve } from "node:path";

// The Next dev/build cwd is the editor-app root. The shared data lives one level up.
const ROOT = resolve(process.cwd(), "..");
export const JSON_DIR = resolve(ROOT, "takemytrip", "data");
export const NEXTAPP_DIR = resolve(ROOT, "my-nextjs-app");
