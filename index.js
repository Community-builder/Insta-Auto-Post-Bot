const axios = require('axios');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { startUploadSession } = require('./Helpers/upload');



// @dev create and upload an image

// Replace with your own API keys
const NINJA_API_KEY = 'No+yKRy28yj6XLXTRk7aQA==TlFHm06Ge7LIvBWk'; // For Ninja Quotes API
const HASHTAG_API_KEY = '2910ac3ad1msh91df4cc0af3ed50p17b0a5jsn26accce06896'; // Replace with your Hashtag5 API key

// Metadata variables (customize these as needed)
let location = "New York";
let hashtag = "";
let quoteText = "happiness";  
let hashtagText = "happiness";  
let caption = `Grandma is here to help you join discord. Link in bio. ${hashtag}. This Page is maintained By W3IC. All rights reserved`;  // The caption for both reels and photos
let mediaName = 1;  // Initialize media name (for both reels and photos)
let folderName = 'postAssets/nft'; // Folder containing media files

const accessToken = ''; // Instagram access token

// Function to fetch a random quote from the Ninja API based on category
async function fetchQuote(quoteCategory) {
  try {
    const response = await axios.get(`https://api.api-ninjas.com/v1/quotes?category=${quoteCategory}`, {
      headers: { 'X-Api-Key': NINJA_API_KEY }
    });
    return response.data[0]; // Return the first quote
  } catch (error) {
    console.error('Error fetching the quote:', error);
  }
}

// Function to create a blank white canvas
async function createBlankCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill the canvas with a white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

// Function to wrap long text into multiple lines
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  
  words.forEach(word => {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && line !== '') {
      lines.push(line);
      line = word + ' ';
    } else {
      line = testLine;
    }
  });
  
  lines.push(line); // Push the last line
  return lines;
}

// Function to overlay the quote on the blank canvas
async function overlayQuoteOnCanvas(quote, author, canvas, outputFilePath) {
  try {
    const ctx = canvas.getContext('2d');

    // Set up the text properties
    ctx.font = 'bold 48px Arial';  // Use bold font weight
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';

    const maxWidth = 900; // Set a maximum width for the text
    const x = canvas.width / 2;
    let y = canvas.height / 2 - 100;

    // Wrap the quote into multiple lines
    const lines = wrapText(ctx, `"${quote}"`, maxWidth);
    
    // Draw each line of the quote
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * 60); // Adjust line spacing as needed (60px in this case)
    });

    // Draw the author just below the quote
    ctx.font = 'bold 36px Arial'; // Slightly smaller but still bold font for the author
    ctx.fillText(`- ${author}`, x, y + lines.length * 60 + 60);

    // Save the canvas as a new image file
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(outputFilePath, buffer);
    console.log('Image with quote saved:', outputFilePath);
  } catch (error) {
    console.error('Error overlaying the quote on the canvas:', error);
  }
}

// Function to fetch hashtags using the Hashtag5 API
async function fetchHashtags(keyword) {
  try {
    const response = await axios.get('https://hashtag5.p.rapidapi.com/api/v2.1/tag/predict', {
      params: { keyword },
      headers: {
        'X-RapidAPI-Host': 'hashtag5.p.rapidapi.com',
        'X-RapidAPI-Key': HASHTAG_API_KEY
      }
    });
    
    return response.data.tags; // Return the array of hashtags
  } catch (error) {
    console.error('Error fetching hashtags:', error);
  }
}

// Function to generate hashtags based on hashtagText
async function generateHashtags(text) {
  const hashtags = await fetchHashtags(text);
  const hashtgs=hashtags.map(tag => `#${tag}`).join(' ');
  console.log("hashtgs",hashtgs);
    
  return hashtgs
}

// Function to create a new image with a random quote
async function createImageWithQuote(quoteCategory, index) {
  try {
    const quoteData = await fetchQuote(quoteCategory);
    const canvas = await createBlankCanvas(1080, 1080); // Create a blank white canvas of size 1080x1080
    const outputImagePath = path.join(__dirname, `/postAssets/nft/${index}.png`);

    if (quoteData) {
      await overlayQuoteOnCanvas(quoteData.quote, quoteData.author, canvas, outputImagePath);

      // Update hashtags and caption
      hashtag = await generateHashtags(hashtagText);
      console.log("hashtag",);
      
      caption = `Grandma is here to help you join discord. Link in bio. ${hashtag}. This Page is maintained By W3IC. All rights reserved`;  // The caption for both reels and photos

    }
  } catch (error) {
    console.error('Error creating image with quote:', error);
  }
}

// Function to handle the upload process with metadata
async function runUploadProcess(mediaType, retryCount = 0) {
  console.log(`Starting upload process for ${mediaType} with mediaName:`, mediaName);

  // Combine metadata into an object
  try {
    await startUploadSession(accessToken, folderName, mediaName, mediaType, caption, hashtag, coverUrl = '', thumbOffset = "", location);  // Passing metadata to the upload function
    console.log('Upload completed successfully');
    
    // Increment media name for the next upload
    mediaName++;
    console.log("uploading mediaName.jpg after 4 hours");
    
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

// Function to create a new image and then upload it
async function createAndUpload() {
  try {
    console.log('Creating a new image with a quote...');
    await createImageWithQuote(quoteText, mediaName);
    console.log('Image created. Now uploading...');
    await runUploadProcess('IMAGE');
  } catch (error) {
    console.error('Error in create and upload process:', error);
  }
}

// Schedule cron jobs to create a new image and handle upload every 4 hours
cron.schedule('0 */4 * * *', async () => {
  console.log('Cron job triggered. Creating and uploading a new image.');
  await createAndUpload();
});

// Run the process immediately when the script starts
console.log('Running the initial create and upload process...');
createAndUpload();
