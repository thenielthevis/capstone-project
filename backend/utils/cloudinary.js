const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadProfilePicture = async (imageUrl, publicId = null) => {
  return cloudinary.uploader.upload(imageUrl, {
    folder: "profile_pictures",
    public_id: publicId,
    overwrite: true,
  });
};