require('dotenv').config();  // Load environment variables


const videoName= "doraemon"
const hashtags= "#NFT #cryptoart #digitalart #kapilsharma #kapilsharma #kapilsharmashow #salmankhan #bollywood #thekapilsharmashow #comedy #deepikapadukone #akshaykumar #metakul #samayRaina #samay #viralreels #funnymemes "

const config = {
  episode: 1,
  mediaName: 13,
  videoDuration: 30,
  videoQuantity: 1,
  videoTocut:videoName,
  folderName: `postAssets/${videoName}`,
  accessToken: process.env.web3_sol,
  ngrokServer: process.env.NGROK_SERVER,
  location: "New York",
  hashtags: hashtags, 
  caption: `Exciting NFT drop! Check out discord link in bio. ${hashtags}`,
  inputVideo: `postAssets/${videoName}/${videoName}.mp4`,
  outputDir: `./postAssets/${videoName}`,
  beepAudio: 'postAssets/input/beep.mp3', // for bg 
};

module.exports = config;