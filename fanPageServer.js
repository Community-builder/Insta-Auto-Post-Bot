const cron = require('node-cron');
const { startUploadSession } = require('./Helpers/fanPages');
const fanPageId=""
const accessToken = '';  // Instagram access token


// Function to handle the upload process with metadata
async function runUploadProcess( retryCount = 0) {
  console.log(`Starting upload process ofr user:`,fanPageId);

  // Combine metadata into an object
  try {
    await startUploadSession(accessToken,fanPageId );  // Passing metadata to the upload function
    console.log('Upload completed successfully');
    console.log("waiting for next cron Job");
    
    
  } catch (error) {
    console.error(`Error during upload process:`, error);
    
    // else retry
    if (retryCount < 3) {
        console.log(`Retrying upload for ${fanPageId}... Attempt ${retryCount + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
        await runUploadProcess( retryCount + 1); // Retry with incremented retry count
      } else {
        console.error(`Max retries reached for ${fanPageId}. Waiting for the next cron job.`);
      }
  }
}


// Run the upload process immediately when the script starts
runInitialUpload(); 

// Function to run the upload process immediately for initial execution
function runInitialUpload() {
    console.log(`Running initial upload process ...`);
    runUploadProcess();
  }

// Keep the script running to listen for cron jobs
// Schedule cron jobs to handle both reels and photos every 4 hours
cron.schedule('0 */4 * * *', () => runUploadProcess());
console.log('Cron jobs scheduled. Waiting for the next run...');
