const fs = require('fs').promises;

const path = require('path');

const { Storage } = require('@google-cloud/storage');

async function initializeStorage() {
    const options = {
        userAgent: 'github-actions-upload-cloud-storage/0.2.0',
    };

    // if (opts.credentials) {
    //     // If the credentials are not JSON, they are probably base64-encoded. Even
    //     // though we don't instruct users to provide base64-encoded credentials,
    //     // sometimes they still do.
    //     if (!opts.credentials.trim().startsWith('{')) {
    //         const creds = opts.credentials;
    //         opts.credentials = Buffer.from(creds, 'base64').toString('utf8');
    //     }
    //     const creds = JSON.parse(opts.credentials);
    //     options.credentials = creds;
    // }

    return new Storage(options);
}

async function getFiles(directory: any, fileList: any[] = []) {
    const items = await fs.promises.readdir(directory);
    for (const item of items) {
        const stat = await fs.promises.stat(path.posix.join(directory, item));
        if (stat.isDirectory())
            fileList = await getFiles(path.posix.join(directory, item), fileList);
        else fileList.push(path.posix.join(directory, item));
    }
    return fileList;
}

const uploadDirectory = async (bucketName: any, directoryPath: any, gzip: any, prefix: any) => {
    const pathDirName = path.posix.dirname(directoryPath);
    // Get list of files in the directory.
    const filesList = await getFiles(directoryPath);

    const resp = await Promise.all(
        filesList.map(async (filePath: any) => {
            // Get relative path from directoryPath.
            let destination = `${path.posix.dirname(
                path.posix.relative(pathDirName, filePath),
            )}`;
            // If prefix is set, prepend.
            if (prefix) {
                destination = `${prefix}/${destination}`;
            }

            const uploadResp = await uploadFile(
                bucketName,
                filePath,
                gzip,
                destination,
            );
            return uploadResp;
        }),
    );
    return resp;
}

const uploadFile = async (bucketName: any, filename: any, gzip: any, destination: any) => {
    let storage: any = initializeStorage();

    const options: any = { gzip };
    if (destination) {
        // If obj prefix is set, then extract filename and append to prefix.
        options.destination = `${destination}/${path.posix.basename(filename)}`;
    }
    const uploadedFile = await storage.bucket(bucketName).upload(filename, options);

    return uploadedFile;
}

export {
    uploadDirectory,
    uploadFile
}