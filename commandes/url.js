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
    categorie: "convert",
    use: ".tourl [reply to media]",
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, msgRepondu, ms, auteurMessage } = commandeOptions;

    try {
      // Fetch the replied message or current message
      const quotedMsg = msgRepondu ? await zk.loadMessage(msgRepondu) : ms;
      const mimeType = quotedMsg?.message?.imageMessage?.mimetype
        || quotedMsg?.message?.videoMessage?.mimetype
        || quotedMsg?.message?.audioMessage?.mimetype
        || quotedMsg?.message?.documentMessage?.mimetype;

      if (!mimeType) {
        return repondre("Error: Please reply to an image, video, or audio file");
      }

      // Download the media
      const mediaBuffer = await zk.downloadMediaMessage(quotedMsg);
      const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}`);
      fs.writeFileSync(tempFilePath, mediaBuffer);

      // Get file extension
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

      // Upload
      const response = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
      });

      if (!response.data) throw "Error uploading to Catbox";

      fs.unlinkSync(tempFilePath);

      // Determine type
      let mediaType = "File";
      if (mimeType.includes("image")) mediaType = "Image";
      else if (mimeType.includes("video")) mediaType = "Video";
      else if (mimeType.includes("audio")) mediaType = "Audio";

      await zk.sendMessage(dest, {
        text: `*${mediaType} Uploaded Successfully*\n\n` +
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
      }, { quoted: ms });

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
