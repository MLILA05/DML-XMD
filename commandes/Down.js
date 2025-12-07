const { zokou } = require("../framework/zokou");
const axios = require("axios");

// Helper function to extract link
function getUrl(message, match) {
  return match || message.body.split(" ")[1];
}

// Helper to extract video URL from different API formats
function extractVideo(result) {
  if (!result) return null;

  return (
    result.url ||
    result.video ||
    result.download_url ||
    result.link ||
    (Array.isArray(result) ? result[0]?.url : null) ||
    null
  );
}



// ------------------ FACEBOOK DOWNLOADER ------------------
zokou(
  {
    nomCom: "fb",
    categorie: "Downloader",
    reaction: "📥",
    desc: "Facebook Video Downloader"
  },
  async (message, match, client) => {
    try {
      const url = getUrl(message, match);

      if (!url) {
        return message.reply("❗ *Weka link ya Facebook kwanza.*\n\nMfano:\n.fb https://facebook.com/xxxx");
      }

      const apiUrl = `https://api.fikmydomainsz.xyz/download/facebook?url=${encodeURIComponent(url)}`;

      let { data } = await axios.get(apiUrl);

      console.log("Facebook API Response:", data); // For debugging

      if (!data || !data.result) {
        return message.reply("⚠️ API hajarudisha data sahihi.");
      }

      let videoUrl = extractVideo(data.result);

      if (!videoUrl) {
        return message.reply("⚠️ *Video URL haikuonekana kwenye response.*");
      }

      await client.sendMessage(
        message.from,
        {
          video: { url: videoUrl },
          caption: `✔️ Facebook Video Downloaded`
        },
        { quoted: message }
      );
    } catch (e) {
      console.log("FB Error:", e);
      return message.reply("❌ *Error kutuma video. API inaweza kuwa chini.*");
    }
  }
);




// ------------------ ALL DOWNLOADER ------------------
zokou(
  {
    nomCom: "all",
    categorie: "Downloader",
    reaction: "🌐",
    desc: "All-in-One Downloader"
  },
  async (message, match, client) => {
    try {
      const url = getUrl(message, match);

      if (!url) {
        return message.reply("❗ *Weka link yoyote ya media.*\n\nMfano:\n.all https://instagram.com/xxxx");
      }

      const apiUrl = `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodeURIComponent(url)}`;

      let { data } = await axios.get(apiUrl);

      console.log("ALL API Response:", data); // Debug

      if (!data || !data.result) {
        return message.reply("⚠️ *API haijatoa data.*");
      }

      let videoUrl = extractVideo(data.result);

      if (!videoUrl) {
        return message.reply("⚠️ *Hakuna video URL iliyoonekana.*");
      }

      await client.sendMessage(
        message.from,
        {
          video: { url: videoUrl },
          caption: `✔️ Media Downloaded`
        },
        { quoted: message }
      );
    } catch (err) {
      console.log("ALL Error:", err);
      return message.reply("❌ *Kosa limetokea wakati wa kupakua.*");
    }
  }
);
