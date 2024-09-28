const config = require("../config");
const { ThirdwebStorage } = require("@thirdweb-dev/storage");
const fs = require('fs'); // Node.js file system module to read files
const path = require('path'); // Module for handling file paths

const storage = new ThirdwebStorage({
    secretKey: config.THIRDWEB_SECRET_KEY
});

// Add file to IPFS
const addFileToIPFS = async (videoFilePath) => {
    try {
        // Read the video file
        const videoFile = await fs.promises.readFile(videoFilePath);

        // Create the metadata object
        const metadata =videoFile
        // Here we get the IPFS URI of where our metadata has been uploaded
        const uri = await storage.upload(metadata);
        console.info(uri); // Logs the IPFS URI

        // Here we get a URL with a gateway that we can look at in the browser
        const url = await storage.resolveScheme(uri);
        console.info(url); // Logs the gateway URL

        return url; // Return the IPFS URI
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
};

// Retrieve file from IPFS
const retrieveFileFromIPFS = async (cid) => {
    // Implement the retrieval logic here as needed
};

module.exports = { addFileToIPFS, retrieveFileFromIPFS };
