const axios = require('axios');
const FormData = require('form-data');

// Pinata API keys
const key = "d99730e010f73478ad6a";
const secret = "5945b45be19c1c151c2f5b9791c214551c7a513f22b5bb3402d75f087a33cb46";

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
        return {
            success: false,
            pinataURL: error.message,
        };
    }
};


module.exports = { uploadFileToIPFS };
