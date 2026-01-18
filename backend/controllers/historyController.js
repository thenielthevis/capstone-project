const ProgramSession = require("../models/programSessionModel");
const GeoSession = require("../models/geoSessionModel");
const Post = require("../models/postModel");

// Get combined history of Program Sessions and Geo Sessions
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Fetch Program Sessions
        const programSessionsPromise = ProgramSession.find({ user_id: userId })
            .populate("workouts.workout_id")
            .populate("geo_activities.activity_id")
            .lean();

        // Fetch Geo Sessions
        const geoSessionsPromise = GeoSession.find({ user_id: userId })
            .populate("activity_type")
            .lean();

        const [programSessions, geoSessions] = await Promise.all([
            programSessionsPromise,
            geoSessionsPromise
        ]);

        // Tag and Combine
        const taggedProgramSessions = programSessions.map(session => ({
            ...session,
            type: "ProgramSession",
            sortDate: new Date(session.performed_at)
        }));

        const taggedGeoSessions = geoSessions.map(session => ({
            ...session,
            type: "GeoSession",
            sortDate: new Date(session.started_at)
        }));

        const combinedHistory = [...taggedProgramSessions, ...taggedGeoSessions];

        // Sort by date descending
        combinedHistory.sort((a, b) => b.sortDate - a.sortDate);

        // Pagination
        const paginatedHistory = combinedHistory.slice(skip, skip + limit);
        const totalItems = combinedHistory.length;
        const totalPages = Math.ceil(totalItems / limit);

        // Check if items are already posted
        const historyWithPostStatus = await Promise.all(paginatedHistory.map(async (item) => {
            const existingPost = await Post.findOne({
                "reference.item_id": item._id,
                "reference.item_type": item.type
            }).select("_id");

            return {
                ...item,
                isPosted: !!existingPost
            };
        }));

        res.status(200).json({
            data: historyWithPostStatus,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        });

    } catch (error) {
        console.error("[GET HISTORY] Error:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
