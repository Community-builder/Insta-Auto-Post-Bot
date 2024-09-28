const { TextEncoder, TextDecoder } = require('util');
let helia = null;
let fs = null;


// Polyfill for CustomEvent
if (typeof window === 'undefined' && typeof CustomEvent !== 'function') {
    class CustomEvent extends Event {
        constructor(event, params) {
            super(event, params);
            this.detail = params?.detail || {};
        }
    }
    global.CustomEvent = CustomEvent;
}

// Initialize Helia and UnixFS
const initialize = async () => {
    try {
        if (!helia || !fs) {
            const { createHelia } = await import('helia');
            const { unixfs } = await import('@helia/unixfs');

            helia = await createHelia();
            fs = unixfs(helia);
        }
    } catch (error) {
        console.log(error);
        throw new Error('Failed to initialize Helia and UnixFS');
    }
};

// Encode content based on its MIME type
const encodeContent = (content, contentType) => {
    if (contentType === 'application/json') {
        return new TextEncoder().encode(JSON.stringify(content));
    } else if (contentType.startsWith('text/')) {
        return new TextEncoder().encode(content);
    } else if (contentType.startsWith('image/') || contentType === 'application/octet-stream') {
        return content; // Return buffer for binary files
    } else {
        throw new Error('Unsupported content type');
    }
};

// Add file to IPFS
const addFileToIPFS = async (fileToUpload) => {
    try {
        // Ensure Helia is initialized
        await initialize();

        const contentType = fileToUpload.mimetype;
        const content = fileToUpload.buffer;
        console.log("Adding", content, contentType);

        const events = [];
        const file = encodeContent(content, contentType);

        const cid = await fs.addBytes(file, {
            onProgress: (evt) => {
                events.push({ type: evt.type, detail: evt.detail });
            }
        });

        console.log(cid);

        const serializedResult = serializeBigInt({ cid: cid.toString() });
        console.log(serializedResult);
        return serializedResult;

    } catch (error) {
        console.log(error);
        
        throw new Error(error);
    }
};

// Retrieve file from IPFS
const retrieveFileFromIPFS = async (cid) => {
    if (!cid) {
        throw new Error('No CID provided');
    }

    try {
        // Ensure Helia is initialized
        await initialize();

        const decoder = new TextDecoder();
        let content = '';

        const events = [];

        for await (const chunk of fs.cat(cid, {
            onProgress: (evt) => {
                events.push({ type: evt.type, detail: evt.detail });
            }
        })) {
            content += decoder.decode(chunk, { stream: true });
        }

        if (!content) {
            throw new Error('No content retrieved from IPFS');
        }

        return { content };

    } catch (error) {
        throw new Error('Error retrieving file from IPFS');
    }
};

// Helper function to serialize BigInt values
const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )
    );
};

module.exports = { addFileToIPFS, retrieveFileFromIPFS };
