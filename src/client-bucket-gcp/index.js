const fs = require('fs');
const { uploadFile, uploadDirectory } = require('./upload-helper');

async function uploadBucketGCP(destination, path, gzip) {
    let bucketName = destination;
    let prefix = '';
    // If destination of the form my-bucket/subfolder get bucket and prefix.
    const idx = destination.indexOf('/');
    if (idx > -1) {
      bucketName = destination.substring(0, idx);
      prefix = destination.substring(idx + 1);
    }

    const stat = await fs.promises.stat(path);
    if (stat.isFile()) {
      const uploadedFile = await uploadFile(bucketName, path, gzip, prefix);
      return [uploadedFile];
    } else {
      const uploadedFiles = await uploadDirectory(bucketName, path, gzip, prefix);
      return uploadedFiles;
    }
  } 