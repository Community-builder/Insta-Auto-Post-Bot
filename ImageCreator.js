const axios = require('axios');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Replace with your own API keys
const NINJA_API_KEY = 'No+yKRy28yj6XLXTRk7aQA==TlFHm06Ge7LIvBWk'; // For Ninja Quotes API

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
    ctx.font = '48px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;

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
    ctx.fillText(`- ${author}`, x, y + lines.length * 60 + 40);

    // Save the canvas as a new image file
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(outputFilePath, buffer);
    console.log('Image with quote saved:', outputFilePath);
  } catch (error) {
    console.error('Error overlaying the quote on the canvas:', error);
  }
}

// Main function to fetch the quote and create an image with the quote on a blank canvas
async function createImageWithQuote(quoteCategory, index) {
  try {
    const quoteData = await fetchQuote(quoteCategory);
    const canvas = await createBlankCanvas(1080, 1080); // Create a blank white canvas of size 1080x1080
    const outputImagePath = path.join(__dirname, `/postAssets/nft/${index}.png`);

    if (quoteData) {
      await overlayQuoteOnCanvas(quoteData.quote, quoteData.author, canvas, outputImagePath);
    }
  } catch (error) {
    console.error('Error creating image with quote:', error);
  }
}

// Function to generate multiple images in a loop
async function generateImages(numImages) {
  for (let i = 1; i <= numImages; i++) {
    const quoteCategory = 'happiness';  // You can change categories as needed
    await createImageWithQuote(quoteCategory, i);
  }
}

// Generate 5 images
generateImages(5);
