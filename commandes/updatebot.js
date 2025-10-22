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

    if (!isOwner) return repondre("This command is only for the bot owner.");

    try {
      await repondre("🔍 Checking for DML-XMD updates...");

      // Fetch the latest commit hash from GitHub
      const { data: commitData } = await axios.get(
        "https://api.github.com/repos/MLILA05/DML-XMD/commits/main"
      );
      const latestCommitHash = commitData.sha;

      // Get the stored commit hash from the database
      const currentHash = await getCommitHash();

      if (latestCommitHash === currentHash) {
        return repondre("✅ Your DML-XMD bot is already up-to-date!");
      }

      await repondre("🚀 Updating DML-XMD Bot...");

      // Download the latest code
      const zipPath = path.join(__dirname, "latest.zip");
      const { data: zipData } = await axios.get(
        "https://github.com/MLILA05/DML-XMD/archive/main.zip",
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(zipPath, zipData);

      // Extract ZIP file
      await repondre("📦 Extracting the latest code...");
      const extractPath = path.join(__dirname, "latest");
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);

      // Copy updated files, preserving config.js and app.json
      await repondre("🔄 Replacing files...");
      const sourcePath = path.join(extractPath, "DML-XMD-main");
      const destinationPath = path.join(__dirname, "..");
      copyFolderSync(sourcePath, destinationPath);

      // Save the latest commit hash to the database
      await setCommitHash(latestCommitHash);

      // Cleanup
      fs.unlinkSync(zipPath);
      fs.rmSync(extractPath, { recursive: true, force: true });

      await repondre("✅ Update complete! Restarting the bot...");
      process.exit(0);
    } catch (error) {
      console.error("Update error:", error);
      return repondre("❌ Update failed. Please try manually.");
    }
  }
);

// Helper function to copy directories while preserving config.js and app.json
function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);

    // Skip config.js and app.json
    if (item === "config.js" || item === "app.json") {
      console.log(`Skipping ${item} to preserve custom settings.`);
      continue;
    }

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
