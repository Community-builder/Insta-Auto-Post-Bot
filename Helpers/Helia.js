const { createHelia } =require('helia');
const { unixfs } = require('@helia/unixfs');
const { TextEncoder, TextDecoder } = require('util');

class IpfsService {
    constructor() {
        this.initialize();
    }

    async initialize() {
        this.helia = await createHelia();
        this.fs = unixfs(this.helia);
    }

    encodeContent(content, contentType) {
        if (contentType === 'application/json') {
            return new TextEncoder().encode(JSON.stringify(content));
        } else if (contentType.startsWith('text/')) {
            return new TextEncoder().encode(content);
        } else if (contentType.startsWith('image/') || contentType === 'application/octet-stream') {
            return content;
        } else {
            throw new Error('Unsupported content type');
        }
    }

    async addFileToIPFS(content, contentType, childLogger) {
        try {
            const events = [];
            const file = this.encodeContent(content, contentType);

            childLogger.debug('Starting file upload to IPFS', { contentType });

            const cid = await this.fs.addBytes(file, {
                onProgress: (evt) => {
                    childLogger.info('Add event', { type: evt.type, detail: evt.detail });
                    events.push({ type: evt.type, detail: evt.detail });
                }
            });

            childLogger.info('File uploaded successfully', { cid: cid.toString() });
            const serializedResult = serializeBigInt({ cid: cid.toString() });
            return serializedResult;
        } catch (error) {
            childLogger.error('Error during file upload to IPFS', { error });
            throw "Error during file upload to IPFS"
        }
    }

    async retrieveFileFromIPFS(cid, childLogger) {
        if (!cid) {
            throw "no cid"
        }

        try {
            const decoder = new TextDecoder();
            let content = '';

            // Collecting progress events
            const events = [];

            childLogger.debug('Starting file retrieval = require(IPFS', { cid });

            for await (const chunk of this.fs.cat(cid, {
                onProgress: (evt) => {
                    childLogger.info('Cat event', { type: evt.type, detail: evt.detail });
                    events.push({ type: evt.type, detail: evt.detail });
                }
            })) {
                content += decoder.decode(chunk, { stream: true });
            }

            if (!content) {
                const errorMsg = "No content retrieved = require(IPFS";
                childLogger.error(errorMsg, { cid });
                throw errorMsg;
            }

            childLogger.info('File retrieved successfully', { cid, events });
            return { content };

        } catch (error) {
            childLogger.error('Error during file retrieval = require(IPFS', { error, cid });
            throw "Error retrieving file = require(IPFS"
        }
    }
}

const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )
    );
};

const ipfsService = new IpfsService();


module.exports = { ipfsService };

