const { zokou } = require('../framework/zokou');
const axios = require('axios');
const fs = require('fs-extra');

const conf = require(__dirname + "/../config");
const ffmpeg = require("fluent-ffmpeg");
const gis = require('g-i-s');
const ytSearch = require("yt-search");

// Helper function to extract response from various API formats
function extractResponse(data) {
    const possibleFields = [
        'download_url', 'alternativeUrl', 'url', 'HD', 'hd',
        'withoutwatermark', 'result', 'response', 'BK9', 'message',
        'data', 'video', 'audio'
    ];
    for (const field of possibleFields) {
        if (data[field]) {
            if (typeof data[field] === 'object') {
                return extractResponse(data[field]);
            }
            return data[field];
        }
    }
    return data;
}

zokou({
    nomCom: "download",
    aliases: ["dl", "Twitter", "tiktok", "Instagram", "YouTube", "Facebook", "Pinterest", "Likee", "Mediafire"],
    desc: "Download content from various platforms",
    categorie: "Download"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, arg } = commandeOptions;
    const url = arg.join(' ');

    if (!url) return repondre('Please provide a valid URL');

    try {
        let apiUrl;

        if (url.includes('twitter.com') || url.includes('x.com')) {
            apiUrl = `https://api.bk9.dev/download/twitter?url=${encodeURIComponent(url)}`;
        } else if (url.includes('tiktok.com')) {
            apiUrl = `https://api.bk9.dev/download/tiktok?url=${encodeURIComponent(url)}`;
        } else if (url.includes('instagram.com')) {
            apiUrl = `https://api.bk9.dev/download/instagram?url=${encodeURIComponent(url)}`;
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            apiUrl = `https://api.bk9.dev/download/youtube?url=${encodeURIComponent(url)}`;
        } else if (url.includes('facebook.com')) {
            apiUrl = `https://api.bk9.dev/download/fb?url=${encodeURIComponent(url)}`;
        } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
            apiUrl = `https://api.bk9.dev/download/pinterest?url=${encodeURIComponent(url)}`;
        } else if (url.includes('likee.video')) {
            apiUrl = `https://api.bk9.dev/download/likee?url=${encodeURIComponent(url)}`;
        } else if (url.includes('mediafire.com')) {
            apiUrl = `https://api.bk9.dev/download/mediafire?url=${encodeURIComponent(url)}`;
        } else {
            return repondre('Unsupported platform.');
        }

        const response = await axios.get(apiUrl, {
            timeout: 15000,
            validateStatus: (status) => status < 500
        });

        const responseData = response.data || {};
        const downloadUrl = extractResponse(responseData);

        if (!downloadUrl) {
            return repondre('No downloadable content found in the response');
        }

        const isVideo = downloadUrl.includes('.mp4') || downloadUrl.includes('.mov');
        const isAudio = downloadUrl.includes('.mp3') || downloadUrl.includes('.m4a');
        const isImage = downloadUrl.includes('.jpg') || downloadUrl.includes('.png') || downloadUrl.includes('.webp');

        if (isVideo) {
            await zk.sendMessage(dest, {
                video: { url: downloadUrl },
                caption: 'Downloaded by BWM XMD',
                gifPlayback: false
            }, { quoted: ms });

        } else if (isAudio) {
            await zk.sendMessage(dest, {
                audio: { url: downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: 'downloaded_audio.mp3'
            }, { quoted: ms });

        } else if (isImage) {
            await zk.sendMessage(dest, {
                image: { url: downloadUrl },
                caption: 'Downloaded by BWM XMD'
            }, { quoted: ms });

        } else {
            await zk.sendMessage(dest, {
                document: { url: downloadUrl },
                fileName: 'downloaded_file'
            }, { quoted: ms });
        }

    } catch (error) {
        console.error('Download error:', error);
        let errorMessage = 'Failed to download content';

        if (error.response) {
            if (error.response.status === 400) errorMessage = 'Invalid URL or request format';
            else if (error.response.status === 404) errorMessage = 'Content not found';
            else if (error.response.data?.message) errorMessage = error.response.data.message;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Try again.';
        }

        repondre(`❌ ${errorMessage}`);
    }
});

function extractField(data, field) {
    if (data[field]) return data[field];
    if (typeof data === 'object') {
        for (const key in data) {
            if (typeof data[key] === 'object') {
                const res = extractField(data[key], field);
                if (res) return res;
            }
        }
    }
    return null;
}

zokou({
    nomCom: "ytmp3",
    aliases: ["ytaudio"],
    desc: "Download YouTube audio as MP3",
    categorie: "Download"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, arg } = commandeOptions;
    const url = arg.join(' ');

    if (!url) return repondre('Please provide a YouTube URL');

    try {
        const response = await axios.get(`https://api.bk9.dev/download/ytmp3?url=${encodeURIComponent(url)}&type=mp3`);
        const audioUrl = extractField(response.data, 'downloadUrl') ||
                         extractField(response.data, 'url') ||
                         extractField(response.data, 'audio');

        if (!audioUrl) throw new Error('No audio URL found');

        await zk.sendMessage(dest, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'youtube_audio.mp3',
            caption: 'YouTube audio downloaded by DML XMD'
        }, { quoted: ms });

    } catch (error) {
        console.error('YouTube MP3 error:', error);
        repondre('❌ Failed to download YouTube audio. Check URL and try again.');
    }
});

zokou({
    nomCom: "ringtone",
    aliases: ["rtone"],
    desc: "Download ringtones",
    categorie: "Download"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, arg } = commandeOptions;
    const query = arg.join(' ');

    if (!query) return repondre('Please provide a search term');

    try {
        const response = await axios.get(`https://api.bk9.dev/download/RingTone?q=${encodeURIComponent(query)}`);
        const audioUrl = extractField(response.data, 'audio') ||
                         extractField(response.data, 'url') ||
                         extractField(response.data, 'download_url');

        if (!audioUrl) throw new Error('No audio URL found');

        await zk.sendMessage(dest, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'ringtone.mp3',
            caption: 'Ringtone downloaded by DML XMD'
        }, { quoted: ms });

    } catch (error) {
        console.error('Ringtone error:', error);
        repondre('❌ Failed to download ringtone.');
    }
});

// APK Downloader
zokou({
    nomCom: "apk",
    aliases: ["apkdl"],
    desc: "Download APK files",
    categorie: "Download"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, arg } = commandeOptions;
    const packageName = arg.join(' ');

    if (!packageName) return repondre('Please provide an app package name');

    try {
        const response = await axios.get(
            `https://api.bk9.dev/download/apk?id=${encodeURIComponent(packageName)}`,
            { timeout: 20000 }
        );

        const data = response.data || {};
        const apkUrl = extractResponse(data);
        const appName = data.name || 'app';

        if (!apkUrl) return repondre('APK not found for the specified package');

        await zk.sendMessage(dest, {
            document: { url: apkUrl },
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${appName}.apk`,
            caption: `${appName} APK`
        }, { quoted: ms });

    } catch (error) {
        console.error('APK error:', error);
        repondre('❌ Failed to download APK. Check package name.');
    }
});

// IMAGE SEARCHER
zokou({
    nomCom: "img",
    categorie: "Download",
    reaction: "🌎"
}, async (dest, zk, commandeOptions) => {
    const { repondre, ms, arg } = commandeOptions;

    if (!arg[0]) return repondre("Which image? Provide a search term!");

    const searchTerm = arg.join(" ");
    repondre(`DML XMD Searching images for: "${searchTerm}"`);

    try {
        gis(searchTerm, async (err, results) => {
            if (err) {
                console.error(err);
                return repondre("Error searching images.");
            }

            if (!results?.length) {
                return repondre("No images found.");
            }

            const images = results.slice(0, 10);

            for (const img of images) {
                try {
                    await zk.sendMessage(
                        dest,
                        { image: { url: img.url }, caption: `Result: ${searchTerm}` },
                        { quoted: ms }
                    );
                } catch (e) {
                    console.error("Send error:", e);
                }
            }
        });

    } catch (e) {
        console.error(e);
        repondre("Unexpected error. Try again.");
    }
});
