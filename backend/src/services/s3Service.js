const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION,
});

const S3_BUCKET = process.env.S3_BUCKET;

/**
 * Upload user avatar to S3
 * @param {string} userId - User ID
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{url: string}>} Avatar URL
 */
async function uploadAvatar(userId, fileBuffer, mimeType) {
  // Determine file extension from MIME type
  const extensionMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  const extension = extensionMap[mimeType] || 'png';
  const key = `avatars/${userId}.${extension}`;

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    // ACL removed - will use bucket default permissions
  };

  try {
    await s3.putObject(params).promise();

    // Construct the public URL
    const region = process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION;
    const url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    return { url };
  } catch (error) {
    const err = new Error('Failed to upload avatar');
    err.code = 'S3_UPLOAD_ERROR';
    err.statusCode = 500;
    err.details = error.message;
    throw err;
  }
}

/**
 * Upload task plan export to S3
 * @param {string} taskId - Task ID
 * @param {Buffer} jsonBuffer - JSON buffer
 * @returns {Promise<{url: string}>} Export file URL
 */
async function uploadExport(taskId, jsonBuffer) {
  const key = `exports/${taskId}.json`;

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: jsonBuffer,
    ContentType: 'application/json',
    ACL: 'public-read',
  };

  try {
    await s3.putObject(params).promise();

    // Construct the public URL
    const region = process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION;
    const url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    return { url };
  } catch (error) {
    const err = new Error('Failed to upload export');
    err.code = 'S3_UPLOAD_ERROR';
    err.statusCode = 500;
    err.details = error.message;
    throw err;
  }
}

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
async function deleteFile(key) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    const err = new Error('Failed to delete file');
    err.code = 'S3_DELETE_ERROR';
    err.statusCode = 500;
    err.details = error.message;
    throw err;
  }
}

/**
 * Check if a file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
async function fileExists(key) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

module.exports = {
  uploadAvatar,
  uploadExport,
  deleteFile,
  fileExists,
};
