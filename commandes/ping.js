const { zokou } = require("../framework/zokou");
const config = require("../set");

// PING COMMAND BY DML
zokou({
  nomCom: "ping",
  alias: ["speed", "pong"],
  categorie: "General",
  reaction: "📌",
  use: ".ping",
}, async (dest, zk, commandeOptions) => {
  const { repondre, auteurMessage } = commandeOptions;

  try {
    const start = new Date().getTime();

    // Reaction + text emojis
    const reactionEmojis = ['❄️'];
    const textEmojis = ['🚀'];

    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    // React
    await zk.sendMessage(dest, {
      react: { text: textEmoji, key: commandeOptions.ms.key },
    });

    const end = new Date().getTime();
    const responseTime = (end - start) / 1000;

    const text = `╭━━〔 💥 𝗣𝗜𝗡𝗚 𝗧𝗘𝗦𝗧 〕━━╮
┃ 🤖 *BOT* : *DML-XMD*
┃ ⏳ *PING* : *${responseTime.toFixed(2)}s ${reactionEmoji}*
╰━━━━━━━━━━━━━━━━━━╯
> *POWERED BY YOU*`;

    await zk.sendMessage(dest, {
      text,
      contextInfo: {
        mentionedJid: [auteurMessage],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363387497418815@newsletter',
          newsletterName: "DML-PING",
          serverMessageId: 143,
        },
      },
    });

  } catch (e) {
    console.error("Error in ping command:", e);
    repondre(`An error occurred: ${e.message}`);
  }
});


// PING2 COMMAND
zokou({
  nomCom: "ping2",
  categorie: "main",
  reaction: "📡",
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms } = commandeOptions;

  try {
    const startTime = Date.now();
    const message = await zk.sendMessage(dest, { text: '*PINGING...⏳*' });
    const endTime = Date.now();
    const ping = endTime - startTime;

    await zk.sendMessage(dest, {
      text: `╭━━━⪨𝗦𝗣𝗘𝗘𝗗 𝗧𝗘𝗦𝗧⪩━━━╮
┃╭╼━━━━━━━━━━━┈⊷
┃┃♦ 𝗣𝗜𝗡𝗚𝟮: *${ping}MS*
┃┃♦ 𝗗𝗘𝗩: 𝗫𝗧𝗥𝗘𝗠𝗘
┃╰╼━━━━━━━━━━━┈⊷
╰╼━━━━━━━━━━━━━━━╾╯
> *POWERED BY DML*`,
      contextInfo: {
        mentionedJid: [commandeOptions.auteurMessage],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363387497418815@newsletter',
          newsletterName: config.OWNER_NAME || 'DML-MD',
          serverMessageId: 143,
        },
      },
    }, { quoted: message });

  } catch (e) {
    console.error("Error in ping2 command:", e);
    repondre(`${e.message}`);
  }
});
