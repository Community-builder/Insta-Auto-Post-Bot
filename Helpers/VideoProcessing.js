const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Function to crop video into segments
async function cropVideo(inputVideo, outputDir, beepAudio, VideoNumber, videoDuration, videoQuantity, episode) {
  const startTime = VideoNumber * videoDuration;

  // Get the total duration of the input video
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputVideo, (err, metadata) => {
      if (err) {
        console.error('Error getting video metadata:', err);
        reject(err);
        return;
      }

      const durationInSeconds = metadata.format.duration;
      const totalCropTime = videoQuantity * videoDuration;

      // Ensure the crop does not exceed video length
      if (startTime + totalCropTime > durationInSeconds) {
        console.error('Total crop time exceeds video duration.');
        reject('Total crop time exceeds video duration.');
        return;
      }

      // Create an array of promises for each segment
      const cropPromises = [];
      for (let i = 0; i < videoQuantity; i++) {
        cropPromises.push(createSegment(i, startTime, durationInSeconds, inputVideo, outputDir, beepAudio, VideoNumber, videoDuration, episode));
      }

      // Wait for all segments to finish processing
      Promise.all(cropPromises)
        .then(() => {
          console.log('All video segments have been created.');
          resolve();
        })
        .catch((err) => {
          console.error('Error during video cropping:', err);
          reject(err);
        });
    });
  });
}

// Function to create a video segment
function createSegment(i, startTime, durationInSeconds, inputVideo, outputDir, beepAudio, VideoNumber, videoDuration, episode) {
  const segmentStartTime = startTime + i * videoDuration;
  const segmentEndTime = Math.min(segmentStartTime + videoDuration, durationInSeconds);
  const outputFilename = path.join(outputDir, `${VideoNumber}.mp4`);
  const previousFilename = path.join(outputDir, `${VideoNumber - 1}.mp4`);

  const text = ` Ep ${episode} Part ${VideoNumber + i}`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputVideo)
      .inputOptions(['-ss', segmentStartTime, '-to', segmentEndTime])
      .input(beepAudio)  // Add the beep audio input
      .videoCodec('libx265')  // H.265 codec for better compression
      .audioCodec('aac')
      .audioChannels(2)
      .audioFrequency(48000)
      .outputOptions([
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        `-vf`, `drawtext=text='${text}':fontcolor=white:fontsize=80:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=50`,
        '-b:v', '1500k',  // Lower video bitrate for smaller size
        '-maxrate', '1500k',  // Lower maxrate to match bitrate
        '-bufsize', '3000k',  // Adjust buffer size accordingly
        '-b:a', '64k',  // Lower audio bitrate
      ])
      .complexFilter([  // Filter to mix video and audio
        '[0:a][1:a]amix=inputs=2:duration=shortest'
      ])
      .on('end', () => {
        console.log(`Segment ${VideoNumber } created: ${outputFilename}`);

        // Check if the previous video exists and delete it
        if (fs.existsSync(previousFilename)) {
          fs.unlink(previousFilename, (err) => {
            if (err) {
              console.error(`Error deleting file ${previousFilename}:`, err);
            } else {
              console.log(`Deleted previous video: ${previousFilename}`);
            }
          });
        }

        resolve();
      })
      .on('error', (err) => {
        console.error(`Error creating segment ${VideoNumber + i}:`, err);
        reject(err);
      })
      .save(outputFilename);
  });
}

// Export the cropVideo function
module.exports = {
  cropVideo,
};
