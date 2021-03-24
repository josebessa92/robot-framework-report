import { Storage } from '@google-cloud/storage';
import * as path from 'path';

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

export async function uploadDirectory(bucketName, directoryPath, gzip, prefix) {
    const pathDirName = path.posix.dirname(directoryPath);
    // Get list of files in the directory.
    const filesList = await getFiles(directoryPath);

    const resp = await Promise.all(
        filesList.map(async (filePath) => {
            // Get relative path from directoryPath.
            let destination = `${path.posix.dirname(
                path.posix.relative(pathDirName, filePath),
            )}`;
            // If prefix is set, prepend.
            if (prefix) {
                destination = `${prefix}/${destination}`;
            }

            const uploadResp = await this.uploadFile(
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

export async function uploadFile(bucketName, filename, gzip, destination) {
    let storage = initializeStorage();

    const options = { gzip };
    if (destination) {
        // If obj prefix is set, then extract filename and append to prefix.
        options.destination = `${destination}/${path.posix.basename(filename)}`;
    }
    const uploadedFile = await storage.bucket(bucketName).upload(filename, options);

    return uploadedFile;
}

async function getFiles(directory, fileList) {
    const items = await fs.promises.readdir(directory);
    for (const item of items) {
        const stat = await fs.promises.stat(path.posix.join(directory, item));
        if (stat.isDirectory())
            fileList = await getFiles(path.posix.join(directory, item), fileList);
        else fileList.push(path.posix.join(directory, item));
    }
    return fileList;
}