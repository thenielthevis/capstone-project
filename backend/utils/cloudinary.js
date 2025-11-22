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

const uploadBufferStream = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.uploadWorkoutAnimation = (fileBuffer, publicId = null) => {
  return uploadBufferStream(fileBuffer, {
    folder: "workout_animations",
    public_id: publicId,
    overwrite: true,
    resource_type: "raw",
  });
};

exports.uploadGeoActivityIcon = async (fileSource, publicId = null) => {
  const options = {
    folder: "geo_activity_icons",
    public_id: publicId,
    overwrite: true,
  };

  if (fileSource && Buffer.isBuffer(fileSource)) {
    return uploadBufferStream(fileSource, options);
  }

  return cloudinary.uploader.upload(fileSource, options);
};

exports.uploadGeoActivityAnimation = async (fileSource, publicId = null) => {
  const options = {
    folder: "geo_activity_animations",
    public_id: publicId,
    overwrite: true,
  };

  if (fileSource && Buffer.isBuffer(fileSource)) {
    return uploadBufferStream(fileSource, options);
  }

  return cloudinary.uploader.upload(fileSource, options);
};

exports.deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};