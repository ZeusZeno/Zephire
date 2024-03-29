const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0.2",
    author: "zeus zeno", 
    role: 0,
    countDown: 50,
    shortDescription: {
      en: "Search for images on Pinterest"
    },
    longDescription: {
      en: ""
    },
    category: "image",
    guide: {
      en: "{prefix}pinterest <search query> -<number of images>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const userID = event.senderID;

      const keySearch = args.join(" ");
      if (!keySearch.includes("-")) {
        return api.sendMessage(`𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐭𝐡𝐞 𝐬𝐞𝐚𝐫𝐜𝐡 𝐪𝐮𝐞𝐫𝐲 𝐚𝐧𝐝 𝐧𝐮𝐦𝐛𝐞𝐫 𝐨𝐟 𝐢𝐦𝐚𝐠𝐞𝐬 𝐭𝐨 𝐫𝐞𝐭𝐮𝐫𝐧 𝐢𝐧 𝐭𝐡𝐞 𝐟𝐨𝐫𝐦𝐚𝐭: ${this.config.guide.en}\n__________________\n 🅩🅔🅟🅗🅘🅡🅔`, event.threadID, event.messageID);
      }
      const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
      const numberSearch = parseInt(keySearch.split("-").pop().trim()) || 6;

      const res = await axios.get(`https://celestial-dainsleif-v2.onrender.com/pinterest?pinte=${encodeURIComponent(keySearchs)}`);
      const data = res.data;

      if (!data || !Array.isArray(data) || data.length === 0) {
        return api.sendMessage(`No image data found for "${keySearchs}". Please try another search query.`, event.threadID, event.messageID);
      }

      const imgData = [];

      for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
        const imageUrl = data[i].image;

        try {
          const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const imgPath = path.join(__dirname, 'cache', `${i + 1}.jpg`);
          await fs.outputFile(imgPath, imgResponse.data);
          imgData.push(fs.createReadStream(imgPath));
        } catch (error) {
          console.error(error);
          // Handle image fetching errors (skip the problematic image)
        }
      }

      await api.sendMessage({
        attachment: imgData,
        body: `Here are the top ${imgData.length} image results for "${keySearchs}":`
      }, event.threadID, event.messageID);

      await fs.remove(path.join(__dirname, 'cache'));
    } catch (error) {
      console.error(error);
      return api.sendMessage(`An error occurred. Please try again later.`, event.threadID, event.messageID);
    }
  }
};
