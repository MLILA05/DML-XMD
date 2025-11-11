const { zokou } = require("../framework/zokou");
const { runtime } = require("../bdd/functions");
const config = require("../set"); // using same naming pattern as your other Zokou files

zokou(
  {
    nomCom: "uptime1",
    categorie: "main",
    reaction: "⏱️",
  },
  async (dest, zk, commandeOptions) => {
    const { ms, repondre, auteurMessage } = commandeOptions;

    try {
      const uptime = runtime(process.uptime());
      const startTime = new Date(Date.now() - process.uptime() * 1000);

      // Style 1: Classic Box
      const style1 = `╭───『 UPTIME 』───⳹
│
│ ⏱️ ${uptime}
│
│ 🚀 Started: ${startTime.toLocaleString()}
│
╰────────────────⳹
${config.DESCRIPTION}`;

      // Style 2: Minimalist
      const style2 = `•——[ UPTIME ]——•
  │
  ├─ ⏳ ${uptime}
  ├─ 🕒 Since: ${startTime.toLocaleTimeString()}
  │
  •——[ ${config.BOT_NAME} ]——•`;

      // Style 3: Fancy Borders
      const style3 = `▄▀▄▀▄ BOT UPTIME ▄▀▄▀▄

  ♢ Running: ${uptime}
  ♢ Since: ${startTime.toLocaleDateString()}
  
  ${config.DESCRIPTION}`;

      // Style 4: Code Style
      const style4 = `┌──────────────────────┐
│  ⚡ UPTIME STATUS ⚡  │
├──────────────────────┤
│ • Time: ${uptime}
│ • Started: ${startTime.toLocaleString()}
│ • Version: 4.0.0
└──────────────────────┘`;

      // Style 5: Modern Blocks
      const style5 = `▰▰▰▰▰ UPTIME ▰▰▰▰▰

  ⏳ ${uptime}
  🕰️ ${startTime.toLocaleString()}
  
  ${config.DESCRIPTION}`;

      // Style 6: Retro Terminal
      const style6 = `╔══════════════════════╗
║   ${config.BOT_NAME} UPTIME    ║
╠══════════════════════╣
║ > RUNTIME: ${uptime}
║ > SINCE: ${startTime.toLocaleString()}
╚══════════════════════╝`;

      // Style 7: Elegant
      const style7 = `┌───────────────┐
│  ⏱️  UPTIME  │
└───────────────┘
│
│ ${uptime}
│
│ Since ${startTime.toLocaleDateString()}
│
┌───────────────┐
│  ${config.BOT_NAME}  │
└───────────────┘`;

      // Style 8: Social Media Style
      const style8 = `⏱️ *Uptime Report* ⏱️

🟢 Online for: ${uptime}
📅 Since: ${startTime.toLocaleString()}

${config.DESCRIPTION}`;

      // Style 9: Fancy List
      const style9 = `╔♫═⏱️═♫══════════╗
   ${config.BOT_NAME} UPTIME
╚♫═⏱️═♫══════════╝

•・゜゜・* ✧  *・゜゜・•
 ✧ ${uptime}
 ✧ Since ${startTime.toLocaleDateString()}
•・゜゜・* ✧  *・゜゜・•`;

      // Style 10: Professional
      const style10 = `┏━━━━━━━━━━━━━━━━━━┓
┃  UPTIME ANALYSIS  ┃
┗━━━━━━━━━━━━━━━━━━┛

◈ Duration: ${uptime}
◈ Start Time: ${startTime.toLocaleString()}
◈ Stability: 100%
◈ Version:  4.0.0

${config.DESCRIPTION}`;

      // Random style picker
      const styles = [
        style1,
        style2,
        style3,
        style4,
        style5,
        style6,
        style7,
        style8,
        style9,
        style10,
      ];
      const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

      // Send uptime message
      await zk.sendMessage(
        dest,
        {
          text: selectedStyle,
          contextInfo: {
            mentionedJid: [auteurMessage],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363403958418756@newsletter",
              newsletterName: config.OWNER_NAME || "DML-XMD",
              serverMessageId: 143,
            },
          },
        },
        { quoted: ms }
      );
    } catch (e) {
      console.error("Uptime Error:", e);
      repondre(`❌ Error: ${e.message}`);
    }
  }
);=lllLL
