const { zokou } = require("../framework/zokou");
const { getBuffer } = require("../framework/dl/Function");
const speed = require("performance-now");
const config = require("../set");

// Runtime formatter
const runtime = function (seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / 86400);
  var h = Math.floor(seconds % 86400 / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " d, ") : '';
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " h, ") : '';
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " m, ") : '';
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " s") : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

// =========================
// ⚡ Ping Command
// =========================
zokou({
  nomCom: "ping",
  desc: "To check ping",
  Categorie: "General",
  reaction: "⏳",
  fromMe: "true"
}, async (dest, zk, ctx) => {
  let timestamp = speed();
  let flashspeed = (speed() - timestamp).toFixed(4);
  const { repondre } = ctx;
  await repondre("*Pong ▱▱▰▰▰ :" + flashspeed + " MS*");
});

// =========================
// 🌍 Uptime Command
// =========================
zokou({
  nomCom: "uptime",
  desc: "To check runtime",
  Categorie: "General",
  reaction: "🌍",
  fromMe: "true"
}, async (dest, zk, ctx) => {
  const { ms, repondre } = ctx;
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
${config.DESCRIPTION || "DML-XMD Bot"}`;

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

  ${config.DESCRIPTION || "dml-tech.online"}`;

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
${config.DESCRIPTION || "We Are Unstoppable"}`;

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

${config.DESCRIPTION || "Watu ni Mtaji Tosha"}`;

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
${config.DESCRIPTION || "Enjoy Using DML-XMD"}`;

  const styles = [style1, style2, style3, style4, style5, style6, style7, style8, style9, style10];
  const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

  await zk.sendMessage(dest, {
    text: selectedStyle,
    contextInfo: {
      mentionedJid: [ctx.auteurMessage],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363403958418756@newsletter",
        newsletterName: config.OWNER_NAME || "DML-MD",
        serverMessageId: 143
      }
    }
  }, { quoted: ms });
});

// =========================
// 🎥 Screenshot Command
// =========================
zokou({
  nomCom: "ss",
  desc: "screenshots website",
  Categorie: "General",
  reaction: "🎥",
  fromMe: "true"
}, async (dest, zk, ctx) => {
  const { ms, arg, repondre } = ctx;
  if (!arg || arg.length === 0) {
    return repondre("Provide a link...");
  }
  const url = arg.join(" ");
  const apiUrl = `https://api.maher-zubair.adams/misc/sstab?url=${url}&dimension=720x720`;
  const buffer = await getBuffer(apiUrl);
  await zk.sendMessage(dest, { image: buffer }, { caption: "*Powered by DML-XMD*" }, { quoted: ms });
});
