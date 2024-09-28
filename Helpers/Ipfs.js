const axios = require('axios');
const FormData = require('form-data');

// Pinata API keys
const key = "e99ca1aeb6c2d3a8e4aa";
const secret = "26fd52158544126dea105fd91e9ea87a624e636b6979e3bf4f634905304ff064";

const uploadFileToIPFS = async (file) => {
    console.log("uploading to ipfs");
    
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    const data = new FormData();
    data.append('file', file);

    const metadata = JSON.stringify({
        name: 'movies.eth',
        metadata: {
            Owner: 'metakul'
        }
    });
    data.append('pinataMetadata', metadata);

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
            regions: [
                {
                    id: 'FRA1',
                    desiredReplicationCount: 1
                },
                {
                    id: 'NYC1',
                    desiredReplicationCount: 2
                }
            ]
        }
    });
    data.append('pinataOptions', pinataOptions);

    try {
        const response = await axios.post(url, data, {
            maxBodyLength: Infinity, // Increase the body length limit
            headers: {
                'Content-Type': `multipart/form-data`,
                pinata_api_key: key,
                pinata_secret_api_key: secret,
            }
        });

        return {
            success: true,
            pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
        };
    } catch (error) {
        console.log(error.response.data);
        
        return {
            success: false,
            pinataURL: error.message,
        };
    }
};


module.exports = { uploadFileToIPFS };
