const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { uploadFileToIPFS } = require('./Ipfs');

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

// Function to post media (either photo or reel)
const postInstagramMedia = async (igId, accessToken, mediaUrl, mediaType,coverUrl, caption, thumbOffset = '', locationId = '') => {
  const url = `https://graph.instagram.com/v20.0/${igId}/media`;
  console.log(`Uploading ${mediaType}`);

  try {
    // Prepare the request body conditionally
    const requestBody = {
      caption,
      location_id: locationId,
    };

    // Only add media_type and associated fields if mediaType is VIDEO
    if (mediaType === 'VIDEO') {
      requestBody.media_type = "REELS";
      requestBody.upload_type = "REELS";
      requestBody.video_url = mediaUrl;
      requestBody.cover_url = coverUrl;
      requestBody.thumb_offset = thumbOffset;
      requestBody.share_to_feed = "true";
    } else if (mediaType === 'IMAGE') {
      requestBody.image_url = mediaUrl;
    }

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        access_token: accessToken,
      }
    });

    console.log(`${mediaType} uploaded successfully for:`, response.data);
    return response.data.id;
  } catch (error) {
    console.error(`Error creating ${mediaType}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : error.message;
  }
};

// Function to check media status
const checkMediaStatus = async (creationId, accessToken) => {
  const url = `https://graph.instagram.com/${creationId}`;
  try {
    const response = await axios.get(url, {
      params: {
        fields: 'status_code',
        access_token: accessToken,
      }
    });

    console.log(response.data);
    
    return response.data.status_code;
  } catch (error) {
    console.error('Error checking media status:', error.response ? error.response.data : error.message);
    throw error;
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

  // Polling until the status code is FINISHED
  const maxRetries = 100;
  let retries = 0;
  let statusCode = '';

  // Poll the media status until it becomes 'FINISHED'
  while (statusCode !== 'FINISHED' && retries < maxRetries) {
    try {
      statusCode = await checkMediaStatus(creationId, accessToken);

      if (statusCode === 'FINISHED') {
        console.log(`Media status is FINISHED. Current status: ${statusCode} for video ${mediaName}.`);
        break; // Exit the loop as the media is ready for publishing
      } else {
        console.log(`Media status is not FINISHED yet. Current status: ${statusCode} for video ${mediaName}. Retrying...`);
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
      }
    } catch (statusError) {
      console.error(`Error checking media status for ${mediaName}:`, statusError.response ? statusError.response.data : statusError.message);
      throw statusError; // Stop and throw error if status check fails
    }
  }

  if (statusCode === 'FINISHED') {
    // Retry publishing the media even after the status is FINISHED
    return await publishWithRetry(creationId, accessToken);
  } else {
    console.error('Max retries reached. Media could not be published due to unfinished status.');
    throw new Error('Media publishing failed due to unfinished status.');
  }
};

// Function to get file path for both reels (videos) and photos (images)
const getFilePath = (folderName, mediaName, mediaType) => {
  const extension = mediaType === 'VIDEO' ? '.mp4' : '.jpg';
  return path.join(__dirname, `../${folderName}/${mediaName}${extension}`);
};

// Upload session handler
const startUploadSession = async (accessToken, folderName, mediaName, mediaType, caption = '', coverUrl = '', thumbOffset = '', locationId = '') => {
  try {
    console.log("Creating media for", mediaName, mediaType);
    
    const filePath = getFilePath(folderName, mediaName, mediaType);
    const coverUrlPath = getFilePath(folderName, "1", "IMAGE");
    // Step 1: Upload media to IPFS
    const fileStream = fs.createReadStream(filePath);
    const fileStreamCoverUrl = fs.createReadStream(coverUrlPath);
    console.log("Uploading ", mediaType, mediaName);
    
    const ipfsResponse = await uploadWithRetry(uploadFileToIPFS, fileStream);
    const ipfsResponseCoverUrl = await uploadWithRetry(uploadFileToIPFS, fileStreamCoverUrl);

    if (!ipfsResponse.success) {
      throw new Error(`Failed to upload media to IPFS: ${ipfsResponse.pinataURL}`);
    }
    if (!ipfsResponseCoverUrl.success) {
      throw new Error(`Failed to upload coverUrl to IPFS: ${ipfsResponseCoverUrl.pinataURL}`);
    }

    const mediaUrl = ipfsResponse.pinataURL;
    const newCoverurl = ipfsResponseCoverUrl.pinataURL;
    
    console.log("Uploaded to IPFS", mediaUrl);

    // Step 2: Fetch Instagram user details to get igId
    const { igId } = await fetchInstagramUserDetails(accessToken);

    // Step 3: Post media and get the creation ID
    const creationId = await postInstagramMedia(igId, accessToken, mediaUrl, mediaType, coverUrl=newCoverurl, caption, thumbOffset, locationId);

    // Step 4: Publish the media
    if (creationId) {
      await publishInstagramMedia(igId, creationId, accessToken, mediaName);
    }
  } catch (error) {
    console.error('Error in Instagram media workflow:', error);
    throw error;
  }
};

const uploadWithRetry = async (uploadFunction, fileStream, maxRetries = 3) => {
  let attempt = 0;
  let success = false;
  let response;

  while (attempt < maxRetries && !success) {
    try {
      console.log(`Attempt ${attempt + 1} to upload file...`);
      response = await uploadFunction(fileStream);
      if (response.success) {
        console.log('Upload successful on attempt', attempt + 1);
        success = true;
      } else {
        throw new Error(`Failed on attempt ${attempt + 1}`);
      }
    } catch (error) {
      attempt++;
      console.error(`Upload attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
  return response;
};

module.exports = { startUploadSession,publishInstagramMedia };
