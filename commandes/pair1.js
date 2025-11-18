const { zokou } = require("../framework/zokou");
const axios = require("axios");

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

      const messageText = `
╔═══════════════════╗
🎯 *PAIR CODE READY!* 🎯
╚═══════════════════╝

🔗 \`\`\`${pairCode}\`\`\`

📲 Click the button below to copy your code.
`;

      // Button now carries the actual code in its ID
      const buttons = [
        {
          buttonId: `copy_code_${pairCode}`,
          buttonText: { displayText: "📋 COPY CODE" },
          type: 1,
        },
      ];

      await zk.sendMessage(dest, {
        text: messageText,
        buttons,
        headerType: 1,
      });

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

  const buttonId = btn.selectedButtonId;

  if (buttonId.startsWith("copy_code_")) {
    const code = buttonId.replace("copy_code_", ""); // get the exact code from the button
    await zk.sendMessage(m.key.remoteJid, {
      text: `📋 *Your Pair Code:*\n\`\`\`${code}\`\`\`\n\nCopied successfully!`
    });
  }
};

// Register button listener
zokou.onMessage(async (zk, msg) => {
  await zokou.buttonHandler(zk, msg);
});
