/**
 * Statistical Helper Functions
 * Core functions for calculating averages, trends, patterns, and correlations
 * Used by the Feedback Trigger Engine to evaluate health data patterns
 */

/**
 * Calculate the average of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} - Average value, or 0 if empty
 */
const calculateAverage = (values) => {
    if (!values || values.length === 0) return 0;
    const validValues = values.filter(v => v != null && !isNaN(v));
    if (validValues.length === 0) return 0;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
};

/**
 * Calculate the standard deviation of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} - Standard deviation, or 0 if empty
 */
const calculateStandardDeviation = (values) => {
    if (!values || values.length < 2) return 0;
    const validValues = values.filter(v => v != null && !isNaN(v));
    if (validValues.length < 2) return 0;

    const avg = calculateAverage(validValues);
    const squareDiffs = validValues.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
};

/**
 * Calculate weekday average from entries
 * @param {Object[]} entries - Array of health checkup entries
 * @param {Function} getValue - Function to extract value from entry
 * @returns {number} - Weekday average
 */
const calculateWeekdayAverage = (entries, getValue) => {
    const weekdayEntries = entries.filter(entry => {
        const date = new Date(entry.date);
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday to Friday
    });

    const values = weekdayEntries.map(getValue).filter(v => v != null && !isNaN(v));
    return calculateAverage(values);
};

/**
 * Calculate weekend average from entries
 * @param {Object[]} entries - Array of health checkup entries
 * @param {Function} getValue - Function to extract value from entry
 * @returns {number} - Weekend average
 */
const calculateWeekendAverage = (entries, getValue) => {
    const weekendEntries = entries.filter(entry => {
        const date = new Date(entry.date);
        const day = date.getDay();
        return day === 0 || day === 6; // Saturday and Sunday
    });

    const values = weekendEntries.map(getValue).filter(v => v != null && !isNaN(v));
    return calculateAverage(values);
};

/**
 * Calculate trend direction from values
 * @param {number[]} values - Array of values in chronological order
 * @param {number} threshold - Minimum percentage change to detect trend (default 5%)
 * @returns {string} - 'increasing', 'decreasing', or 'stable'
 */
const calculateTrend = (values, threshold = 0.05) => {
    if (!values || values.length < 2) return 'stable';

    const validValues = values.filter(v => v != null && !isNaN(v));
    if (validValues.length < 2) return 'stable';

    // Compare first half average vs second half average
    const midpoint = Math.floor(validValues.length / 2);
    const firstHalf = validValues.slice(0, midpoint);
    const secondHalf = validValues.slice(midpoint);

    const firstAvg = calculateAverage(firstHalf);
    const secondAvg = calculateAverage(secondHalf);

    if (firstAvg === 0) return secondAvg > 0 ? 'increasing' : 'stable';

    const percentChange = (secondAvg - firstAvg) / Math.abs(firstAvg);

    if (percentChange > threshold) return 'increasing';
    if (percentChange < -threshold) return 'decreasing';
    return 'stable';
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} - Percentage change (e.g., 0.15 for 15% increase)
 */
const calculatePercentageChange = (current, previous) => {
    if (previous === 0 || previous == null) return current > 0 ? 1 : 0;
    return (current - previous) / Math.abs(previous);
};

/**
 * Calculate consecutive days meeting a condition
 * @param {Object[]} entries - Array of entries sorted by date (most recent first)
 * @param {Function} checkFn - Function to check if entry meets condition
 * @returns {number} - Number of consecutive days
 */
const calculateStreak = (entries, checkFn) => {
    if (!entries || entries.length === 0) return 0;

    let streak = 0;
    for (const entry of entries) {
        if (checkFn(entry)) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

/**
 * Count days meeting a condition in a period
 * @param {Object[]} entries - Array of entries
 * @param {Function} checkFn - Function to check if entry meets condition
 * @returns {number} - Number of days meeting condition
 */
const countDaysMeetingCondition = (entries, checkFn) => {
    if (!entries || entries.length === 0) return 0;
    return entries.filter(checkFn).length;
};

/**
 * Calculate goal completion rate
 * @param {Object[]} entries - Array of entries
 * @param {string} goalPath - Path to goal field (e.g., 'water.goal')
 * @param {string} valuePath - Path to value field (e.g., 'water.amount')
 * @returns {number} - Completion rate (0-1)
 */
const calculateGoalCompletionRate = (entries, goalPath, valuePath) => {
    if (!entries || entries.length === 0) return 0;

    let completedDays = 0;
    let totalDays = 0;

    for (const entry of entries) {
        const goal = safeGetValue(entry, goalPath);
        const value = safeGetValue(entry, valuePath);

        if (goal != null && goal > 0) {
            totalDays++;
            if (value >= goal) {
                completedDays++;
            }
        }
    }

    return totalDays > 0 ? completedDays / totalDays : 0;
};

/**
 * Detect patterns in data (e.g., recurring issues on specific days)
 * @param {Object[]} entries - Array of entries
 * @param {Function} getValue - Function to extract value from entry
 * @param {Object} options - Options for pattern detection
 * @returns {Object} - Pattern analysis results
 */
const detectPatterns = (entries, getValue, options = {}) => {
    const { threshold = 0.3, minOccurrences = 3 } = options;

    if (!entries || entries.length < minOccurrences) {
        return { patternDetected: false, patterns: [] };
    }

    // Group by day of week
    const byDayOfWeek = groupByDayOfWeek(entries, getValue);

    // Find days with higher than average values
    const allValues = entries.map(getValue).filter(v => v != null);
    const overallAvg = calculateAverage(allValues);

    const patterns = [];

    for (const [day, values] of Object.entries(byDayOfWeek)) {
        if (values.length >= minOccurrences) {
            const dayAvg = calculateAverage(values);
            const deviation = (dayAvg - overallAvg) / (overallAvg || 1);

            if (Math.abs(deviation) > threshold) {
                patterns.push({
                    day: parseInt(day),
                    dayName: getDayName(parseInt(day)),
                    average: dayAvg,
                    deviation,
                    occurrences: values.length,
                    isHigher: deviation > 0
                });
            }
        }
    }

    return {
        patternDetected: patterns.length > 0,
        patterns,
        overallAverage: overallAvg
    };
};

/**
 * Detect source patterns (e.g., same stress source repeatedly)
 * @param {Object[]} entries - Array of entries
 * @param {string} sourcePath - Path to source field
 * @param {number} threshold - Minimum percentage to be considered a pattern
 * @returns {Object} - Most common source info
 */
const detectSourcePattern = (entries, sourcePath, threshold = 0.6) => {
    if (!entries || entries.length === 0) {
        return { patternDetected: false, source: null, percentage: 0 };
    }

    const sources = entries
        .map(e => safeGetValue(e, sourcePath))
        .filter(s => s != null);

    if (sources.length === 0) {
        return { patternDetected: false, source: null, percentage: 0 };
    }

    // Count occurrences
    const counts = {};
    for (const source of sources) {
        counts[source] = (counts[source] || 0) + 1;
    }

    // Find most common
    let maxSource = null;
    let maxCount = 0;
    for (const [source, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            maxSource = source;
        }
    }

    const percentage = maxCount / sources.length;

    return {
        patternDetected: percentage >= threshold,
        source: maxSource,
        count: maxCount,
        total: sources.length,
        percentage
    };
};

/**
 * Calculate correlation coefficient between two arrays
 * @param {number[]} values1 - First array of values
 * @param {number[]} values2 - Second array of values (same length)
 * @returns {number} - Correlation coefficient (-1 to 1)
 */
const calculateCorrelation = (values1, values2) => {
    if (!values1 || !values2 || values1.length !== values2.length || values1.length < 3) {
        return 0;
    }

    // Filter out pairs where either value is null
    const pairs = [];
    for (let i = 0; i < values1.length; i++) {
        if (values1[i] != null && values2[i] != null && !isNaN(values1[i]) && !isNaN(values2[i])) {
            pairs.push([values1[i], values2[i]]);
        }
    }

    if (pairs.length < 3) return 0;

    const n = pairs.length;
    const x = pairs.map(p => p[0]);
    const y = pairs.map(p => p[1]);

    const avgX = calculateAverage(x);
    const avgY = calculateAverage(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (const [xi, yi] of pairs) {
        const dx = xi - avgX;
        const dy = yi - avgY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) return 0;

    return numerator / denominator;
};

/**
 * Group entries by day of week
 * @param {Object[]} entries - Array of entries
 * @param {Function} getValue - Function to extract value
 * @returns {Object} - Object with day (0-6) as key and array of values
 */
const groupByDayOfWeek = (entries, getValue) => {
    const groups = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (const entry of entries) {
        const date = new Date(entry.date);
        const day = date.getDay();
        const value = getValue(entry);
        if (value != null) {
            groups[day].push(value);
        }
    }

    return groups;
};

/**
 * Group entries by time of day
 * @param {Object[]} entries - Array of entries with timestamp
 * @param {Function} getValue - Function to extract value
 * @returns {Object} - Object with time period as key
 */
const groupByTimeOfDay = (entries, getValue) => {
    const groups = { morning: [], afternoon: [], evening: [], night: [] };

    for (const entry of entries) {
        const timestamp = new Date(entry.timestamp || entry.date);
        const hour = timestamp.getHours();

        let period = 'morning';
        if (hour >= 12 && hour < 17) period = 'afternoon';
        else if (hour >= 17 && hour < 21) period = 'evening';
        else if (hour >= 21 || hour < 6) period = 'night';

        const value = getValue(entry);
        if (value != null) {
            groups[period].push(value);
        }
    }

    return groups;
};

/**
 * Safely get a nested value from an object
 * @param {Object} obj - Object to extract value from
 * @param {string} path - Dot-separated path (e.g., 'water.amount')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} - Value at path or default
 */
const safeGetValue = (obj, path, defaultValue = null) => {
    if (!obj || !path) return defaultValue;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
        if (current == null || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[part];
    }

    return current != null ? current : defaultValue;
};

/**
 * Get day name from day number
 * @param {number} day - Day of week (0-6)
 * @returns {string} - Day name
 */
const getDayName = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
};

/**
 * Check if it's a weekend day
 * @param {Date} date - Date to check
 * @returns {boolean} - True if weekend
 */
const isWeekend = (date) => {
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6;
};

/**
 * Get entries from the last N days
 * @param {Object[]} entries - Array of entries
 * @param {number} days - Number of days
 * @returns {Object[]} - Filtered entries
 */
const getEntriesFromLastNDays = (entries, days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    return entries.filter(entry => new Date(entry.date) >= cutoff);
};

/**
 * Calculate week-over-week comparison
 * @param {Object[]} entries - Array of entries sorted by date (most recent first)
 * @param {Function} getValue - Function to extract value
 * @returns {Object} - Comparison results
 */
const calculateWeekOverWeek = (entries, getValue) => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeek = entries.filter(e => {
        const d = new Date(e.date);
        return d >= oneWeekAgo && d <= now;
    });

    const lastWeek = entries.filter(e => {
        const d = new Date(e.date);
        return d >= twoWeeksAgo && d < oneWeekAgo;
    });

    const thisWeekValues = thisWeek.map(getValue).filter(v => v != null);
    const lastWeekValues = lastWeek.map(getValue).filter(v => v != null);

    const thisWeekAvg = calculateAverage(thisWeekValues);
    const lastWeekAvg = calculateAverage(lastWeekValues);

    return {
        thisWeek: thisWeekAvg,
        lastWeek: lastWeekAvg,
        change: thisWeekAvg - lastWeekAvg,
        percentageChange: calculatePercentageChange(thisWeekAvg, lastWeekAvg)
    };
};

/**
 * Check if a date is within a date range
 * @param {Date} date - Date to check
 * @param {string} startMonth - Start month (1-12)
 * @param {string} startDay - Start day (1-31)
 * @param {string} endMonth - End month (1-12)
 * @param {string} endDay - End day (1-31)
 * @returns {boolean} - True if within range
 */
const isWithinDateRange = (date, startMonth, startDay, endMonth, endDay) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();

    // Handle year-wrapping ranges (e.g., Nov 20 - Dec 31)
    if (startMonth <= endMonth) {
        return (month > startMonth || (month === startMonth && day >= startDay)) &&
            (month < endMonth || (month === endMonth && day <= endDay));
    } else {
        // Range wraps around year end
        return (month > startMonth || (month === startMonth && day >= startDay)) ||
            (month < endMonth || (month === endMonth && day <= endDay));
    }
};

/**
 * Check if date is near daylight saving time change
 * @param {Date} date - Date to check
 * @param {number} daysWindow - Days before/after DST change to consider
 * @returns {boolean} - True if near DST change
 */
const isNearDaylightSavingChange = (date, daysWindow = 3) => {
    // Approximate DST dates for US (2nd Sunday March, 1st Sunday November)
    const d = new Date(date);
    const year = d.getFullYear();

    // March DST
    const marchDst = new Date(year, 2, 1);
    marchDst.setDate(marchDst.getDate() + (7 - marchDst.getDay()) % 7 + 7);

    // November DST
    const novDst = new Date(year, 10, 1);
    novDst.setDate(novDst.getDate() + (7 - novDst.getDay()) % 7);

    const dayMs = 24 * 60 * 60 * 1000;
    const diffMarch = Math.abs(d - marchDst) / dayMs;
    const diffNov = Math.abs(d - novDst) / dayMs;

    return diffMarch <= daysWindow || diffNov <= daysWindow;
};

module.exports = {
    calculateAverage,
    calculateStandardDeviation,
    calculateWeekdayAverage,
    calculateWeekendAverage,
    calculateTrend,
    calculatePercentageChange,
    calculateStreak,
    countDaysMeetingCondition,
    calculateGoalCompletionRate,
    detectPatterns,
    detectSourcePattern,
    calculateCorrelation,
    groupByDayOfWeek,
    groupByTimeOfDay,
    safeGetValue,
    getDayName,
    isWeekend,
    getEntriesFromLastNDays,
    calculateWeekOverWeek,
    isWithinDateRange,
    isNearDaylightSavingChange
};
