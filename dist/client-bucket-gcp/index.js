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
const fs = require('fs').promises;
const upload_helper_1 = require("./upload-helper");
function uploadBucketGCP(destination, path, gzip) {
    return __awaiter(this, void 0, void 0, function* () {
        let bucketName = destination;
        let prefix = '';
        // If destination of the form my-bucket/subfolder get bucket and prefix.
        const idx = destination.indexOf('/');
        if (idx > -1) {
            bucketName = destination.substring(0, idx);
            prefix = destination.substring(idx + 1);
        }
        const stat = yield fs.stat(path);
        if (stat.isFile()) {
            const uploadedFile = yield upload_helper_1.uploadFile(bucketName, path, gzip, prefix);
            return [uploadedFile];
        }
        else {
            const uploadedFiles = yield upload_helper_1.uploadDirectory(bucketName, path, gzip, prefix);
            return uploadedFiles;
        }
    });
}
exports.default = uploadBucketGCP;
