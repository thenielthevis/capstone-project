const GeoActivity = require("../models/geoActivityModel");
const { uploadGeoActivityIcon, uploadGeoActivityAnimation } = require('../utils/cloudinary');

// Create a new geo activity
exports.createGeoActivity = async (req, res) => {
  try {
    const { name, description, iconUrl, animationUrl, met } = req.body;
    let iconUploadResult = null;
    let animationUploadResult = null;
    if (iconUrl) {
      iconUploadResult = await uploadGeoActivityIcon(iconUrl);
    }
    if (animationUrl) {
        animationUploadResult = await uploadGeoActivityAnimation(animationUrl);
    }
    const newGeoActivity = new GeoActivity({
        name,
        description,
        icon: iconUploadResult ? iconUploadResult.secure_url : "",
        animation: animationUploadResult ? animationUploadResult.secure_url : "",
        met,
    });
    const savedGeoActivity = await newGeoActivity.save();
    res.status(201).json(savedGeoActivity);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all geo activities
exports.getAllGeoActivities = async (req, res) => {
  try {
    const geoActivities = await GeoActivity.find();
    res.status(200).json(geoActivities);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a geo activity by ID
exports.getGeoActivityById = async (req, res) => {
  try {
    const geoActivity = await GeoActivity.findById(req.params.id);
    if (!geoActivity) {
      return res.status(404).json({ message: "Geo Activity not found" });
    }
    res.status(200).json(geoActivity);
    } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update a geo activity
exports.updateGeoActivity = async (req, res) => {
    try {
    const { name, description, iconUrl, animationUrl, met } = req.body;
    const geoActivity = await GeoActivity.findById(req.params.id);
    if (!geoActivity) {
      return res.status(404).json({ message: "Geo Activity not found" });
    }
    if (iconUrl) {
      const iconUploadResult = await uploadGeoActivityIcon(iconUrl, geoActivity.icon);
      geoActivity.icon = iconUploadResult.secure_url;
    }
    if (animationUrl) {
      const animationUploadResult = await uploadGeoActivityAnimation(animationUrl, geoActivity.animation);
      geoActivity.animation = animationUploadResult.secure_url;
    }
    geoActivity.name = name || geoActivity.name;
    geoActivity.description = description || geoActivity.description;
    geoActivity.met = met || geoActivity.met;
    const updatedGeoActivity = await geoActivity.save();
    res.status(200).json(updatedGeoActivity);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a geo activity
exports.deleteGeoActivity = async (req, res) => {
  try {
    const geoActivity = await GeoActivity.findByIdAndDelete(req.params.id);
    if (!geoActivity) {
        return res.status(404).json({ message: "Geo Activity not found" });
    }
    res.status(200).json({ message: "Geo Activity deleted successfully" });
    } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};