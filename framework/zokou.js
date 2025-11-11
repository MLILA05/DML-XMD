// ================================
// 📁 framework/zokou.js
// ================================

const fs = require("fs");
const path = require("path");

var tabCmds = [];
let cm = [];

/**
 * 🧩 Zokou Function
 * - Huhifadhi command zote zenye jina, category, reaction, na function yake
 */
function zokou(obj, fonctions) {
  let infoComs = obj;
  if (!obj.categorie) {
    infoComs.categorie = "General";
  }
  if (!obj.reaction) {
    infoComs.reaction = "🚀";
  }
  infoComs.fonction = fonctions;
  cm.push(infoComs);
  return infoComs;
}

// ================================
// 📦 Export main function & command list
// ================================
module.exports = { zokou, Module: zokou, cm };

// ================================
// ⚡ Auto-Loader for Commands Folder
// ================================
const commandsPath = path.join(__dirname, "..", "commands");

if (fs.existsSync(commandsPath)) {
  fs.readdirSync(commandsPath).forEach((file) => {
    if (file.endsWith(".js")) {
      try {
        require(path.join(commandsPath, file));
        console.log(`✅ Command loaded: ${file}`);
      } catch (err) {
        console.error(`❌ Error loading command ${file}:`, err);
        console.log("✅ update.js command file loaded successfully!");
      }
    }
  });
} else {
  console.warn("⚠️ Commands folder not found. No commands loaded.");
                               }
