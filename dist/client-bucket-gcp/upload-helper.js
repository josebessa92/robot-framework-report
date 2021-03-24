"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.uploadDirectory = void 0;
const fs = require('fs').promises;
const path = require('path');
const { Storage } = require('@google-cloud/storage');
function initializeStorage() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function getFiles(directory, fileList = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = yield fs.readdir(directory);
        for (const item of items) {
            const stat = yield fs.stat(path.posix.join(directory, item));
            if (stat.isDirectory())
                fileList = yield getFiles(path.posix.join(directory, item), fileList);
            else
                fileList.push(path.posix.join(directory, item));
        }
        return fileList;
    });
}
const uploadDirectory = (bucketName, directoryPath, gzip, prefix) => __awaiter(void 0, void 0, void 0, function* () {
    const pathDirName = path.posix.dirname(directoryPath);
    // Get list of files in the directory.
    const filesList = yield getFiles(directoryPath);
    const resp = yield Promise.all(filesList.map((filePath) => __awaiter(void 0, void 0, void 0, function* () {
        // Get relative path from directoryPath.
        let destination = `${path.posix.dirname(path.posix.relative(pathDirName, filePath))}`;
        // If prefix is set, prepend.
        if (prefix) {
            destination = `${prefix}/${destination}`;
        }
        const uploadResp = yield uploadFile(bucketName, filePath, gzip, destination);
        return uploadResp;
    })));
    return resp;
});
exports.uploadDirectory = uploadDirectory;
const uploadFile = (bucketName, filename, gzip, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const optionsStorage = {
        userAgent: 'github-actions-upload-cloud-storage/0.2.0',
    };
    let storage = new Storage(optionsStorage);
    const options = { gzip };
    if (destination) {
        // If obj prefix is set, then extract filename and append to prefix.
        options.destination = `${destination}/${path.posix.basename(filename)}`;
    }
    console.log('Uploading Files...', storage);
    console.log('Bucket Name...', bucketName);
    console.log('Filename...', filename);
    const uploadedFile = yield storage.bucket(bucketName).upload(filename, options);
    return uploadedFile;
});
exports.uploadFile = uploadFile;
