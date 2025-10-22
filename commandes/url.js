const { zokou } = require("../framework/zokou");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");

zokou(
  {
    nomCom: "url2",
    alias: ["imgtourl", "imgurl", "url", "geturl", "upload"],
    categorie: "utility",
    use: ".tourl [reply to media]",
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, msgRepondu, ms, auteurMessage } = commandeOptions;

    try {
      // Get the message containing media
      const quotedMsg = msgRepondu || ms;
      const messageContent = quotedMsg.message || quotedMsg;

      // Detect media type
      const mimeType =
        (messageContent.imageMessage && messageContent.imageMessage.mimetype) ||
        (messageContent.videoMessage && messageContent.videoMessage.mimetype) ||
        (messageContent.audioMessage && messageContent.audioMessage.mimetype) ||
        (messageContent.documentMessage && messageContent.documentMessage.mimetype) ||
        "";

      if (!mimeType) {
        return repondre("Error: Please reply to an image, video, or audio file");
      }

      // Download media
      const mediaBuffer =
        messageContent.imageMessage?.imageMessageBuffer ||
        messageContent.videoMessage?.videoMessageBuffer ||
        messageContent.audioMessage?.audioMessageBuffer ||
        messageContent.documentMessage?.documentMessageBuffer ||
        await zk.downloadMediaMessage(quotedMsg); // fallback

      const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}`);
      fs.writeFileSync(tempFilePath, mediaBuffer);

      // Determine file extension
      let extension = "";
      if (mimeType.includes("jpeg")) extension = ".jpg";
      else if (mimeType.includes("png")) extension = ".png";
      else if (mimeType.includes("video")) extension = ".mp4";
      else if (mimeType.includes("audio")) extension = ".mp3";

      const fileName = `file${extension}`;

      // Prepare form data
      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(tempFilePath), fileName);
      form.append("reqtype", "fileupload");

      // Upload to Catbox
      const response = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
      });

      if (!response.data) throw "Error uploading to Catbox";

      fs.unlinkSync(tempFilePath);

      // Determine media type for message
      let mediaType = "File";
      if (mimeType.includes("image")) mediaType = "Image";
      else if (mimeType.includes("video")) mediaType = "Video";
      else if (mimeType.includes("audio")) mediaType = "Audio";

      // Send response
      await zk.sendMessage(
        dest,
        {
          text:
            `*${mediaType} Uploaded Successfully*\n\n` +
            `*Size:* ${formatBytes(mediaBuffer.length)}\n` +
            `*URL:* ${response.data}\n\n♻ Uploaded by Dml`,
          contextInfo: {
            mentionedJid: [auteurMessage],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363387497418815@newsletter",
              newsletterName: "DML-TINY",
              serverMessageId: 143,
            },
          },
        },
        { quoted: ms }
      );
    } catch (error) {
      console.error(error);
      return repondre(`Error: ${error.message || error}`);
    }
  }
);

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
