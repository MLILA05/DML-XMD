const { zokou } = require("../framework/zokou");

// Temporary pin storage per group/inbox
const pinsDB = new Map();

zokou({
  nomCom: "pin",
  categorie: "General",
  reaction: "📌",
  desc: "Pin messages or texts in groups and inbox"
}, async (dest, zk, commandeOptions) => {
  const { repondre, arg, msgRepondu, nomAuteurMessage } = commandeOptions;
  const chatId = dest;
  const args = arg || [];

  // Create storage entry if not exists
  if (!pinsDB.has(chatId)) pinsDB.set(chatId, []);

  try {
    // ==============================
    // LIST ALL PINS
    // ==============================
    if (args[0] === "list" || args[0] === "pins") {
      const pins = pinsDB.get(chatId);
      if (!pins.length) return repondre("📌 Hakuna pin kwenye chat hii.");
      
      let text = "📌 *Pinned Messages:*\n\n";
      for (const p of pins) {
        text += `ID: ${p.id}\nBy: ${p.by}\nPreview: ${p.preview}\n\n`;
      }
      return repondre(text);
    }

    // ==============================
    // UNPIN
    // ==============================
    if (args[0] === "unpin") {
      const pins = pinsDB.get(chatId);
      if (!pins.length) return repondre("⚠️ Hakuna pins za kuondoa.");

      // Unpin via reply
      if (msgRepondu) {
        const msgId = msgRepondu.key?.id;
        const index = pins.findIndex(p => p.msgId === msgId);
        if (index !== -1) {
          pins.splice(index, 1);
          return repondre("🗑️ Pin imeondolewa!");
        }
        return repondre("⚠️ Hakuna pin kwa message hiyo.");
      }

      // Unpin via ID
      if (args[1]) {
        const idArg = args[1];
        const index = pins.findIndex(p => p.id === idArg);
        if (index !== -1) {
          pins.splice(index, 1);
          return repondre(`🗑️ Pin ${idArg} imeondolewa!`);
        }
        return repondre("⚠️ Pin ID haipo.");
      }

      return repondre("🧭 Tumia `!pin list` kuona IDs au reply message kisha andika `!unpin`.");
    }

    // ==============================
    // PIN BY REPLY (auto-pin)
    // ==============================
    if (msgRepondu) {
      const msgBody =
        msgRepondu.message?.conversation ||
        msgRepondu.message?.extendedTextMessage?.text ||
        msgRepondu.message?.imageMessage?.caption ||
        msgRepondu.message?.videoMessage?.caption ||
        "[non-text message]";

      const pin = {
        id: Date.now().toString(36).slice(-6),
        by: nomAuteurMessage,
        preview: msgBody.slice(0, 200),
        msgId: msgRepondu.key?.id,
        time: Date.now(),
      };

      pinsDB.get(chatId).push(pin);
      return repondre(`✅ Message imewekwa pin.\nID: ${pin.id}\nPreview: ${pin.preview}`);
    }

    // ==============================
    // PIN TEXT (if not reply)
    // ==============================
    if (args.length > 0) {
      const text = args.join(" ");
      const pin = {
        id: Date.now().toString(36).slice(-6),
        by: nomAuteurMessage,
        preview: text.slice(0, 200),
        msgId: null,
        time: Date.now(),
      };
      pinsDB.get(chatId).push(pin);
      return repondre(`✅ Text imewekwa pin.\nID: ${pin.id}`);
    }

    // ==============================
    // HELP MESSAGE
    // ==============================
    return repondre(
      `📌 *PIN COMMANDS:*\n\n` +
      `• *${s.PREFIXE}pin* (reply) - weka pin kwa message\n` +
      `• *${s.PREFIXE}pin <text>* - weka pin ya maandishi\n` +
      `• *${s.PREFIXE}unpin* (reply/id) - ondoa pin\n` +
      `• *${s.PREFIXE}pin list* - onyesha pins zote`
    );

  } catch (err) {
    console.error("Pin Command Error:", err);
    repondre("❌ Hitilafu imetokea wakati wa ku-pin.");
  }
});

module.exports.pinHandler = async () => {
  // reserved for future enhancements
};
