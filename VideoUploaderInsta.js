const cron = require('node-cron');
const { startUploadSession } = require('./Helpers/upload');
require('dotenv').config();  // Load environment variables


// ! Add media no to upload
let mediaName = 21; 

const chotabheem_folder ='postAssets/bheem'
const samay_raina_folder = "postAssets/nft"
const doraemon_folder= "postAssets/doraemon"


// ! Update foldername to get media
let folderName = samay_raina_folder; // Folder containing media files



// ! Update acceess token to upload media
const doraemon_eth=process.env.doraemon_eth
const chota_bheem_btc=process.env.chota_bheem_btc

const web3_sol=process.env.web3_sol
const movies_crypto =process.env.movies_crypto 



const accessToken = web3_sol

const ngrokServer= process.env.NGROK_SERVER



// Metadata variables (customize these as needed)
let location = "New York";  // Location metadata (optional)
let hashtags = "#NFT #cryptoart #digitalart #kapilsharma #kapilsharma #kapilsharmashow #salmankhan #bollywood #thekapilsharmashow #comedy #deepikapadukone #akshaykumar #samayRaina #samay #viralreels #funnymemes";  // Hashtags for the post
let caption = `Exciting NFT drop! Check out discord link in bio. ${hashtags} #metakul`;  // The caption for both reels and photos

// Function to handle the upload process with metadata
async function runUploadProcess(mediaType, retryCount = 0) {
  console.log(`Starting upload process for ${mediaType} with mediaName:`, mediaName);

  // Combine metadata into an object
  try {
    await startUploadSession(accessToken, folderName, mediaName, mediaType, caption, hashtags, coverUrl = '', thumbOffset = "", location,ngrokServer);  // Passing metadata to the upload function
    console.log('Upload completed successfully');
    console.log("waiting for next cron Job");
    
    
    // Increment media name for the next upload
    mediaName++;
  } catch (error) {
    console.error(`Error during ${mediaType} upload process:`, error);
    
    // Retry logic
    if (retryCount < 3) {
      console.log(`Retrying upload for ${mediaType}... Attempt ${retryCount + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
      await runUploadProcess(mediaType, retryCount + 1); // Retry with incremented retry count
    } else {
      console.error(`Max retries reached for ${mediaType}. Waiting for the next cron job.`);
    }
  }
}

// Function to run the upload process immediately for initial execution
function runInitialUpload(mediaType) {
  console.log(`Running initial upload process for ${mediaType}...`);
  runUploadProcess(mediaType);
}

// Schedule cron jobs to handle both reels and photos every 4 hours
cron.schedule('0 */4 * * *', () => runUploadProcess('VIDEO'));
// Run the upload process immediately when the script starts
runInitialUpload('VIDEO'); // Initial upload for reels

// Keep the script running to listen for cron jobs
console.log('Cron jobs scheduled. Waiting for the next run...');
