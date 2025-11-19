const { zokou } = require("../framework/zokou");
const axios = require("axios");

// Validate phone number
function validatePhoneNumber(number) {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(number.replace(/\s+/g, ""));
}

// Rate limit setup
const userRequests = new Map();
const RATE_LIMIT_TIME = 30000; // 30 seconds

function isRateLimited(userId) {
  const now = Date.now();
  const lastRequest = userRequests.get(userId);
  if (lastRequest && now - lastRequest < RATE_LIMIT_TIME) return true;
  userRequests.set(userId, now);
  return false;
}

zokou(
  {
    nomCom: "pair1",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "🔔",
    categorie: "General",
  },
  async (dest, zk, msg) => {
    const { repondre, arg, auteur } = msg;
    const userId = auteur || dest;

    try {
      if (isRateLimited(userId)) {
        return repondre("⏳ Please wait 30 seconds before making another request.");
      }

      if (!arg || arg.length === 0) {
        return repondre("⚠️ Please provide number: `25578xxxxxxx`");
      }

      const number = arg.join(" ").replace(/\s+/g, "");

      if (!validatePhoneNumber(number)) {
        return repondre("❌ Invalid number. Use: `25578xxxxxxx` (10–15 digits)");
      }

      await repondre("🕓 Please wait... generating Pair Code...");

      const apiUrl = `https://dml-new-session-efk0.onrender.com/code?number=${encodeURIComponent(number)}`;

      const response = await axios.get(apiUrl, { timeout: 30000 });
      const data = response.data;

      if (!data?.code) {
        return repondre("❌ No code received from API. Try again later.");
      }

      const pairCode = data.code;

      const messageText = `
🎯 *PAIR CODE READY!*

📱 Number: ${number}
🔗 Pair Code: ${pairCode}

⏰ Expires in 20 seconds.
Click below to copy.
`;

      await zk.sendMessage(dest, {
        text: messageText,
        buttons: [
          {
            buttonId: `pairCode_${pairCode}`,
            buttonText: { displayText: "📋 COPY CODE" },
            type: 1,
          },
        ],
        headerType: 1,
      });

    } catch (error) {
      console.log("Pair code error:", error);

      if (error.code === "ECONNABORTED") {
        return repondre("❌ Request timed out. Try again.");
      } else if (error.response?.status === 429) {
        return repondre("❌ Too many requests.");
      }

      return repondre("❌ Failed to generate Pair Code.");
    }
  }
);

// ===========================
// BUTTON HANDLER (FULL FIX)
// ===========================
zokou.onMessage(async (zk, msg) => {
  const btn = msg?.message?.buttonsResponseMessage;
  if (!btn) return;

  const buttonId = btn.selectedButtonId;

  // Handler now matches your button
  if (buttonId.startsWith("pairCode_")) {
    const code = buttonId.replace("pairCode_", "");

    await zk.sendMessage(msg.key.remoteJid, {
      text: `📋 *Your Pair Code:*\n\n${code}\n\nLong-press to copy.`,
    });
  }
});
