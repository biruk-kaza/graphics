// Copies Noto Sans Ethiopic (Ethiopic subset) from the npm package into public/fonts
// so the video always uses LOCAL font files (no network at render time).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "@fontsource", "noto-sans-ethiopic", "files");
const dst = path.join(root, "public", "fonts");
fs.mkdirSync(dst, { recursive: true });

if (!fs.existsSync(src)) {
  console.warn("[fonts] @fontsource/noto-sans-ethiopic not installed yet - skipping");
  process.exit(0);
}
let n = 0;
for (const f of fs.readdirSync(src)) {
  const m = f.match(/-(\d{3})-normal\.woff2$/);
  if (!m || f.includes("latin") || !f.includes("ethiopic")) continue;
  fs.copyFileSync(path.join(src, f), path.join(dst, `NotoSansEthiopic-${m[1]}.woff2`));
  n++;
}
console.log(`[fonts] copied ${n} Noto Sans Ethiopic files to public/fonts`);
if (n === 0) { console.error("[fonts] no Ethiopic font files found!"); process.exit(1); }
