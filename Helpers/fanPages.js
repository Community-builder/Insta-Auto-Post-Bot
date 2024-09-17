const { fetchLatestCreationId } =require('./fetchUserMedia');
 
const axios = require('axios');

// Function to fetch Instagram user details
const fetchInstagramUserDetails = async (accessToken) => {
  const url = 'https://graph.instagram.com/v20.0/me';
  try {
    const response = await axios.get(url, {
      params: {
        fields: 'user_id,username',
        access_token: accessToken,
      }
    });

    const userData = response.data;
    const igId = userData.user_id;
    const igUsername = userData.username;

    console.log('Instagram User ID:', igId);
    console.log('Instagram Username:', igUsername);

    return { igId, igUsername };
  } catch (error) {
    console.error('Error fetching Instagram user details:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : error.message;
  }
};


// Function to publish media
const publishInstagramMedia = async (igId, creationId, accessToken, mediaName) => {
  const url = `https://graph.instagram.com/v20.0/${igId}/media_publish`;
  
  // Function to publish media with retry logic
  const publishWithRetry = async (creationId, accessToken, maxRetries = 5) => {
    let attempt = 0;
    let success = false;
    let response;

    while (attempt < maxRetries && !success) {
      try {
        console.log(`Attempt ${attempt + 1} to publish media...`);
        response = await axios.post(url, null, {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            creation_id: creationId,
            access_token: accessToken,
          },
        });

        console.log(`Media published successfully for mediaName: ${mediaName}`, response.data);
        success = true;
        return response.data;
      } catch (publishError) {
        attempt++;
        console.error(`Publishing attempt ${attempt} failed:`, publishError.response ? publishError.response.data : publishError.message);

        if (attempt >= maxRetries) {
          console.error(`Failed to publish media ${mediaName} after ${maxRetries} attempts.`);
          throw new Error(`Media publishing failed for ${mediaName} after ${maxRetries} retries.`);
        }

        console.log(`Retrying to publish media for ${mediaName}...`);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
      }
    }
  };

    // Retry publishing the media even after the status is FINISHED
    return await publishWithRetry(creationId, accessToken);

};


// Upload session handler
const startUploadSession = async (accessToken, fanPageId ) => {
  try {
    console.log("Creating media for",fanPageId);
    
  
    // Step 2: Fetch Instagram user details to get igId
    const { igId } = await fetchInstagramUserDetails(accessToken);

    
    const creationId=await fetchLatestCreationId(accessToken, fanPageId);
    // Step 4: Publish the media
    if (creationId) {
      await publishInstagramMedia(igId, creationId, accessToken, "VIDEO");
    }
  } catch (error) {
    console.error('Error in Instagram media workflow:', error);
    throw error;
  }
};



module.exports = { startUploadSession };
