const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { Canvas, loadImage } = require('canvas');
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfprobePath('/usr/bin/ffprobe');

// Function to stitch frames into a video with a soundtrack
async function stitchFramesToVideo(
  framesFilepath,
  soundtrackFilePath,
  outputFilepath,
  duration,
  frameRate,
) {
  await new Promise((resolve, reject) => {
    ffmpeg()

      // Input frame images
      .input(framesFilepath)
      .inputOptions([`-framerate ${frameRate}`])

      // Add soundtrack
      .input(soundtrackFilePath)
      .audioFilters([`afade=out:st=${duration - 2}:d=2`])

      // Video settings
      .videoCodec('libx264')
      .outputOptions(['-pix_fmt yuv420p'])

      // Set duration and frame rate
      .duration(duration)
      .fps(frameRate)

      // Output video file
      .saveToFile(outputFilepath)
      .on('end', () => resolve())
      .on('error', (error) => reject(new Error(error)));
  });
}

// Main function to render frames and create the video
async function createVideo() {
  // Tell fluent-ffmpeg where to find ffmpeg binary
  ffmpeg.setFfmpegPath(ffmpegStatic);

  // Clean up or create the required directories
  for (const path of ['out', 'tmp/output']) {
    if (fs.existsSync(path)) {
      await fs.promises.rm(path, { recursive: true });
    }
    await fs.promises.mkdir(path, { recursive: true });
  }

  const canvas = new Canvas(1280, 720);
  const context = canvas.getContext('2d');

  // Load the logo image
  const logo = await loadImage('assets/logo.svg');

  // Video parameters
  const duration = 3; // Duration of the video in seconds
  const frameRate = 60; // Frame rate of the video
  const frameCount = Math.floor(duration * frameRate);

  // Render each frame
  for (let i = 0; i < frameCount; i++) {
    const time = i / frameRate;
    console.log(`Rendering frame ${i} at ${Math.round(time * 10) / 10} seconds...`);

    // Clear the canvas
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the frame
    renderFrame(context, logo, duration, time);

    // Save the frame as a PNG file
    const output = canvas.toBuffer('image/png');
    const paddedNumber = String(i).padStart(4, '0');
    await fs.promises.writeFile(`tmp/output/frame-${paddedNumber}.png`, output);
  }

  // Stitch the frames together into a video
  await stitchFramesToVideo(
    'tmp/output/frame-%04d.png',
    'assets/catch-up-loop-119712.mp3',
    'out/video.mp4',
    duration,
    frameRate,
  );

  console.log('Video creation completed.');
}

// Helper function to render each frame
function renderFrame(context, logo, duration, time) {
  // Calculate animation progress from 0 to 1
  let t = time / duration;

  // Draw the logo moving from left to right
  context.drawImage(logo, 100 + (t * 550), 100, 500, 500);
}

// Run the video creation process
createVideo().catch((error) => {
  console.error('Error occurred during video creation:', error);
});
