const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// ! total post 156 with current inputVideo
// Set path for ffprobe (change the path if needed)
ffmpeg.setFfprobePath('/usr/bin/ffprobe');

const inputVideo = 'input-video.mp4'; // Input video file
const outputDir = './postAssets/nft'; // Directory to store the output videos
const startVideoNumber = 10; // Start numbering from this video number
let videoNo = 1;
const videoDuration =30; // Duration of each video segment in seconds
const videoQuantity = 5; // Number of video segments to crop
const targetWidth = 1080; // Desired width for Instagram Reel (9:16 aspect ratio)
const targetHeight = 1920; // Desired height for Instagram Reel

let partNumber = 1;

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Function to crop video into segments based on user input
function cropVideo() {
  // Calculate start time based on startVideoNumber
  const startTime = startVideoNumber * videoDuration;

  // Get the total duration of the input video
  ffmpeg.ffprobe(inputVideo, (err, metadata) => {
    if (err) {
      console.error('Error getting video duration:', err);
      return;
    }

    const durationInSeconds = metadata.format.duration;

    // Ensure the startTime + total crop time does not exceed the video length
    const totalCropTime = videoQuantity * videoDuration;
    if (startTime + totalCropTime > durationInSeconds) {
      console.error('Total crop time exceeds video duration.');
      return;
    }

    // Calculate crop duration for each video segment
    const cropDurationPerSegment = videoDuration;

    // Loop through the video quantity to create each segment
    for (let i = 0; i < videoQuantity; i++) {
      const segmentStartTime = startTime + i * cropDurationPerSegment;
      const segmentEndTime = Math.min(segmentStartTime + cropDurationPerSegment, durationInSeconds);

      const outputFilename = `${outputDir}/${startVideoNumber + i}.mp4`;

      // Text for overlay
      const text = `Video no ${videoNo}, part no ${startVideoNumber+i}`;

      ffmpeg(inputVideo)
        .inputOptions(['-ss', segmentStartTime, '-to', segmentEndTime])
        .videoCodec('libx264') // H264 video codec
        .audioCodec('aac') // AAC audio codec
        .audioChannels(2) // Stereo sound
        .audioFrequency(48000) // 48 kHz sample rate
        .outputOptions([
          '-movflags', 'faststart', // Ensure moov atom is at the front for fast streaming
          '-pix_fmt', 'yuv420p', // 4:2:0 chroma subsampling
          '-r', '30', // Frame rate (30 FPS for Instagram Reels)
          `-vf`, `scale=${targetWidth}:${targetHeight},drawtext=text='${text}':fontcolor=white:fontsize=80:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=50`, // Adjust font size for better visibility and position it
          '-b:v', '3500k', // Video bitrate (3.5 Mbps for compression and quality)
          '-maxrate', '4000k', // Max video bitrate
          '-bufsize', '8000k', // Buffer size for rate control
          '-b:a', '128k' // Audio bitrate 128 kbps
        ])
        .on('end', () => {
          console.log(`Segment ${startVideoNumber + i} created: ${outputFilename}`);
        })
        .on('error', (err) => {
          console.error(`Error creating segment ${startVideoNumber + i}:`, err);
        })
        .save(outputFilename);
    }
  });
}

// Start the cropping process
cropVideo();
