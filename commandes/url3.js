const { zokou } = require("../framework/zokou");
const { Catbox } = require("node-catbox");
const fs = require("fs-extra");
const { downloadAndSaveMediaMessage } = require("@whiskeysockets/baileys");
const config = require("../set"); // Added for config.OWNER_NAME usage

// Initialize Catbox
const catbox = new Catbox();

// Function to upload a file to Catbox and return the URL
async function uploadToCatbox(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File does not exist");
  }
  try {
    const uploadResult = await catbox.uploadFile({ path: filePath });
    if (uploadResult) {
      return uploadResult;
    } else {
      throw new Error("Error retrieving file link");
    }
  } catch (error) {
    throw new Error(String(error));
  }
}

// Command to upload multiple media files
zokou(
  {
    nomCom: "url3",
    categorie: "convertion",
    reaction: "⚙️",
  },
  async (dest, zk, commandeOptions) => {
    const { msgRepondu, repondre, ms } = commandeOptions;

    if (!msgRepondu) {
      return repondre("Please reply to one or more media files (image, video, audio, etc.)");
    }

    try {
      const messageContent = msgRepondu.message || msgRepondu; // Normalize structure
      const mediaTypes = [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "stickerMessage",
        "documentMessage",
        "gifMessage",
      ];

      const mediaPaths = [];

      // Loop through possible media types and collect all that exist
      for (const type of mediaTypes) {
        if (messageContent[type]) {
          const path = await zk.downloadAndSaveMediaMessage(messageContent[type]);
          if (path) mediaPaths.push(path);
        }
      }

      if (mediaPaths.length === 0) {
        return repondre("No valid media found in the replied message.");
      }

      // Upload all media files
      const uploadResults = [];
      for (const filePath of mediaPaths) {
        try {
          const url = await uploadToCatbox(filePath);
          uploadResults.push(url);
          fs.unlinkSync(filePath); // Delete file after upload
        } catch (err) {
          console.error("Upload failed for", filePath, err);
        }
      }

      // Prepare response message
      if (uploadResults.length === 0) {
        return repondre("Failed to upload all media files. Please try again.");
      }

      const formattedUrls = uploadResults
        .map((url, i) => `📎 *File ${i + 1}:* ${url}`)
        .join("\n\n");

      const responseText = `✅ *Files Uploaded Successfully*\n\n${formattedUrls}\n\n♻ Uploaded by DML`;

      // Send back result message
      await zk.sendMessage(
        dest,
        {
          text: responseText,
          contextInfo: {
            mentionedJid: [],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363387497418815@newsletter",
              newsletterName: config.OWNER_NAME || "DML-MD",
              serverMessageId: 143,
            },
          },
        },
        { quoted: ms }
      );
    } catch (error) {
      console.error("Error while uploading:", error);
      repondre("⚠️ Oops! Something went wrong while processing your request.");
    }
  }
);
