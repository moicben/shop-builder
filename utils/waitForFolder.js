import fs from 'fs';
import path from 'path';

export function waitForFolder(folderPath, timeout, interval) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (fs.existsSync(folderPath)) {
        clearInterval(timer);
        return resolve(true);
      }
      if (Date.now() - start > timeout) {
        clearInterval(timer);
        return reject(new Error(`Timeout waiting for folder "${folderPath}"`));
      }
      console.log(`Waiting for folder "${folderPath}"...`);
    }, interval);
  });
}
