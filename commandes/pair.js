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
    const { repondre, arg, sender, zokouBot } = msg;

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
        const pairCode = data.code;

        const messageText = `
╭━━━━━━━━━━━━━━━━━━━━━━━◆
│ ✅ *Your Pair Code is Ready!*
├━━━━━━━━━━━━━━━━━━━━━━━◆
│ 🔗 \`\`\`${pairCode}\`\`\`
│
│ 📲 *Copy the above code and link your WhatsApp using Linked Devices.*
╰━━━━━━━━━━━━━━━━━━━━━━━◆
`;

        const buttons = [
          {
            buttonId: `copy_${pairCode}`,
            buttonText: { displayText: "📋 COPY CODE" },
            type: 1,
          },
          {
            buttonId: `view_channel`,
            buttonText: { displayText: "📺 VIEW CHANNEL" },
            type: 1,
          },
        ];

        const buttonMessage = {
          text: messageText,
          footer: "© 2025 DML-XMD | Power of Innovation ⚡",
          buttons,
          headerType: 1,
          contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363401025139680@newsletter",
              newsletterName: "DML-PLAY",
              serverMessageId: 143,
            },
          },
        };

        await zokouBot.sendMessage(dest, buttonMessage);
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
