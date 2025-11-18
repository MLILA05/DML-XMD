const { zokou } = require("../framework/zokou");
const axios = require("axios");

// Temporary store for generated codes
const generatedCodes = new Map();

zokou(
  {
    nomCom: "pair1",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "🔔",
    categorie: "General",
  },
  async (dest, zk, msg) => {
    const { repondre, arg } = msg;

    try {
      if (!arg || arg.length === 0) {
        return repondre("⚠️ *Please provide a number in the format:* `25578xxxxxxx`");
      }

      await repondre("🕓 *Please wait... Generating your Pair Code...*");

      const number = arg.join(" ");
      const encodedNumber = encodeURIComponent(number);

      const apiUrl = `https://dml-new-session-efk0.onrender.com/code?number=${encodedNumber}`;

      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data?.code) {
        return repondre("❌ *Error:* No code received from API.");
      }

      const pairCode = data.code;

      // Save this code temporarily for button action
      generatedCodes.set(dest, pairCode);

      const messageText = `
╔═══════════════════╗
🎯 *PAIR CODE READY!* 🎯
╚═══════════════════╝

🔗 \`\`\`${pairCode}\`\`\`

📲 *Click the button below to copy your code.*
`;

      const buttons = [
        {
          buttonId: `copy_code`,
          buttonText: { displayText: "📋 COPY CODE" },
          type: 1,
        },
      ];

      await zk.sendMessage(
        dest,
        {
          text: messageText,
          buttons,
          headerType: 1,
        }
      );

    } catch (e) {
      console.error(e);
      repondre("❌ Failed to generate Pair Code. Try again later.");
    }
  }
);

// ===========================
// BUTTON HANDLER
// ===========================
zokou.buttonHandler = async (zk, m) => {
  const btn = m?.message?.buttonsResponseMessage;
  if (!btn) return;

  const from = m.key.remoteJid;
  const buttonId = btn.selectedButtonId;

  // Handle "COPY CODE"
  if (buttonId === "copy_code") {
    const code = generatedCodes.get(from);

    if (!code) {
      return zk.sendMessage(from, { text: "❌ No code stored. Generate a new one using *pair1*." });
    }

    await zk.sendMessage(from, {
      text: `📋 *Your Pair Code:*\n\`\`\`${code}\`\`\`\n\nCopied successfully!`
    });
  }
};

// Register message listener
zokou.onMessage(async (zk, msg) => {
  await zokou.buttonHandler(zk, msg);
});
