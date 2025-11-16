const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const { zokou } = require(__dirname + "/../framework/zokou");
const { format } = require(__dirname + "/../framework/mesfonctions");
const os = require("os");
const moment = require("moment-timezone");
const s = require(__dirname + "/../set");

zokou({ nomCom: "menu", categorie: "General" }, async (dest, zk, commandeOptions) => {
    let { ms, repondre, prefixe, nomAuteurMessage } = commandeOptions;
    let { cm } = require(__dirname + "/../framework/zokou");

    var coms = {};
    var mode = (s.MODE.toLowerCase() === "yes") ? "public" : "private";

    // Read images randomly
    const scsFolder = path.join(__dirname, "../Dml");
    const images = fs.readdirSync(scsFolder).filter(f => /^menu\d+\.jpg$/i.test(f));
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const imagePath = path.join(scsFolder, randomImage);

    // Read more
    const more = String.fromCharCode(8206);
    const readMore = more.repeat(4001);

    // Group commands by category
    cm.map((com) => {
        if (!coms[com.categorie]) coms[com.categorie] = [];
        coms[com.categorie].push(com.nomCom);
    });

    // Time formatting
    moment.tz.setDefault("Africa/Nairobi");
    const temps = moment().format('HH:mm:ss');
    const date = moment().format('DD/MM/YYYY');

    // PROFESSIONAL MENU HEADER
    let infoMsg = `
╭━━━〔 *DML-XMD SYSTEM PANEL* 〕━━━╮
│ 👋 Hello *${nomAuteurMessage}*!
│──────────────────────────
│ 🚀 *BOT NAME:* DML-XMD
│ 💻 *Platform:* ${os.platform()}
│ 🔧 *Mode:* ${mode}
│ 🔣 *Prefix:* ${prefixe}
│ 🕒 *Time:* ${temps}
│ 📅 *Date:* ${date}
│──────────────────────────
│ 🔗 *Official WhatsApp Channel*
│ https://whatsapp.com/channel/0029VbBf4Y52kNFkFCx2pF1H
╰━━━━━━━━━━━━━━━━━━━━━━╯

${readMore}
📁 *AVAILABLE COMMAND CATEGORIES*
━━━━━━━━━━━━━━━━━━━━
`;

    // PROFESSIONAL CATEGORY MENU
    let menuMsg = "";

    for (const cat in coms) {
        menuMsg += `
╭──〔 *${cat.toUpperCase()} COMMANDS* 〕──╮\n`;

        for (const cmd of coms[cat]) {
            menuMsg += `│ 🔹 ${cmd}\n`;
        }

        menuMsg += `╰─────────────────────╯\n`;
    }

    menuMsg += `
━━━━━━━━━━━━━━━━━━━━
🛡 *DML-XMD — Developed by Daudy*
━━━━━━━━━━━━━━━━━━━━
`;

    try {
        await zk.sendMessage(dest, {
            image: { url: imagePath },
            caption: infoMsg + menuMsg,
            footer: "© DML-XMD"
        }, { quoted: ms });

    } catch (e) {
        console.log("🥵 Menu error: " + e);
        repondre("🥵 Menu error: " + e);
    }
});
