const { zokou } = require("../framework/zokou");
const { default: axios } = require("axios");

zokou(
  {
    nomCom: "pair",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "🔔", // notification icon
    categorie: "General",
  },
  async (dest, origine, msg) => {
    const { repondre, arg, zokouBot, sender } = msg;

    try {
      if (!arg || arg.length === 0) {
        return repondre("⚠️ *Please provide a number in the format:* `25578xxxxxxx`", { reply: true });
      }

      // Step 1: Notification Box
      const notificationMessage = `
╔═══════════════════╗
🎯 *PAIR CODE READY!* 🎯
╚═══════════════════╝
📲 Check below for your Pair Code!
`;

      await repondre(notificationMessage, { reply: true });

      // Step 2: Fetch Pair Code
      const encodedNumber = encodeURIComponent(arg.join(" "));
      const apiUrl = `https://zokou-session.onrender.com/code?number=${encodedNumber}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data?.code) {
        const pairCode = data.code;

        // Step 3: Send code directly to inbox (no notification)
        await zokouBot.sendMessage(dest, {
          text: `🔗 *Your Pair Code:*\n\`\`\`${pairCode}\`\`\`\n\n📲 Use it to link your WhatsApp via Linked Devices.`,
        });
      } else {
        throw new Error("Invalid response from API — no code found.");
      }

    } catch (error) {
      console.error("Error getting API response:", error.message);
      repondre(
        "❌ *Error:* Could not get response from the pairing service.\n\nPlease try again later.",
        { reply: true }
      );
    }
  }
);
