// main.js (or whatever your main file is)
const express = require('express');
const cron = require('node-cron');
const fs = require('fs');
require('dotenv').config();  // Load environment variables

const { cropVideo } = require('./Helpers/VideoProcessing');  // Import the cropVideo function
const { startUploadSession } = require('./Helpers/upload');
const config = require('./config');

// Ensure the output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Function to handle the upload process with metadata
async function runUploadProcess(mediaType, retryCount = 0) {
  console.log(`Starting upload process for ${mediaType} with VideoNumber:`, config.mediaName);

  try {
    // Crop the video before uploading
    await cropVideo(config.inputVideo, config.outputDir, config.beepAudio, config.mediaName, config.videoDuration, config.videoQuantity, config.episode);

    // Upload process
    await startUploadSession(config.accessToken, config.folderName, config.mediaName, mediaType, config.caption, config.hashtags, coverUrl = '', thumbOffset = "", config.location, config.ngrokServer);
    console.log('Upload completed successfully');

    // Increment media name for the next upload
    config.mediaName++;
  } catch (error) {
    console.error(`Error during ${mediaType} upload process:`, error);

    // Retry logic
    if (retryCount < 3) {
      console.log(`Retrying upload for ${mediaType}... Attempt ${retryCount + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));  // Wait for 5 seconds before retrying
      await runUploadProcess(mediaType, retryCount + 1);  // Retry with incremented retry count
    } else {
      console.error(`Max retries reached for ${mediaType}. Waiting for the next cron job.`);
    }
  }
}

// Schedule cron jobs to handle both reels and photos every 4 hours
cron.schedule('0 */4 * * *', () => runUploadProcess('VIDEO'));

// Run the upload process immediately when the script starts
runUploadProcess('VIDEO');  // Initial upload for reels

// Keep the script running to listen for cron jobs
console.log('Cron jobs scheduled. Waiting for the next run...');

// Create Express server to keep Heroku/Render instance alive
const app = express();

// Basic route for server health check
app.get('/', (req, res) => {
  res.send('Server is running and cron jobs are scheduled.');
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
