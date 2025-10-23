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

// Command to upload image, video, or audio file
zokou(
  {
    nomCom: "url1", // Command name
    categorie: "convertion", // Category
    reaction: "⚙️", // Reaction emoji
  },
  async (dest, zk, commandeOptions) => {
    const { msgRepondu, repondre, ms } = commandeOptions;

    // If no message (image/video/audio) is mentioned, prompt user
    if (!msgRepondu) {
      return repondre("Please mention an image, video, or audio.");
    }

    let mediaPath;

    try {
      // Detect media type and download accordingly
      if (msgRepondu.videoMessage) {
        mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.videoMessage);
      } else if (msgRepondu.gifMessage) {
        mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.gifMessage);
      } else if (msgRepondu.stickerMessage) {
        mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.stickerMessage);
      } else if (msgRepondu.documentMessage) {
        mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.documentMessage);
      } else if (msgRepondu.imageMessage) {
        mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.imageMessage);
      } else if (msgRepondu.audioMessage) {
        mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
      } else {
        return repondre("Please mention an image, video, or audio.");
      }

      // Upload the media to Catbox
      const fileUrl = await uploadToCatbox(mediaPath);

      // Delete the local media file
      fs.unlinkSync(mediaPath);

      // Respond with the URL
      repondre(fileUrl);

      // Send formatted confirmation message
      await zk.sendMessage(
        dest,
        {
          text: `✅ *File Uploaded Successfully*\n\n📎 *URL:* ${fileUrl}\n\n♻ Uploaded by DML`,
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
      console.error("Error while creating your URL:", error);
      repondre("Oops, there was an error while processing your request.");
    }
  }
);
