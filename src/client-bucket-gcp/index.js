/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
import { uploadFile, uploadDirectory } from './upload-helper';

export async function uploadBucketGCP(destination, path, gzip) {
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