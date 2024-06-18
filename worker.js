// worker.js

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';

if (!isMainThread) {
  const { fileId, filePath, sizes } = workerData;

  // Function to generate a single thumbnail of specified size
  const generateThumbnail = async (inputPath, outputPath, size) => {
    try {
      const thumbnail = await imageThumbnail(inputPath, { width: size });
      fs.writeFileSync(outputPath, thumbnail);
      console.log(`Generated ${size}px thumbnail for file ${fileId}`);
    } catch (error) {
      console.error(`Error generating ${size}px thumbnail:`, error);
      throw new Error(`Failed to generate ${size}px thumbnail`);
    }
  };

  // Generate thumbnails for each size in parallel
  const generateThumbnails = async () => {
    try {
      const promises = sizes.map(size => {
        const thumbnailPath = `${filePath}_${size}`;
        return generateThumbnail(filePath, thumbnailPath, size);
      });

      await Promise.all(promises);
      console.log(`All thumbnails generated for file ${fileId}`);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    }
  };

  // Start generating thumbnails
  generateThumbnails().catch(err => console.error('Error in worker:', err));
}
