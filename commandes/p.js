const { zokou } = require("../framework/zokou");
const axios = require("axios");
const ytSearch = require("yt-search");

// Shared API configurations
const apiKey = 'gifted_api_6kuv56877d';

const audioApis = [
    `https://api.giftedtech.web.id/api/download/ytdlv2?apikey=${apiKey}&url=`,
    `https://api.giftedtech.web.id/api/download/ytdl?apikey=${apiKey}&url=`,
    `https://apis.davidcyriltech.my.id/download/ytmp3?url=`,
    `https://apis.davidcyriltech.my.id/youtube/mp3?url=`
];

const videoApis = [
    `https://api.giftedtech.web.id/api/download/ytmp4?apikey=${apiKey}&url=`,
    `https://iamtkm.vercel.app/downloaders/ytmp4?url=`,
    `https://apis.davidcyriltech.my.id/download/ytmp4?url=`,
    `https://api.giftedtech.web.id/api/download/ytv?apikey=${apiKey}&url=`,
    `https://apis.davidcyriltech.my.id/youtube/mp4?url=`,
    `https://api.giftedtech.web.id/api/download/ytvideo?apikey=${apiKey}&url=`
];

// Store active download sessions
const downloadSessions = new Map();

zokou({
    nomCom: "play0",
    aliases: ["song", "video", "music", "yt"],
    categorie: "Download",
    reaction: "🎵"
}, async (dest, zk, commandOptions) => {
    const { arg, ms, repondre } = commandOptions;

    if (!arg[0]) {
        return repondre("❗ Please provide a song or video name to search.");
    }

    const query = arg.join(" ");

    try {
        // Search YouTube
        const searchResults = await ytSearch(query);
        if (!searchResults.videos.length) {
            return repondre("❌ No results found for your search.");
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;

        // Beautiful download options
        const downloadOptions = `
*🎵 DML-XMD DOWNLOAD MENU*

Choose one of the options below by replying with the number 👇

1️⃣  *Download Audio*
2️⃣  *Download Video*
3️⃣  *Join Our Channel*

_Example:_ Reply with *1* to download audio.
_This menu stays active – you can use it multiple times!_
`;

        // Send result message
        const sentMessage = await zk.sendMessage(dest, {
            image: { url: video.thumbnail },
            caption: `*${video.title}*\n\n🎬 *Channel:* ${video.author.name}\n⏱️ *Duration:* ${video.timestamp}\n👀 *Views:* ${video.views}\n\n${downloadOptions}`,
            contextInfo: {
                externalAdReply: {
                    title: video.title,
                    body: "Available on YouTube",
                    mediaType: 2,
                    thumbnailUrl: video.thumbnail,
                    mediaUrl: video.url,
                    sourceUrl: video.url
                }
            }
        }, { quoted: ms });

        // Store the session
        const sessionId = sentMessage.key.id;
        downloadSessions.set(sessionId, {
            videoUrl: videoUrl,
            videoTitle: video.title,
            videoThumbnail: video.thumbnail,
            dest: dest,
            createdAt: Date.now()
        });

        // Persistent listener
        if (!zk.downloadHandler) {
            zk.downloadHandler = async (update) => {
                const message = update.messages[0];
                if (!message?.message) return;

                const stanzaId = message.message.extendedTextMessage?.contextInfo?.stanzaId;
                if (!stanzaId || !downloadSessions.has(stanzaId)) return;

                const responseText = message.message.extendedTextMessage?.text?.trim() ||
                    message.message.conversation?.trim();

                if (!responseText) return;

                const selectedOption = parseInt(responseText);
                const userJid = message.key.participant || message.key.remoteJid;
                const session = downloadSessions.get(stanzaId);

                try {
                    switch (selectedOption) {
                        case 1:
                            // 🎧 Audio Download
                            await zk.sendMessage(session.dest, {
                                text: `🎧 *DML-XMD Audio Downloader*\n\n🔄 Please wait... downloading your requested *audio file*.\n\n⏳ _Processing your song now..._`,
                                mentions: [userJid]
                            }, { quoted: message });

                            await handleDownload('audio', session.videoUrl, session.dest, zk, message);
                            break;

                        case 2:
                            // 🎬 Video Download
                            await zk.sendMessage(session.dest, {
                                text: `🎬 *DML-XMD Video Downloader*\n\n🔄 Please wait... downloading your requested *video file*.\n\n⏳ _Processing your video now..._`,
                                mentions: [userJid]
                            }, { quoted: message });

                            await handleDownload('video', session.videoUrl, session.dest, zk, message);
                            break;

                        case 3:
                            // 📢 Channel Info
                            await zk.sendMessage(session.dest, {
                                text: `📢 *DML-XMD Official Channel*\n\nJoin our WhatsApp Channel for updates, bots & more:\n\n🔗 https://whatsapp.com/channel/0029VbBf4Y52kNFkFCx2pF1H\n\n🌐 *Website:* dml-tech.online\n\n💫 _Stay connected with the DML-XMD family!_`,
                                mentions: [userJid]
                            }, { quoted: message });
                            break;

                        default:
                            await zk.sendMessage(session.dest, {
                                text: `❌ *Invalid Option*\n\nPlease reply with one of these:\n\n1️⃣  Download Audio\n2️⃣  Download Video\n3️⃣  Join Channel\n\n_Example:_ Reply with *1* to download audio.`,
                                mentions: [userJid]
                            }, { quoted: message });
                            break;
                    }
                } catch (error) {
                    console.error("Download reply handler error:", error);
                    await zk.sendMessage(session.dest, {
                        text: "❌ Error processing your request. Please try again later.",
                        mentions: [userJid]
                    }, { quoted: message });
                }
            };

            zk.ev.on("messages.upsert", zk.downloadHandler);
        }

        // Clean up old sessions
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [id, session] of downloadSessions.entries()) {
            if (session.createdAt < oneHourAgo) downloadSessions.delete(id);
        }

    } catch (error) {
        console.error("Search error:", error);
        return repondre("⚠️ Error searching for the video. Please try again.");
    }
});

// DOWNLOAD HANDLER FUNCTION
async function handleDownload(type, videoUrl, dest, zk, originalMsg) {
    try {
        const apis = type === 'audio' ? audioApis : videoApis;
        const encodedUrl = encodeURIComponent(videoUrl);
        let downloadUrl = null;

        for (const api of apis) {
            try {
                const response = await axios.get(`${api}${encodedUrl}`);
                if (
                    response.data?.result?.download_url ||
                    response.data?.url ||
                    response.data?.audio_url ||
                    response.data?.video_url
                ) {
                    downloadUrl =
                        response.data.result?.download_url ||
                        response.data.url ||
                        response.data.audio_url ||
                        response.data.video_url;
                    break;
                }
            } catch {
                console.log(`API ${api} failed, trying next...`);
            }
        }

        if (!downloadUrl) {
            return await zk.sendMessage(dest, {
                text: `❌ Failed to download ${type}. Please try again later.`
            }, { quoted: originalMsg });
        }

        // Send the downloaded file
        if (type === 'audio') {
            const audioResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(audioResponse.data, 'binary');

            await zk.sendMessage(dest, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                contextInfo: {
                    externalAdReply: {
                        title: "Your Audio Download",
                        body: "DML-XMD Downloader",
                        mediaType: 2,
                        thumbnailUrl: "https://files.catbox.moe/42upty.jpg",
                        mediaUrl: downloadUrl,
                        sourceUrl: downloadUrl
                    }
                }
            }, { quoted: originalMsg });
        } else {
            const videoResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(videoResponse.data, 'binary');

            await zk.sendMessage(dest, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: "🎬 *Here’s your video download!*",
                contextInfo: {
                    externalAdReply: {
                        title: "Your Video Download",
                        body: "DML-XMD Downloader",
                        mediaType: 2,
                        thumbnailUrl: "https://files.catbox.moe/42upty.jpg",
                        mediaUrl: downloadUrl,
                        sourceUrl: downloadUrl
                    }
                }
            }, { quoted: originalMsg });
        }

    } catch (error) {
        console.error("Download error:", error);
        await zk.sendMessage(dest, {
            text: `❌ Error during ${type} download. Please try again later.`
        }, { quoted: originalMsg });
    }
}
