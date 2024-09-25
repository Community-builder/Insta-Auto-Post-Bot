const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Set path for ffprobe (change if needed)
ffmpeg.setFfprobePath('/usr/bin/ffprobe');

const videoTocut="doraemon"


const inputVideo = `postAssets/input/${videoTocut}.mp4`; // Input video file
const outputDir = `./postAssets/${videoTocut}`; // Directory to store the output videos



const beepAudio = 'postAssets/input/beep.mp3'; // Beep audio file to add
const startVideoNumber = 9; // Start numbering from this video number
const videoDuration = 30; // Duration of each video segment in seconds
const videoQuantity = 4; // Number of video segments to crop
const targetWidth = 1080; // Desired width for Instagram Reel (9:16 aspect ratio)
const targetHeight = 1920; // Desired height for Instagram Reel
let episode = 1;

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to crop video into segments
function cropVideo() {
  const startTime = startVideoNumber * videoDuration;

  // Get the total duration of the input video
  ffmpeg.ffprobe(inputVideo, (err, metadata) => {
    if (err) {
      console.error('Error getting video metadata:', err);
      return;
    }

    const durationInSeconds = metadata.format.duration;
    const totalCropTime = videoQuantity * videoDuration;

    // Ensure the crop does not exceed video length
    if (startTime + totalCropTime > durationInSeconds) {
      console.error('Total crop time exceeds video duration.');
      return;
    }

    // Loop through each video segment
    for (let i = 0; i < videoQuantity; i++) {
      createSegment(i, startTime, durationInSeconds);
    }
  });
}

// Function to create a video segment
function createSegment(i, startTime, durationInSeconds) {
  const segmentStartTime = startTime + i * videoDuration;
  const segmentEndTime = Math.min(segmentStartTime + videoDuration, durationInSeconds);
  const outputFilename = `${outputDir}/${startVideoNumber + i}.mp4`;

  const text = ` Ep ${episode} Part ${startVideoNumber + i}`;

  ffmpeg(inputVideo)
    .inputOptions(['-ss', segmentStartTime, '-to', segmentEndTime])
    .input(beepAudio) // Add the beep audio input
    .videoCodec('libx265') // H.265 codec for better compression
    .audioCodec('aac')
    .audioChannels(2)
    .audioFrequency(48000)
    .outputOptions([
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      `-vf`, `drawtext=text='${text}':fontcolor=white:fontsize=80:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=50`,
      '-b:v', '1500k', // Lower video bitrate for smaller size
      '-maxrate', '1500k', // Lower maxrate to match bitrate
      '-bufsize', '3000k', // Adjust buffer size accordingly
      '-b:a', '64k', // Lower audio bitrate
    ])
    .complexFilter([ // Filter to mix video and audio
      '[0:a][1:a]amix=inputs=2:duration=shortest'
    ])
    .on('end', () => {
      console.log(`Segment ${startVideoNumber + i} created: ${outputFilename}`);
    })
    .on('error', (err) => {
      console.error(`Error creating segment ${startVideoNumber + i}:`, err);
    })
    .save(outputFilename);
}

// Start cropping
cropVideo();
