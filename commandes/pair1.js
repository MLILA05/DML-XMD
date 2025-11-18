const { zokou } = require("../framework/zokou");
const axios = require("axios");

// Add input validation
function validatePhoneNumber(number) {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(number.replace(/\s+/g, ''));
}

// Add rate limiting
const userRequests = new Map();
const RATE_LIMIT_TIME = 30000; // 30 seconds

function isRateLimited(userId) {
  const now = Date.now();
  const lastRequest = userRequests.get(userId);
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_TIME) {
    return true;
  }
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
      // Rate limiting check
      if (isRateLimited(userId)) {
        return repondre("⏳ Please wait 30 seconds before making another request.");
      }

      if (!arg || arg.length === 0) {
        return repondre("⚠️ *Please provide a number in the format:* `25578xxxxxxx`");
      }

      const number = arg.join(" ").replace(/\s+/g, '');
      
      // Validate phone number format
      if (!validatePhoneNumber(number)) {
        return repondre("❌ *Invalid number format.* Please use: `25578xxxxxxx` (10-15 digits)");
      }

      await repondre("🕓 *Please wait... Generating your Pair Code...*");

      const encodedNumber = encodeURIComponent(number);
      const apiUrl = `https://dml-new-session-efk0.onrender.com/code?number=${encodedNumber}`;
      
      // Add timeout to axios request
      const response = await axios.get(apiUrl, { timeout: 30000 });
      const data = response.data;

      if (!data?.code) {
        return repondre("❌ *Error:* No code received from API. Please try again later.");
      }

      const pairCode = data.code;

      const messageText = `
╔═══════════════════╗
🎯 *PAIR CODE READY!* 🎯
╚═══════════════════╝

📱 *Number:* ${number}
🔗 *Pair Code:* 
${pairCode}

⏰ *Code expires in 20 seconds*

📲 Click the button below to copy your code.
`;

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

    } catch (error) {
      console.error("Pair code error:", error);
      
      if (error.code === 'ECONNABORTED') {
        return repondre("❌ Request timeout. Please try again later.");
      } else if (error.response?.status === 429) {
        return repondre("❌ Too many requests. Please wait a moment.");
      } else {
        repondre("❌ Failed to generate Pair Code. The service might be temporarily unavailable.");
      }
    }
  }
);

// ===========================
// BUTTON HANDLER - FIXED
// ===========================
zokou.buttonHandler = async (zk, m) => {
  const btn = m?.message?.buttonsResponseMessage;
  if (!btn) return;

  const buttonId = btn.selectedButtonId;

  if (buttonId.startsWith("copy_code_")) {
    const code = buttonId.replace("copy_code_", "");
    
    // Send the exact same code that was shown originally
    await zk.sendMessage(m.key.remoteJid, {
      text: `📋 *Your Pair Code:*\n\n${code}\n\n*Long press the code above to copy it*`
    });
  }
};

// Register button listener
zokou.onMessage(async (zk, msg) => {
  await zokou.buttonHandler(zk, msg);
});
