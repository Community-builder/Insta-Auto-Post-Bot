// main.js
const express = require('express');
const cron = require('node-cron');
const { cropVideo } = require('./Helpers/VideoProcessing'); // Import the cropVideo function
const { startUploadSession } = require('./Helpers/upload');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

// Your existing configuration and code...
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Function to handle the upload process with metadata
async function runUploadProcess(mediaType, retryCount = 0) {
  console.log(`Starting upload process for ${mediaType} with VideoNumber:`, config.mediaName);

  try {
    // Crop the video first before uploading
    await cropVideo(config.inputVideo, config.outputDir, config.beepAudio, config.mediaName, config.videoDuration, config.videoQuantity, config.episode);

    // Upload process...
    await startUploadSession(config.accessToken, config.folderName, config.mediaName, mediaType, config.caption, config.hashtags, '', '', config.location, config.ngrokServer);
    console.log('Upload completed successfully');
    
    // Increment media name for the next upload
    config.mediaName++;
  } catch (error) {
    console.error(`Error during ${mediaType} upload process:`, error);

    // Retry logic...
    if (retryCount < 3) {
      console.log(`Retrying upload for ${mediaType}... Attempt ${retryCount + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
      await runUploadProcess(mediaType, retryCount + 1); // Retry with incremented retry count
    } else {
      console.error(`Max retries reached for ${mediaType}. Waiting for the next cron job.`);
    }
  }
}

// Schedule cron jobs to handle both reels and photos every 4 hours
cron.schedule('0 */4 * * *', () => runUploadProcess('VIDEO'));

// Run the upload process immediately when the script starts
runUploadProcess('VIDEO'); // Initial upload for reels

// Express route to manually trigger upload process
app.get('/upload', async (req, res) => {
  try {
    await runUploadProcess('VIDEO');
    res.status(200).send('Upload process started.');
  } catch (error) {
    console.error('Error triggering upload process:', error);
    res.status(500).send('Error triggering upload process.');
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Cron jobs scheduled. Waiting for the next run...');
});
