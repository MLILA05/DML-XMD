const { zokou } = require("../framework/zokou");

const pinnedMemory = new Map();

zokou({
  nomCom: "pin",
  categorie: "General",
  reaction: "📌",
  desc: "Pin a message and jump back to it"
}, async (dest, zk, { repondre, ms }) => {
  try {
    const quoted = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedMsgId = ms.message.extendedTextMessage?.contextInfo?.stanzaId;
    const sender = ms.message.extendedTextMessage?.contextInfo?.participant;

    if (quoted) {
      // Hifadhi pinned message
      pinnedMemory.set(dest, {
        id: quotedMsgId,
        sender,
        time: new Date().toLocaleString()
      });

      await zk.sendMessage(dest, {
        text: `📌 *Message Pinned!*\n👤 From: @${sender.split("@")[0]}\n🕒 ${new Date().toLocaleTimeString()}`,
        mentions: [sender]
      });

    } else {
      // Kama hakuna message mpya, toa pinned
      const pinned = pinnedMemory.get(dest);
      if (!pinned) return repondre("📭 Hakuna pinned message kwa sasa.");

      // Re-quote pinned message
      await zk.sendMessage(dest, {
        text: "📍 *Jump to pinned message* 👇",
        quoted: { key: { remoteJid: dest, id: pinned.id } }
      });
    }
  } catch (err) {
    console.error("Pin Error:", err);
    repondre("❌ Error while processing pin command.");
  }
});
