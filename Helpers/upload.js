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
    throw error?.response;
  }
};

// Function to post media (either photo or reel)
const postInstagramMedia = async (igId, accessToken, mediaUrl, mediaType, caption = '', coverUrl = '', thumbOffset = '', locationId = '') => {
  const url = `https://graph.instagram.com/v20.0/${igId}/media`;
  try {
    const response = await axios.post(url, {
      media_type: mediaType === 'VIDEO' ? "REELS" : undefined, 
      video_url: mediaType === 'VIDEO' ? mediaUrl : undefined,
      image_url: mediaType === 'IMAGE' ? mediaUrl : undefined,
      caption,
      cover_url: mediaType === 'VIDEO' ? coverUrl : undefined,
      thumb_offset: mediaType === 'VIDEO' ? thumbOffset : undefined,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        access_token: accessToken,
      }
    });

    console.log(`${mediaType} created successfully:`, response.data);
    return response.data.id;
  } catch (error) {
    console.error(`Error creating ${mediaType}:`, error.response ? error.response.data : error.message);
    throw error?.response
  }
};

// Function to publish media
const publishInstagramMedia = async (igId, creationId, accessToken) => {
  const url = `https://graph.instagram.com/v20.0/${igId}/media_publish`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        creation_id: creationId,
        access_token: accessToken,
      }
    });

    console.log('Media published successfully:', response.data);
  } catch (error) {
    console.error('Error publishing media:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Function to get file path for both reels (videos) and photos (images)
const getFilePath = (folderName, mediaName, mediaType) => {
  const extension = mediaType === 'VIDEO' ? '.mp4' : '.png';
  return path.join(__dirname, `../${folderName}/${mediaName}${extension}`);
};

// Upload session handler
const startUploadSession = async (accessToken, folderName, mediaName, mediaType, caption = '',hashtags, coverUrl = '', thumbOffset = '', locationId = '') => {
  try {
    const filePath = getFilePath(folderName, mediaName, mediaType);
    const extension = mediaType === 'VIDEO' ? '.mp4' : '.png';
    // // Step 1: Upload media to IPFS
    // const fileStream = fs.createReadStream(filePath);
    // const ipfsResponse = await uploadFileToIPFS(fileStream);

    // if (!ipfsResponse.success) {
    //   throw new Error(`Failed to upload media to IPFS: ${ipfsResponse.pinataURL}`);
    // }

    const mediaUrl = `https://3455-2409-40e3-387-d187-e6da-2ca0-2001-8f66.ngrok-free.app/${folderName}/${mediaName}${extension}`;

    console.log(mediaUrl);
    
    // Step 2: Fetch Instagram user details to get igId
    const { igId } = await fetchInstagramUserDetails(accessToken);

    // Step 3: Post media and get the creation ID
    const creationId = await postInstagramMedia(igId, accessToken, mediaUrl, mediaType, caption, coverUrl, thumbOffset, locationId);

    // Step 4: Publish the media
    if (creationId) {
      await tryPublishInstagramMedia(igId, creationId, accessToken);
    } else {
      console.error('Failed to obtain creationId, cannot publish media.');
    }
  } catch (error) {
    // console.error('Error in Instagram media workflow:', error.response);
    throw error.response;
  }
};


async function checkMediaStatus(creationId, accessToken) {
  let status = '';
  
  while (status !== 'FINISHED') {
    try {
      const response = await axios.get(`https://graph.instagram.com/${creationId}?fields=status_code&access_token=${accessToken}`);
      status = response.data.status_code;
      console.log(`Media status is ${status}`);

      if (status !== 'FINISHED') {
        // Wait 10 seconds before checking the status again
        await wait(10000); 
      }

    } catch (error) {
      // console.error('Error checking media status:', error?.response);
      // Optionally wait before retrying in case of error
      await wait(10000);
    }
  }
  
  console.log('Media is FINISHED.');
}


function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to publish Instagram media with retries
// Function to publish Instagram media with retries
async function tryPublishInstagramMedia(igId, creationId, accessToken) {
  try {
    await checkMediaStatus(creationId, accessToken);
    await publishInstagramMedia(igId, creationId, accessToken);
    console.log('Media published successfully.');
  } catch (error) {
    console.error('Error publishing media:', error);
    // Optionally handle the case where publishing fails
  }
}



module.exports = { startUploadSession };
