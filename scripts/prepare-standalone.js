/**
 * After `next build` with output: "standalone", copy the standalone server
 * and static assets into dist-electron/standalone so electron-builder can
 * package them (the .next directory is gitignored and electron-builder
 * respects .gitignore).
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standaloneSrc = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const publicSrc = path.join(root, "public");

// Target: dist-electron/standalone (already in electron-builder "files")
const standaloneDest = path.join(root, "dist-electron", "standalone");
const staticDest = path.join(standaloneDest, ".next", "static");
const publicDest = path.join(standaloneDest, "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: ${src} does not exist, skipping.`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean previous standalone copy
if (fs.existsSync(standaloneDest)) {
  fs.rmSync(standaloneDest, { recursive: true, force: true });
}

console.log("Copying .next/standalone -> dist-electron/standalone ...");
copyDir(standaloneSrc, standaloneDest);

console.log("Copying .next/static -> dist-electron/standalone/.next/static ...");
copyDir(staticSrc, staticDest);

console.log("Copying public -> dist-electron/standalone/public ...");
copyDir(publicSrc, publicDest);

console.log("Standalone preparation complete.");
