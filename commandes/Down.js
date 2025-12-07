const { zokou } = require("../framework/zokou");
const axios = require("axios");

zokou(
  {
    nomCom: "fb",
    categorie: "Downloader",
    reaction: "📥",
    desc: "Facebook Video Downloader"
  },
  async (message, match, client) => {
    try {
      const url = match;

      if (!url) {
        return message.reply("❗ *Weka link ya Facebook kwanza.*");
      }

      const apiUrl = `https://api.fikmydomainsz.xyz/download/facebook?url=${encodeURIComponent(
        url
      )}`;

      let { data } = await axios.get(apiUrl);

      if (!data || !data.result) {
        return message.reply("⚠️ *Imeshindikana kupata video. Jaribu link nyingine.*");
      }

      await client.sendMessage(
        message.from,
        {
          video: { url: data.result.url },
          caption: `Downloaded ✔️\nFacebook Video`
        },
        { quoted: message }
      );
    } catch (e) {
      console.log(e);
      return message.reply("❌ *Error kutuma video.*");
    }
  }
);


// 🔥 ALL DOWNLOADER (IG, TikTok, Twitter, FB, etc)
zokou(
  {
    nomCom: "all",
    categorie: "Downloader",
    reaction: "🌐",
    desc: "All-in-One Downloader"
  },
  async (message, match, client) => {
    try {
      const url = match;

      if (!url) {
        return message.reply("❗ *Weka link yoyote ya media.*");
      }

      const apiUrl = `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodeURIComponent(
        url
      )}`;

      let { data } = await axios.get(apiUrl);

      if (!data || !data.result) {
        return message.reply("⚠️ *Imeshindikana kuchakata link hiyo.*");
      }

      await client.sendMessage(
        message.from,
        {
          video: { url: data.result.url },
          caption: `Downloaded ✔️\nAll-Downloader`
        },
        { quoted: message }
      );
    } catch (err) {
      console.log(err);
      return message.reply("❌ *Kuna kosa limejitokeza.*");
    }
  }
);
