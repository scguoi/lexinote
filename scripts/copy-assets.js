const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
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

// Copy manifest.json
fs.copyFileSync('manifest.json', 'dist/manifest.json');

// Copy _locales
copyDir('_locales', 'dist/_locales');

// Copy icons
copyDir('public/icons', 'dist/icons');

// Move HTML files to dist root
if (fs.existsSync('dist/src/popup/popup.html')) {
  fs.renameSync('dist/src/popup/popup.html', 'dist/popup.html');
}
if (fs.existsSync('dist/src/options/options.html')) {
  fs.renameSync('dist/src/options/options.html', 'dist/options.html');
}
// Clean up empty src directory
if (fs.existsSync('dist/src')) {
  fs.rmSync('dist/src', { recursive: true, force: true });
}

console.log('Assets copied to dist/');
