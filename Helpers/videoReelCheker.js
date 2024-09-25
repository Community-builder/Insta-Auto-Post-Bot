const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Set path for ffprobe (change the path if needed)
ffmpeg.setFfprobePath('/usr/bin/ffprobe');

const ipfsUrl = 'https://gateway.pinata.cloud/ipfs/QmVrJ2Tvmesj2rodyRjcpVFB1neBBWrmNTMiYMs5AQPff2'; // Replace YOUR_CID with the actual CID of the video
const outputFilePath = 'downloaded-video.mp4'; // Path to save the downloaded video

const videoSpecifications = {
  container: ['mp4'],
  audioCodec: 'aac',
  audioSampleRate: 48000,
  audioChannels: [1, 2],
  videoCodecs: ['libx264', 'libx265'], // H264 or HEVC
  frameRateRange: [23, 60],
  maxWidth: 1920,
  recommendedAspectRatio: '9:16',
  maxVideoBitrate: '25000k', // 25 Mbps
  audioBitrate: '128k',
  maxDuration: 15 * 60, // 15 minutes in seconds
  minDuration: 3, // 3 seconds
  maxFileSize: 1 * 1024 * 1024 * 1024 // 1 GB in bytes
};

// Download video from IPFS
async function downloadVideo() {
  const writer = fs.createWriteStream(outputFilePath);
  const response = await axios({
    url: ipfsUrl,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Validate and re-encode video
function validateAndReencodeVideo() {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(outputFilePath, (err, metadata) => {
      if (err) {
        return reject('Error getting video metadata: ' + err);
      }

      const { duration, width, height, codec_name, codec_type, bit_rate } = metadata.streams[0];
      const audioCodec = metadata.streams.find(stream => stream.codec_type === 'audio')?.codec_name;

      // Check duration
      if (duration < videoSpecifications.minDuration || duration > videoSpecifications.maxDuration) {
        return reject(`Invalid video duration: ${duration}`);
      }

      // Check width and aspect ratio
      if (width > videoSpecifications.maxWidth) {
        return reject(`Width exceeds maximum: ${width}`);
      }

      // Check codec and bitrate
      if (!videoSpecifications.videoCodecs.includes(codec_name) || bit_rate > videoSpecifications.maxVideoBitrate) {
        // Re-encode video if specifications are not met
        return reencodeVideo(resolve, reject);
      }

      // Check file size
      fs.stat(outputFilePath, (err, stats) => {
        if (err) {
          return reject('Error checking file size: ' + err);
        }
        if (stats.size > videoSpecifications.maxFileSize) {
          return reject(`File size exceeds maximum: ${stats.size}`);
        }
        resolve('Video meets the specifications.');
      });
    });
  });
}

// Re-encode video to meet specifications
function reencodeVideo(resolve, reject) {
  const reencodedOutputFilePath = 'reencoded-video.mp4';

  ffmpeg(outputFilePath)
    .videoCodec('libx264') // Change to 'libx265' if you prefer HEVC
    .audioCodec('aac')
    .audioChannels(2) // Stereo sound
    .audioFrequency(videoSpecifications.audioSampleRate)
    .videoBitrate(videoSpecifications.maxVideoBitrate)
    .outputOptions([
      '-movflags', 'faststart', // Ensure moov atom is at the front for fast streaming
      '-pix_fmt', 'yuv420p', // 4:2:0 chroma subsampling
      '-r', '30', // Frame rate (30 FPS for Instagram Reels)
      '-b:a', videoSpecifications.audioBitrate // Audio bitrate
    ])
    .on('end', () => {
      fs.stat(reencodedOutputFilePath, (err, stats) => {
        if (err) {
          return reject('Error checking reencoded file size: ' + err);
        }
        if (stats.size > videoSpecifications.maxFileSize) {
          return reject(`Reencoded file size exceeds maximum: ${stats.size}`);
        }
        resolve('Reencoded video meets the specifications.');
      });
    })
    .on('error', (err) => {
      reject('Error re-encoding video: ' + err);
    })
    .save(reencodedOutputFilePath);
}

// Execute the script
(async () => {
  try {
    await downloadVideo();
    const result = await validateAndReencodeVideo();
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
})();
