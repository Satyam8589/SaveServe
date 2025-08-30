// Simple script to help generate PWA icons
// You can run this script manually when needed

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

console.log("This script will help you generate PWA icons from your logo.");
console.log("Instructions:");
console.log("1. Make sure you have ImageMagick installed on your system");
console.log(
  "   You can download it from: https://imagemagick.org/script/download.php"
);
console.log(
  "2. Place your source logo in public/logo.png (should be at least 512x512)"
);
console.log("3. Run this script with: node scripts/generate-pwa-icons.js");
console.log("\nIcon sizes to be generated:");
console.log(
  "72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512"
);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = path.resolve(__dirname, "../public/logo.png");
const targetDir = path.resolve(__dirname, "../public/icons");

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error("\nError: Source image not found at", sourceImage);
  console.log("Please place your logo at public/logo.png");
  process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log("Created directory:", targetDir);
}

console.log("\nTo generate icons, you would run:");
sizes.forEach((size) => {
  const command = `magick convert "${sourceImage}" -resize ${size}x${size} "${path.join(
    targetDir,
    `icon-${size}x${size}.png`
  )}"`;
  console.log(command);
});

console.log(
  "\nSince we can't execute these commands directly from this script for security reasons,"
);
console.log(
  "you can copy and paste these commands to your terminal if you have ImageMagick installed."
);
console.log(
  "Alternatively, you can manually resize the image using any image editor."
);
