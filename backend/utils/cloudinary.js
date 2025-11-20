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

exports.uploadWorkoutAnimation = (fileBuffer, publicId = null) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "workout_animations", public_id: publicId, overwrite: true, resource_type: 'raw' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.geoActivityIcon = async (iconUrl, publicId = null) => {
  return cloudinary.uploader.upload(iconUrl, {
    folder: "geo_activity_icons",
    public_id: publicId,
    overwrite: true,
  });
};

exports.geoActivityAnimation = async (animationUrl, publicId = null) => {
  return cloudinary.uploader.upload(animationUrl, {
    folder: "geo_activity_animations",
    public_id: publicId,
    overwrite: true,
  });
};

exports.deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};