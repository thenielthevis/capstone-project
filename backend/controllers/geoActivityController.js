const GeoActivity = require("../models/geoActivityModel");
const { uploadGeoActivityIcon, uploadGeoActivityAnimation } = require('../utils/cloudinary');

// Create a new geo activity
exports.createGeoActivity = async (req, res) => {
  try {
    const { name, description, met } = req.body;
    const iconFile = req.files?.icon?.[0];
    const animationFile = req.files?.animation?.[0];

    console.log('[CREATE GEO ACTIVITY] Request body:', { name, description, met });
    console.log('[CREATE GEO ACTIVITY] Files:', { 
      hasIcon: !!iconFile, 
      hasAnimation: !!animationFile 
    });

    let iconUploadResult = null;
    let animationUploadResult = null;

    if (iconFile) {
      console.log('[CREATE GEO ACTIVITY] Uploading icon...');
      iconUploadResult = await uploadGeoActivityIcon(iconFile.buffer);
      console.log('[CREATE GEO ACTIVITY] Icon uploaded:', iconUploadResult.secure_url);
    }

    if (animationFile) {
      console.log('[CREATE GEO ACTIVITY] Uploading animation...');
      animationUploadResult = await uploadGeoActivityAnimation(animationFile.buffer);
      console.log('[CREATE GEO ACTIVITY] Animation uploaded:', animationUploadResult.secure_url);
    }

    const newGeoActivity = new GeoActivity({
      name,
      description: description || '',
      icon: iconUploadResult ? iconUploadResult.secure_url : '',
      animation: animationUploadResult ? animationUploadResult.secure_url : '',
      met: met || 0,
    });

    const savedGeoActivity = await newGeoActivity.save();
    console.log('[CREATE GEO ACTIVITY] Saved:', savedGeoActivity);
    res.status(201).json(savedGeoActivity);
  } catch (error) {
    console.error('[CREATE GEO ACTIVITY] Error:', error);
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
    console.log('[UPDATE GEO ACTIVITY] Starting update for ID:', req.params.id);
    console.log('[UPDATE GEO ACTIVITY] Request user:', req.user);
    console.log('[UPDATE GEO ACTIVITY] Request body fields:', Object.keys(req.body));
    console.log('[UPDATE GEO ACTIVITY] Request files:', Object.keys(req.files || {}));
    
    const { name, description, met } = req.body;
    
    console.log('[UPDATE GEO ACTIVITY] Parsed fields:', { name, description, met });

    const geoActivity = await GeoActivity.findById(req.params.id);
    if (!geoActivity) {
      console.log('[UPDATE GEO ACTIVITY] Activity not found with ID:', req.params.id);
      return res.status(404).json({ message: "Geo Activity not found" });
    }

    console.log('[UPDATE GEO ACTIVITY] Found existing activity:', geoActivity._id);

    const iconFile = req.files?.icon?.[0];
    const animationFile = req.files?.animation?.[0];

    console.log('[UPDATE GEO ACTIVITY] Files received:', { 
      hasIcon: !!iconFile, 
      hasAnimation: !!animationFile 
    });

    // Only update icon if new file is provided
    if (iconFile) {
      console.log('[UPDATE GEO ACTIVITY] Uploading new icon...');
      const iconUploadResult = await uploadGeoActivityIcon(iconFile.buffer);
      geoActivity.icon = iconUploadResult.secure_url;
      console.log('[UPDATE GEO ACTIVITY] Icon uploaded:', geoActivity.icon);
    }

    // Only update animation if new file is provided
    if (animationFile) {
      console.log('[UPDATE GEO ACTIVITY] Uploading new animation...');
      const animationUploadResult = await uploadGeoActivityAnimation(animationFile.buffer);
      geoActivity.animation = animationUploadResult.secure_url;
      console.log('[UPDATE GEO ACTIVITY] Animation uploaded:', geoActivity.animation);
    }

    // Update text fields
    if (name) {
      geoActivity.name = name;
      console.log('[UPDATE GEO ACTIVITY] Updated name to:', geoActivity.name);
    }
    if (description) {
      geoActivity.description = description;
      console.log('[UPDATE GEO ACTIVITY] Updated description to:', geoActivity.description);
    }
    if (typeof met !== "undefined" && met !== null) {
      geoActivity.met = met;
      console.log('[UPDATE GEO ACTIVITY] Updated met to:', geoActivity.met);
    }

    console.log('[UPDATE GEO ACTIVITY] Saving to database...');
    const updatedGeoActivity = await geoActivity.save();
    console.log('[UPDATE GEO ACTIVITY] Successfully saved:', updatedGeoActivity);
    
    res.status(200).json(updatedGeoActivity);
  } catch (error) {
    console.error('[UPDATE GEO ACTIVITY] Error occurred:', error.message);
    console.error('[UPDATE GEO ACTIVITY] Full error:', error);
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