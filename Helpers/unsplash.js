const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to fetch a random image based on a category from Unsplash
async function fetchRandomImageFromUnsplash(category) {
  const accessKey = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with your Unsplash Access Key
  const apiUrl = `https://api.unsplash.com/photos/random?query=${category}&client_id=${accessKey}`;

  try {
    const response = await axios.get(apiUrl);
    const imageUrl = response.data.urls.full; // Full-size image URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    const imagePath = path.join(__dirname, `category.jpg`);
    fs.writeFileSync(imagePath, imageResponse.data); // Save the image to your local filesystem
    return imagePath;
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
  }
}

// Example usage
fetchRandomImageFromUnsplash('nature').then((imagePath) => {
  console.log('Random image saved at:', imagePath);
});
