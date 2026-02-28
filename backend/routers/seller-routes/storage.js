const cloudinary = require('cloudinary').v2;
const multer = require('multer');
let storage = null;

if (process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET) {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
    });

    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'FDFED',
            allowedFormats: ['jpeg', 'png', 'jpg'],
        },
    });
} else {
    // Fallback to local disk storage (uploads/)
    const diskStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            const ext = file.originalname.split('.').pop();
            const name = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;
            cb(null, name);
        }
    });
    storage = diskStorage;
}

module.exports = {
    cloudinary,
    storage,
};