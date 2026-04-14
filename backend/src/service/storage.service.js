const ImageKit = require("@imagekit/nodejs");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile(file) {
    if (!file || !file.buffer) {
        throw new Error('File object must contain buffer property');
    }

    const uploadPromise = imagekit.files.upload({
        file: file.buffer.toString('base64'),
        fileName: file.originalname || 'unnamed-upload',
        folder: '/songs',
        useUniqueFileName: true,
    });

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('File upload timed out after 20 seconds')), 20000);
    });

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result;
}

module.exports = uploadFile;