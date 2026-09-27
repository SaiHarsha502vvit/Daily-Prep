#!/usr/bin/env node
// Run a lab's app so you can explore it in a browser and run your tests by hand.
//
//   npm run app -- 02              the correct version on http://localhost:4400
//   PORT=5000 npm run app -- 02    another port
//
// Then, in a second terminal:  npx playwright test 02-cookie-consent --headed
// (Only the CORRECT version is served here; the buggy versions are the grader's job.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LABS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const labArg = process.argv[2];
if (!labArg) { console.error("Usage: npm run app -- <lab number>"); process.exit(2); }
const labDirName = fs.readdirSync(LABS).find((d) => d.startsWith(labArg.padStart(2, "0") + "-"));
if (!labDirName) { console.error(`No lab "${labArg}"`); process.exit(2); }

const { start } = await import(pathToFileURL(path.join(LABS, labDirName, "app", "server.mjs")).href);
const app = await start({ variant: "good", port: Number(process.env.PORT ?? 4400) });
console.log(`${labDirName} is running at ${app.url}  (Ctrl+C to stop)`);
