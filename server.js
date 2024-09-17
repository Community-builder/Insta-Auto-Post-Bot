const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { startUploadSession } = require('./Helpers/upload'); // Import the cron job file

const app = express();
const port = 3000;

// Define the path to the postAssets folder
const postAssetsFolderPath = path.join(__dirname, '../postAssets');

// Serve static files from postAssets folder
app.use('/postAssets', express.static(postAssetsFolderPath));

// Define parameters
let photoName = 1; // Initialize photoName
let folderName = 'nft'; // Initialize folderName
const accessToken = '';  // Instagram access token

// Function to handle the upload process
async function runUploadProcess() {
  console.log('Starting upload process with photoName:', photoName);
  try {
    await startUploadSession(accessToken, folderName, photoName);  // Pass the parameters
    console.log('Upload completed successfully');
    
    // Increment photoName for the next upload
    photoName++;
  } catch (error) {
    console.error('Error during upload process:', error);
  }
}

// Function to execute the upload process immediately
function runInitialUpload() {
  console.log('Running initial upload process...');
  runUploadProcess();
}

// Schedule cron job to run every 12 hours
cron.schedule('0 */12 * * *', runUploadProcess); // Every 12 hours

// Schedule cron jobs for specific times
cron.schedule('45 11 * * *', runUploadProcess); // 11:45 AM
cron.schedule('30 18 * * *', runUploadProcess); // 6:30 PM

// Run the upload process immediately when the server starts
runInitialUpload();

// Start the Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
