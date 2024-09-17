const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to fetch the latest media ID (creationId) from Instagram
const fetchLatestCreationId = async (accessToken, fanPageId) => {
    const url = `https://graph.instagram.com/v20.0/${fanPageId}/media`;
    const urlUserInfo = `https://graph.instagram.com/v20.0/${fanPageId}/media?access_token=${accessToken}`;

    try {
        console.log("fetchinf for",urlUserInfo);

        const response = await axios.get(urlUserInfo, {
        });

        // Check if the response contains data
        if (response.data && response.data.data && response.data.data.length > 0) {
            // Get the last media ID
            console.log("responsedata",response.data);
            
            const latestCreationId = response.data.data[0].id;
            console.log('Latest creationId:', latestCreationId);

            // Save the creationId to a file
            saveCreationIdToFile(latestCreationId);
            // Load the saved creationId

            const savedCreationId = loadCreationIdFromFile();
            console.log(savedCreationId);

            return latestCreationId;
        } else {
            console.log('No media found for the user.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching latest creationId:', error.response ? error.response.data : error.message);
        throw error.response.data;
    }
};

// Function to save the creationId to a file
const saveCreationIdToFile = (creationId) => {
    const filePath = path.join(__dirname, 'creationId.txt');

    fs.writeFile(filePath, creationId, (err) => {
        if (err) {
            console.error('Error saving creationId to file:', err.message);
        } else {
            console.log('creationId saved to file:', filePath);
        }
    });
};

// Function to load the creationId from the file
const loadCreationIdFromFile = () => {
    const filePath = path.join(__dirname, 'creationId.txt');

    try {
        const creationId = fs.readFileSync(filePath, 'utf8');
        console.log('Loaded creationId from file:', creationId);
        return creationId;
    } catch (err) {
        console.error('Error loading creationId from file:', err.message);
        return null;
    }
};


module.exports = { fetchLatestCreationId };
