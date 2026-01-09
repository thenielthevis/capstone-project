const Report = require('../models/reportModel');
const Post = require('../models/postModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');

// Create a new report
exports.createReport = async (req, res) => {
    try {
        const { reportType, itemId, reason, description } = req.body;
        const reporterId = req.user.id;

        // Validate required fields
        if (!reportType || !itemId || !reason) {
            return res.status(400).json({
                message: 'Report type, item ID, and reason are required',
            });
        }

        // Check if the item exists and get content snapshot
        let contentSnapshot = {};
        let reportedUserId = null;
        let itemType = '';

        switch (reportType) {
            case 'post':
                const post = await Post.findById(itemId).populate('user', 'username email');
                if (!post) {
                    return res.status(404).json({ message: 'Post not found' });
                }
                itemType = 'Post';
                reportedUserId = post.user._id;
                contentSnapshot = {
                    title: post.title,
                    content: post.content,
                    images: post.images,
                    authorUsername: post.user.username,
                    authorEmail: post.user.email,
                };
                break;

            case 'message':
                const message = await Message.findById(itemId).populate('sender', 'username email');
                if (!message) {
                    return res.status(404).json({ message: 'Message not found' });
                }
                itemType = 'Message';
                reportedUserId = message.sender._id;
                contentSnapshot = {
                    content: message.content,
                    senderUsername: message.sender.username,
                    senderEmail: message.sender.email,
                };
                break;

            case 'user':
                const user = await User.findById(itemId).select('username email profilePicture');
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                itemType = 'User';
                reportedUserId = user._id;
                contentSnapshot = {
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture,
                };
                break;

            default:
                return res.status(400).json({ message: 'Invalid report type' });
        }

        // Check if user already reported this item
        const existingReport = await Report.findOne({
            reporter: reporterId,
            'reportedItem.itemId': itemId,
            status: { $in: ['pending', 'reviewed'] },
        });

        if (existingReport) {
            return res.status(400).json({
                message: 'You have already reported this item',
            });
        }

        // Create the report
        const report = new Report({
            reporter: reporterId,
            reportType,
            reportedItem: {
                itemId,
                itemType,
            },
            reportedUser: reportedUserId,
            reason,
            description,
            contentSnapshot,
        });

        await report.save();

        res.status(201).json({
            message: 'Report submitted successfully',
            report: {
                _id: report._id,
                reportType: report.reportType,
                reason: report.reason,
                status: report.status,
                createdAt: report.createdAt,
            },
        });
    } catch (error) {
        console.error('[createReport] Error:', error);
        res.status(500).json({ message: 'Failed to submit report', error: error.message });
    }
};

// Get all reports (Admin only)
exports.getAllReports = async (req, res) => {
    try {
        const { 
            reportType, 
            status, 
            reason, 
            page = 1, 
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc' 
        } = req.query;

        const query = {};

        if (reportType) {
            query.reportType = reportType;
        }
        if (status) {
            query.status = status;
        }
        if (reason) {
            query.reason = reason;
        }

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const reports = await Report.find(query)
            .populate('reporter', 'username email profilePicture')
            .populate('reportedUser', 'username email profilePicture')
            .populate('resolution.resolvedBy', 'username email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);

        const total = await Report.countDocuments(query);

        // Get counts by status for dashboard
        const statusCounts = await Report.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const statusCountMap = statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json({
            reports,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
            statusCounts: {
                pending: statusCountMap.pending || 0,
                reviewed: statusCountMap.reviewed || 0,
                resolved: statusCountMap.resolved || 0,
                dismissed: statusCountMap.dismissed || 0,
            },
        });
    } catch (error) {
        console.error('[getAllReports] Error:', error);
        res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
};

// Get a single report by ID (Admin only)
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id)
            .populate('reporter', 'username email profilePicture')
            .populate('reportedUser', 'username email profilePicture role')
            .populate('resolution.resolvedBy', 'username email');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Fetch the current state of the reported item
        let currentItemState = null;
        try {
            switch (report.reportType) {
                case 'post':
                    currentItemState = await Post.findById(report.reportedItem.itemId)
                        .populate('user', 'username email');
                    break;
                case 'message':
                    currentItemState = await Message.findById(report.reportedItem.itemId)
                        .populate('sender', 'username email');
                    break;
                case 'user':
                    currentItemState = await User.findById(report.reportedItem.itemId)
                        .select('username email profilePicture role verified');
                    break;
            }
        } catch (e) {
            // Item may have been deleted
            currentItemState = null;
        }

        res.status(200).json({
            report,
            currentItemState,
            itemDeleted: !currentItemState,
        });
    } catch (error) {
        console.error('[getReportById] Error:', error);
        res.status(500).json({ message: 'Failed to fetch report', error: error.message });
    }
};

// Update report status (Admin only)
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, action, notes } = req.body;
        const adminId = req.user.id;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Update status
        if (status) {
            report.status = status;
        }

        // If resolving, add resolution details
        if (status === 'resolved' || status === 'dismissed') {
            report.resolution = {
                action: action || 'no_action',
                notes: notes || '',
                resolvedBy: adminId,
                resolvedAt: new Date(),
            };
        }

        await report.save();

        // Populate for response
        await report.populate('reporter', 'username email profilePicture');
        await report.populate('reportedUser', 'username email profilePicture');
        await report.populate('resolution.resolvedBy', 'username email');

        res.status(200).json({
            message: 'Report updated successfully',
            report,
        });
    } catch (error) {
        console.error('[updateReportStatus] Error:', error);
        res.status(500).json({ message: 'Failed to update report', error: error.message });
    }
};

// Take action on reported content (Admin only)
exports.takeAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, notes } = req.body;
        const adminId = req.user.id;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        let actionResult = { success: false, message: '' };

        switch (action) {
            case 'content_removed':
                // Delete the reported content
                if (report.reportType === 'post') {
                    await Post.findByIdAndDelete(report.reportedItem.itemId);
                    actionResult = { success: true, message: 'Post removed successfully' };
                } else if (report.reportType === 'message') {
                    await Message.findByIdAndDelete(report.reportedItem.itemId);
                    actionResult = { success: true, message: 'Message removed successfully' };
                } else {
                    actionResult = { success: false, message: 'Cannot remove user content this way' };
                }
                break;

            case 'user_suspended':
                // Suspend the reported user (set verified to false)
                if (report.reportedUser) {
                    await User.findByIdAndUpdate(report.reportedUser, {
                        verified: false,
                        $set: { 'suspension.isSuspended': true, 'suspension.reason': notes },
                    });
                    actionResult = { success: true, message: 'User suspended successfully' };
                }
                break;

            case 'user_banned':
                // Ban the reported user (you might want to add a banned field)
                if (report.reportedUser) {
                    await User.findByIdAndUpdate(report.reportedUser, {
                        role: 'banned',
                        verified: false,
                    });
                    actionResult = { success: true, message: 'User banned successfully' };
                }
                break;

            case 'warning_issued':
                // Log warning (could be extended to send notification to user)
                actionResult = { success: true, message: 'Warning logged' };
                break;

            case 'no_action':
                actionResult = { success: true, message: 'No action taken' };
                break;

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        // Update report with resolution
        report.status = 'resolved';
        report.resolution = {
            action,
            notes: notes || '',
            resolvedBy: adminId,
            resolvedAt: new Date(),
        };
        await report.save();

        await report.populate('resolution.resolvedBy', 'username email');

        res.status(200).json({
            message: actionResult.message,
            success: actionResult.success,
            report,
        });
    } catch (error) {
        console.error('[takeAction] Error:', error);
        res.status(500).json({ message: 'Failed to take action', error: error.message });
    }
};

// Get report statistics (Admin only)
exports.getReportStats = async (req, res) => {
    try {
        // Overall counts
        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });
        const dismissedReports = await Report.countDocuments({ status: 'dismissed' });

        // Counts by type
        const byType = await Report.aggregate([
            { $group: { _id: '$reportType', count: { $sum: 1 } } },
        ]);

        // Counts by reason
        const byReason = await Report.aggregate([
            { $group: { _id: '$reason', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Recent reports (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReports = await Report.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
        });

        // Top reported users
        const topReportedUsers = await Report.aggregate([
            { $match: { reportedUser: { $ne: null } } },
            { $group: { _id: '$reportedUser', reportCount: { $sum: 1 } } },
            { $sort: { reportCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    reportCount: 1,
                    username: '$user.username',
                    email: '$user.email',
                    profilePicture: '$user.profilePicture',
                },
            },
        ]);

        res.status(200).json({
            totalReports,
            pendingReports,
            resolvedReports,
            dismissedReports,
            recentReports,
            byType: byType.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byReason: byReason.map((r) => ({ reason: r._id, count: r.count })),
            topReportedUsers,
        });
    } catch (error) {
        console.error('[getReportStats] Error:', error);
        res.status(500).json({ message: 'Failed to fetch report statistics', error: error.message });
    }
};

// Delete a report (Admin only)
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByIdAndDelete(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('[deleteReport] Error:', error);
        res.status(500).json({ message: 'Failed to delete report', error: error.message });
    }
};

// Bulk update reports (Admin only)
exports.bulkUpdateReports = async (req, res) => {
    try {
        const { reportIds, status, action, notes } = req.body;
        const adminId = req.user.id;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({ message: 'Report IDs are required' });
        }

        const updateData = { status };
        if (status === 'resolved' || status === 'dismissed') {
            updateData.resolution = {
                action: action || 'no_action',
                notes: notes || '',
                resolvedBy: adminId,
                resolvedAt: new Date(),
            };
        }

        const result = await Report.updateMany(
            { _id: { $in: reportIds } },
            { $set: updateData }
        );

        res.status(200).json({
            message: `${result.modifiedCount} reports updated successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('[bulkUpdateReports] Error:', error);
        res.status(500).json({ message: 'Failed to bulk update reports', error: error.message });
    }
};
