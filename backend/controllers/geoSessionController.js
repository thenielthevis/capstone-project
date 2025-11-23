const GeoSession = require("../models/geoSessionModel");
const GeoActivity = require("../models/geoActivityModel");
const User = require("../models/userModel");

// Create a new geo session
exports.createGeoSession = async (req, res) => {
  try {
    const { userId, activities, total_distance_km, total_duration_minutes, calories_burned, route } = req.body;

    const newGeoSession = new GeoSession({
        user_id: userId,
        activities,
        total_distance_km,
        total_duration_minutes,
        calories_burned,
        route_coordinates: route,
    });
    const savedGeoSession = await newGeoSession.save();
    res.status(201).json(savedGeoSession);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all geo sessions
exports.getAllGeoSessions = async (req, res) => {
  try {
    const geoSessions = await GeoSession.find();
    res.status(200).json(geoSessions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a geo session by ID
exports.getGeoSessionById = async (req, res) => {
  try {
    const geoSession = await GeoSession.findById(req.params.id);
    if (!geoSession) {
      return res.status(404).json({ message: "Geo Session not found" });
    }
    res.status(200).json(geoSession);
    } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};