const {zokou} = require("../framework/zokou");
const fs = require('fs-extra');
const conf = require('../config');
const { default: axios } = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const gis = require('g-i-s');


zokou({
  'nomCom': 'apk1',
  'aliases': ['app', 'playstore'],
  'reaction': '🗂',
  'categorie': 'Download'
}, async (groupId, client, context) => {
  const { repondre, arg, ms } = context;

  try {
    // Check if app name is provided
    const appName = arg.join(" ");
    if (!appName) {
      return repondre("Please provide an app name.");
    }

    // Fetch app search results from the BK9 API
    const searchResponse = await axios.get(`https://api.bk9.dev/search/apk?q=${appName}`);
    const searchData = searchResponse.data;

    // Check if any results were found
    if (!searchData.BK9 || searchData.BK9.length === 0) {
      return repondre("No app found with that name, please try again.");
    }

    // Fetch the APK details for the first result
    const appDetailsResponse = await axios.get(`https://api.bk9.dev/download/apk?id=${searchData.BK9[0].id}`);
    const appDetails = appDetailsResponse.data;

    // Check if download link is available
    if (!appDetails.BK9 || !appDetails.BK9.dllink) {
      return repondre("Unable to find the download link for this app.");
    }

    // Send the APK file to the group
    await client.sendMessage(
      groupId,
      {
        document: { url: appDetails.BK9.dllink },
        fileName: `${appDetails.BK9.name}.apk`,
        mimetype: "application/vnd.android.package-archive",
        caption: "DML-XMD"
      },
      { quoted: ms }
    );

  } catch (error) {
    // Catch any errors and notify the user
    console.error("Error during APK download process:", error);
    repondre("APK download failed. Please try again later.");
  }
});


zokou(
  {
    nomCom: "img",
    categorie: "Search",
    reaction: "📷"
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, ms, arg } = commandeOptions;

    if (!arg[0]) {
      return repondre('Which image? Please provide a search term!');
    }

    const searchTerm = arg.join(" ");
    repondre(`Dml xmd searching your images: "${searchTerm}"...`);

    try {
      gis(searchTerm, async (error, results) => {
        if (error) {
          console.error("Image search error:", error);
          return repondre('Oops! An error occurred while searching for images.');
        }

        if (!results || results.length === 0) {
          return repondre('No images found for your search term.');
        }

        // Limit the number of images sent to avoid overloading the bot or WhatsApp.
        const maxImages = 10; // Adjust the limit as needed
        const imagesToSend = results.slice(0, maxImages);

        for (const image of imagesToSend) {
          try {
            await zk.sendMessage(
              dest,
              { image: { url: image.url }, caption: `Dml xmd result: "${searchTerm}"` },
              { quoted: ms }
            );
          } catch (sendError) {
            console.error("Error sending image:", sendError);
          }
        }
      });
    } catch (mainError) {
      console.error("Main error:", mainError);
      repondre('An unexpected error occurred. Please try again.');
    }
  }
);
