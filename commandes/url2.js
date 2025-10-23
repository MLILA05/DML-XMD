const { zokou } = require("../framework/zokou");
const { Catbox } = require("node-catbox");
const fs = require("fs-extra");
const { downloadAndSaveMediaMessage } = require("@whiskeysockets/baileys");
const config = require("../set");

// Initialize Catbox client
const catbox = new Catbox();

// Function to upload a file to Catbox
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

// Zokou command
zokou(
  {
    nomCom: "url1",
    categorie: "conversion",
    reaction: "⚙️",
  },
  async (dest, zk, ctx) => {
    const { msgRepondu, repondre } = ctx;

    // Ensure user replies to a media message
    if (!msgRepondu) {
      return repondre("Please reply to an image, video, or audio file.");
    }

    let mediaPath;

    try {
      // Detect media type and download
      if (msgRepondu.videoMessage) {
        mediaPath = await downloadAndSaveMediaMessage(msgRepondu.videoMessage);
      } else if (msgRepondu.gifMessage) {
        mediaPath = await downloadAndSaveMediaMessage(msgRepondu.gifMessage);
      } else if (msgRepondu.stickerMessage) {
        mediaPath = await downloadAndSaveMediaMessage(msgRepondu.stickerMessage);
      } else if (msgRepondu.documentMessage) {
        mediaPath = await downloadAndSaveMediaMessage(msgRepondu.documentMessage);
      } else if (msgRepondu.imageMessage) {
        mediaPath = await downloadAndSaveMediaMessage(msgRepondu.imageMessage);
      } else if (msgRepondu.audioMessage) {
        mediaPath = await downloadAndSaveMediaMessage(msgRepondu.audioMessage);
      } else {
        return repondre("Please reply to an image, video, or audio file.");
      }

      // Upload to Catbox
      const fileUrl = await uploadToCatbox(mediaPath);

      // Delete local file after upload
      fs.unlinkSync(mediaPath);

      // Send response with forwarded info
      await zk.sendMessage(
        dest,
        {
          text:
            `✅ *File Uploaded Successfully*\n\n📎 *URL:* ${fileUrl}\n\n> © Uploaded by DML 💜`,
          contextInfo: {
            mentionedJid: [],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363387497418815@newsletter",
              newsletterName: config.OWNER_NAME || "DML-URL",
              serverMessageId: 143,
            },
          },
        },
        { quoted: ctx.ms }
      );
    } catch (error) {
      console.error("Error while uploading to Catbox:", error);
      return repondre("⚠️ Sorry, an error occurred while uploading your file.");
    }
  }
);
