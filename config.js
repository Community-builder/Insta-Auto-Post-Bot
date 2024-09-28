require('dotenv').config();  // Load environment variables


const videoName= process.env.VIDEO_NAME
const hashtags= "#NFT #cryptoart #digitalart #kapilsharma #kapilsharma #kapilsharmashow #salmankhan #bollywood #thekapilsharmashow #comedy #deepikapadukone #akshaykumar #metakul #samayRaina #samay #viralreels #funnymemes "

const config = {
  episode:  process.env.VIDEO_EPISODE_NUMBER,
  mediaName: 14,
  videoDuration: 30,
  videoQuantity: 1,
  videoTocut:videoName,
  folderName: `${videoName}`,
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
  location: "New York",
  hashtags: hashtags, 
  caption: `Exciting NFT drop! Check out discord link in bio. ${hashtags}`,
  inputVideo: `postAssets/input/${videoName}.mp4`,
  outputDir: `./postAssets/${videoName}`,
  beepAudio: 'postAssets/input/beep.mp3', // for bg 
};

module.exports = config;