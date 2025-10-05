const { zokou } = require("../framework/zokou");
const axios = require("axios").default;

zokou({
  nomCom: "pair",
  aliases: ["session", "pair", "paircode", "qrcode"],
  reaction: "👍🏻",
  categorie: "General",
}, async (dest, origine, m) => {
  const { repondre, arg } = m;

  try {
    if (!arg || arg.length === 0) {
      return repondre(
        "⚠️ *Please provide a number in the format:* `25578xxxxxxx`",
        { 
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363401025139680@newsletter",
              newsletterName: "DML-PLAY",
              serverMessageId: 143,
            },
          }
        }
      );
    }

    await repondre(
      "🕓 *Please wait... DML-XMD is generating your Pair Code.*",
      {
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363401025139680@newsletter",
            newsletterName: "DML-PLAY",
            serverMessageId: 143,
          },
        }
      }
    );

    const encodedNumber = encodeURIComponent(arg.join(" "));
    const apiUrl = `https://zokou-session.onrender.com/code?number=${encodedNumber}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data?.code) {
      await repondre(
        `✅ *Your Pair Code is ready!*\n\n🔗 \`\`\`${data.code}\`\`\`\n\n📲 *Copy the above code and link your WhatsApp using Linked Devices section.*`,
        {
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363401025139680@newsletter",
              newsletterName: "DML-PLAY",
              serverMessageId: 143,
            },
          },
        }
      );
    } else {
      throw new Error("Invalid response from API — no code found.");
    }

  } catch (error) {
    console.error("Pair Code Error:", error.message);
    await repondre(
      "❌ *Error:* Could not get response from the pairing service.\n\nPlease try again later.",
      {
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363401025139680@newsletter",
            newsletterName: "DML-PLAY",
            serverMessageId: 143,
          },
        },
      }
    );
  }
});
