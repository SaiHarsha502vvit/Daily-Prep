const fs = require("fs");
const lines = fs
  .readFileSync(
    "21_SDET_Playwright_Automation/05_Advanced_Topics/42_Polling_Async_Data_Patterns.md",
    "utf8",
  )
  .split("\n");
let open = false;
let i = 1;
for (const l of lines) {
  if (l.trim().startsWith("\`\`\`")) {
    open = !open;
    console.log(`${i}: ${l.trim()} -> ${open ? "OPEN" : "CLOSE"}`);
  }
  i++;
}
