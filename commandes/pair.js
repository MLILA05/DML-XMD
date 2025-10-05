const { zokou } = require("../framework/zokou");
const { default: axios } = require("axios");

zokou(
  {
    nomCom: "pair",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "👍🏻",
    categorie: "General",
  },
  async (dest, origine, msg) => {
    const { repondre, arg, sender } = msg;

    try {
      if (!arg || arg.length === 0) {
        return repondre("⚠️ *Please provide a number in the format:* `25578xxxxxxx`");
      }

      await repondre("🕓 *Please wait... DML-XMD is generating your Pair Code.*");

      const encodedNumber = encodeURIComponent(arg.join(" "));
      const apiUrl = `https://zokou-session.onrender.com/code?number=${encodedNumber}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data?.code) {
        await repondre(
          `
╭━━━🎯 *PAIR CODE GENERATED* 🎯━━━╮
┃ ✅ *Your Pair Code is ready!*
┃
┃ 🔐 *Code:* \`\`\`${data.code}\`\`\`
┃
┃ 📋 Tap below to *Copy Code* ⤵
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,
          {
            contextInfo: {
              mentionedJid: [sender],
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401025139680@newsletter",
                newsletterName: "DML-PLAY",
                serverMessageId: 143,
              },
              externalAdReply: {
                title: "Copy Pair Code 🔑",
                body: "Click to copy and use in Linked Devices",
                sourceUrl: "https://zokou-session.onrender.com/",
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnailUrl: "https://i.imgur.com/ON0HxGs.jpeg", // You can replace this with your DML logo
              },
            },
          }
        );
      } else {
        throw new Error("Invalid response from API — no code found.");
      }
    } catch (error) {
      console.error("Error getting API response:", error.message);
      repondre(
        `
╭━━━❌ *ERROR RESPONSE* ❌━━━╮
┃ ⚠️ Could not get response from  
┃ the pairing service.
┃
┃ 🔁 Please try again later.
╰━━━━━━━━━━━━━━━━━━━━━━╯
`
      );
    }
  }
);
