const cron = require('node-cron');
const { startUploadSession } = require('./Helpers/upload');

let mediaName = 1;  // Initialize media name (for both reels and photos)
let folderName = 'postAssets/nft'; // Folder containing media files

const accessToken = '';  // Instagram access token

// Metadata variables (customize these as needed)
let location = "New York";  // Location metadata (optional)
let hashtags = "#NFT #cryptoart #digitalart";  // Hashtags for the post
let caption = `Exciting NFT drop! Check out my latest work. ${hashtags}`;  // The caption for both reels and photos

// Function to handle the upload process with metadata
async function runUploadProcess(mediaType, retryCount = 0) {
  console.log(`Starting upload process for ${mediaType} with mediaName:`, mediaName);

  // Combine metadata into an object
  try {
    await startUploadSession(accessToken, folderName, mediaName, mediaType, caption, hashtags, coverUrl = '', thumbOffset = "", location);  // Passing metadata to the upload function
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
