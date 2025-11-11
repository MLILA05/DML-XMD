const { zokou } = require("../framework/zokou");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { setCommitHash, getCommitHash } = require("../bdd/updateDB");

zokou(
  {
    nomCom: "update",
    categorie: "misc",
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, isOwner } = commandeOptions;

    if (!isOwner) return repondre("❌ This command is only for the bot owner.");

    try {
      await repondre("🔍 Checking for DML-XMD updates...");

      // Fetch the latest commit hash from GitHub
      const { data: commitData } = await axios.get(
        "https://api.github.com/repos/MLILA05/DML-XMD/commits/main"
      );
      const latestCommitHash = commitData.sha;

      // Get the stored commit hash
      const currentHash = await getCommitHash();

      if (latestCommitHash === currentHash) {
        return repondre("✅ Your DML-XMD bot is already up-to-date!");
      }

      await repondre("🚀 Update available! Downloading the latest version...");

      // Download the latest code ZIP
      const zipPath = path.join(__dirname, "latest.zip");
      const { data: zipData } = await axios.get(
        "https://github.com/MLILA05/DML-XMD/archive/main.zip",
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(zipPath, zipData);

      // Extract ZIP
      await repondre("📦 Extracting files...");
      const extractPath = path.join(__dirname, "latest");
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);

      // Replace old files
      await repondre("🔄 Replacing old files...");
      const sourcePath = path.join(extractPath, "DML-XMD-main");
      const destinationPath = path.join(__dirname, "..");
      copyFolderSync(sourcePath, destinationPath);

      // Save the new commit hash
      await setCommitHash(latestCommitHash);

      // Clean up temp files
      fs.unlinkSync(zipPath);
      fs.rmSync(extractPath, { recursive: true, force: true });

      await repondre("✅ Update complete! Restarting bot...");
      process.exit(0);
    } catch (error) {
      console.error("Update error:", error);
      return repondre("❌ Update failed. Please try manually later.");
    }
  }
);

// Helper function: copy all files except config.js & app.json
function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

  const items = fs.readdirSync(source);
  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);

    // Skip sensitive/local files
    if (
      item === "config.js" ||
      item === "app.json" ||
      item === "node_modules"
    ) {
      console.log(`⚠️ Skipping ${item} to preserve local setup.`);
      continue;
    }

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
                        }
