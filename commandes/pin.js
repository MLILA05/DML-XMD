const { zokou } = require("../framework/zokou");

const pinnedMemory = new Map();

zokou({
  nomCom: "pin",
  categorie: "General",
  reaction: "📌",
  desc: "Pin a message and jump back to it\nUse: *pin* while quoting a message to pin, or *pin* alone to view pinned message"
}, async (dest, zk, { repondre, ms, arg }) => {
  try {
    const quoted = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedMsgId = ms.message.extendedTextMessage?.contextInfo?.stanzaId;
    const sender = ms.message.extendedTextMessage?.contextInfo?.participant;

    // Check if user wants to clear pinned message
    if (arg && arg.toLowerCase() === 'clear') {
      if (pinnedMemory.has(dest)) {
        pinnedMemory.delete(dest);
        return repondre("🗑️ *Pinned message cleared!*");
      } else {
        return repondre("📭 No pinned message to clear.");
      }
    }

    if (quoted) {
      // Check if user is replying to the current pinned message
      const pinned = pinnedMemory.get(dest);
      if (pinned && quotedMsgId === pinned.id) {
        // User is replying to the pinned message - repost it at the top
        await zk.sendMessage(dest, {
          text: `📍 *Pinned Message* 📍\n👤 From: @${pinned.sender.split("@")[0]}\n🕒 ${pinned.time}\n\n📌 *Reposted by request*`,
          mentions: [pinned.sender]
        });
        
        // Also send the original quoted message as a fresh message
        await zk.sendMessage(dest, {
          forward: {
            key: {
              remoteJid: dest,
              id: pinned.id
            },
            message: quoted
          }
        });
        
        return;
      }

      // Save new pinned message
      pinnedMemory.set(dest, {
        id: quotedMsgId,
        sender,
        time: new Date().toLocaleString(),
        timestamp: Date.now(),
        message: quoted // Store the actual message content
      });

      await zk.sendMessage(dest, {
        text: `📌 *Message Pinned!*\n👤 From: @${sender.split("@")[0]}\n🕒 ${new Date().toLocaleString()}\n\nReply to this message with *pin* to bring it to the top again.`,
        mentions: [sender]
      });

    } else {
      // No quoted message - show the pinned message
      const pinned = pinnedMemory.get(dest);
      if (!pinned) {
        return repondre(`📭 No pinned message found.\n\n*How to use:*\n• Reply to a message with *pin* to pin it\n• Use *pin* alone to view pinned message\n• Use *pin clear* to remove pinned message`);
      }

      // Check if message is too old (optional: 24-hour limit)
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - pinned.timestamp > oneDay) {
        pinnedMemory.delete(dest);
        return repondre("⏰ The pinned message has expired (24 hours). Please pin a new message.");
      }

      // Repost the pinned message at the top
      await zk.sendMessage(dest, {
        text: `📍 *Pinned Message* 📍\n👤 From: @${pinned.sender.split("@")[0]}\n🕒 ${pinned.time}\n\n📌 *Brought to top by request*`,
        mentions: [pinned.sender]
      });

      // Forward the original pinned message as a fresh message
      try {
        await zk.sendMessage(dest, {
          forward: {
            key: {
              remoteJid: dest,
              id: pinned.id
            },
            message: pinned.message
          }
        });
      } catch (forwardError) {
        // If forwarding fails, send a text reference
        await zk.sendMessage(dest, {
          text: "📎 *Original pinned message reference* (message might be deleted or expired)"
        });
      }
    }
  } catch (err) {
    console.error("Pin Error:", err);
    repondre("❌ Error while processing pin command.");
  }
});

// Alternative simpler version that always reposts when command is used
zokou({
  nomCom: "pintop",
  categorie: "General", 
  reaction: "📌",
  desc: "Bring pinned message to the top"
}, async (dest, zk, { repondre }) => {
  try {
    const pinned = pinnedMemory.get(dest);
    if (!pinned) {
      return repondre("📭 No pinned message found. Use *pin* while quoting a message to pin it first.");
    }

    // Always repost the pinned message at the top
    await zk.sendMessage(dest, {
      text: `📍 *Pinned Message - Brought to Top* 📍\n👤 From: @${pinned.sender.split("@")[0]}\n🕒 ${pinned.time}`,
      mentions: [pinned.sender]
    });

    // Try to forward the original message
    try {
      await zk.sendMessage(dest, {
        forward: {
          key: {
            remoteJid: dest,
            id: pinned.id
          },
          message: pinned.message
        }
      });
    } catch (error) {
      await zk.sendMessage(dest, {
        text: "📎 [Original pinned message - content unavailable]"
      });
    }

  } catch (err) {
    console.error("PinTop Error:", err);
    repondre("❌ Error while bringing pinned message to top.");
  }
});

// Auto-cleanup for old pinned messages
setInterval(() => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (const [dest, pinned] of pinnedMemory.entries()) {
    if (now - pinned.timestamp > oneDay) {
      pinnedMemory.delete(dest);
    }
  }
}, 60 * 60 * 1000);
