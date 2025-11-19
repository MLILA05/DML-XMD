const { zokou } = require("../framework/zokou");
const axios = require("axios");

// 1. Validation Function
function validatePhoneNumber(number) {
  // Regex: starts and ends with a digit, 10 to 15 digits long
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(number.replace(/\s+/g, ""));
}

// 2. Rate Limit Setup
const userRequests = new Map();
const RATE_LIMIT_TIME = 45000; // Increased to 45 seconds to match code expiration

function isRateLimited(userId) {
  const now = Date.now();
  const lastRequest = userRequests.get(userId);
  // Check if a request was made within the RATE_LIMIT_TIME
  if (lastRequest && now - lastRequest < RATE_LIMIT_TIME) return true;
  userRequests.set(userId, now);
  return false;
}

// 3. Mapping for ButtonId -> Exact Pair Code
// This is crucial for securely hiding the code until the button is clicked.
const buttonCodeMap = new Map();

// =========================================================
// COMMAND HANDLER: pair1
// =========================================================
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
      // 1. Apply Rate Limit
      if (isRateLimited(userId)) {
        return repondre("⏳ Please wait 45 seconds before making another request.");
      }

      // 2. Check for Arguments
      if (!arg || arg.length === 0) {
        return repondre("⚠️ Please provide number: `25578xxxxxxx`");
      }

      const number = arg.join(" ").replace(/\s+/g, "");

      // 3. Validate Phone Number
      if (!validatePhoneNumber(number)) {
        return repondre("❌ Invalid number. Use: `25578xxxxxxx` (10–15 digits)");
      }

      await repondre("🕓 Please wait... generating Pair Code...");

      // 4. API Call
      const apiUrl = `https://dml-new-session-efk0.onrender.com/code?number=${encodeURIComponent(number)}`;
      const response = await axios.get(apiUrl, { timeout: 35000 }); // Increased API timeout
      const data = response.data;

      if (!data?.code) {
        return repondre("❌ No code received from API. Try again later.");
      }

      const pairCode = data.code;

      // 5. Securely Store Code and Send Button
      const uniqueButtonId = `pairCode_${userId}_${Date.now()}`;
      buttonCodeMap.set(uniqueButtonId, pairCode);

      // Send message WITHOUT showing the code — only the button
      const messageText = `
🎯 *PAIR CODE READY!*

📱 Number: ${number}

Click the button below to receive the Pair Code (code is hidden for security).
*✅ IMPORTANT: After clicking, the code will be sent to you as plain text. Long-press that message to copy it.*
`;
      await zk.sendMessage(dest, {
        text: messageText,
        buttons: [
          {
            buttonId: uniqueButtonId,
            buttonText: { displayText: "📋 COPY CODE" },
            type: 1,
          },
        ],
        headerType: 1,
      });

      // 6. Set Code Expiration
      // Code expires after 45 seconds to prevent stale session codes.
      setTimeout(() => {
        buttonCodeMap.delete(uniqueButtonId);
        console.log(`Pair code ${uniqueButtonId} expired and deleted.`);
      }, 45000); 

    } catch (error) {
      console.log("Pair code error:", error);

      if (error.code === "ECONNABORTED") {
        return repondre("❌ Request timed out. Try again.");
      } else if (error.response?.status === 429) {
        return repondre("❌ Too many requests. Wait a minute.");
      }

      return repondre("❌ Failed to generate Pair Code.");
    }
  }
);

// =========================================================
// BUTTON HANDLER: Send Raw Code
// (This is what ensures the user gets the exact, copyable code)
// =========================================================
zokou(
  { on: "message" },
  async (dest, zk, msg) => {
    try {
      const btn = msg?.message?.buttonsResponseMessage;
      if (!btn) return;

      const buttonId = btn.selectedButtonId;
      // Ensure the button ID is one we generated
      if (!buttonId || !buttonId.startsWith("pairCode_")) return;

      // 1. Retrieve the stored exact code
      const code = buttonCodeMap.get(buttonId);

      // 2. Delete mapping immediately after use to avoid reuse
      buttonCodeMap.delete(buttonId);

      if (!code) {
        // Code has expired or was already used
        return zk.sendMessage(msg.key.remoteJid, {
          text: "❌ Pair code expired or not found. Please generate again.",
        });
      }

      // 3. Send EXACT code ONLY as plain text for easy copying
      await zk.sendMessage(msg.key.remoteJid, {
        text: `${code}`,
      });
    } catch (err) {
      console.error("Button handler error:", err);
    }
  }
);
