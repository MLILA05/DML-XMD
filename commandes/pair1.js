const axios = require("axios");
const { zokou } = require("../framework/zokou");

module.exports = zokou(
  {
    nomCom: "pair1",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "🔔",
    categorie: "General",
  },
  async (dest, origine, msg) => {
    const { repondre } = msg;

    try {
      // Request Pairing Code from your API
      const response = await axios.get(
        "https://dml-new-session-efk0.onrender.com/code"
      );

      if (!response.data || !response.data.code) {
        return repondre("❌ Failed to generate a pairing code. Try again later.");
      }

      const generatedCode = response.data.code.trim();

      // Send Interactive Message with Copy Button
      await msg.client.sendMessage(
        msg.chat,
        {
          interactiveMessage: {
            header: "Your Pairing Code is Ready ✅",
            title: `🔑 Pairing Code:\n\n${generatedCode}`,
            footer: "> Dml",
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "Copy Code",
                  id: `copy_${Date.now()}`,
                  copy_code: generatedCode, // COPIES EXACT CODE
                }),
              },
            ],
          },
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("Pair Code Error:", err);
      repondre("⚠️ Error generating pairing code. Please try again.");
    }
  }
);
