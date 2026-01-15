/**
 * GeoActivity Reference Data
 * 
 * Use this as a reference when creating activities via Insomnia API.
 * Endpoint: POST /api/geo/createGeoActivity (requires admin auth)
 * 
 * Form-data fields:
 *   - name: string (required)
 *   - type: string (enum: 'Foot Sports', 'Cycle Sports', 'Water Sports', 'Other Sports')
 *   - description: string
 *   - met: number (metabolic equivalent for calorie calculation)
 *   - icon: file (SVG format supported)
 *   - animation: file (optional, Lottie or GIF)
 */

const activities = [
    // ========== FOOT SPORTS ==========
    {
        name: 'Run',
        type: 'Foot Sports',
        description: 'A cardiovascular exercise involving continuous forward movement at a pace faster than walking, engaging leg muscles and promoting endurance.',
        met: 9.8
    },
    {
        name: 'Trail Run',
        type: 'Foot Sports',
        description: 'Off-road running on natural terrain including dirt paths, forest trails, and mountain routes, providing varied elevation and surface challenges.',
        met: 10.5
    },
    {
        name: 'Walk',
        type: 'Foot Sports',
        description: 'A low-impact aerobic activity that improves cardiovascular health, strengthens bones, and boosts mood while being gentle on joints.',
        met: 3.5
    },
    {
        name: 'Hike',
        type: 'Foot Sports',
        description: 'Extended walking on trails or paths through natural environments, often involving varied terrain and elevation changes for a full-body workout.',
        met: 6.0
    },

    // ========== CYCLE SPORTS ==========
    {
        name: 'Cycling',
        type: 'Cycle Sports',
        description: 'Road cycling on paved surfaces using a bicycle, excellent for building lower body strength, cardiovascular fitness, and endurance.',
        met: 7.5
    },
    {
        name: 'Mountain Biking',
        type: 'Cycle Sports',
        description: 'Off-road cycling on rough terrain including trails, hills, and technical obstacles, requiring balance, coordination, and upper body strength.',
        met: 8.5
    },
    {
        name: 'Gravel Ride',
        type: 'Cycle Sports',
        description: 'Cycling on mixed surfaces including gravel roads, dirt paths, and light trails, combining road cycling endurance with off-road adventure.',
        met: 8.0
    },

    // ========== WATER SPORTS ==========
    {
        name: 'Swimming',
        type: 'Water Sports',
        description: 'Full-body aquatic exercise that builds cardiovascular endurance, muscle strength, and flexibility while being easy on joints and bones.',
        met: 8.0
    },
    {
        name: 'Kayaking',
        type: 'Water Sports',
        description: 'Paddling a small watercraft using a double-bladed paddle, engaging core and upper body muscles while exploring waterways and coastlines.',
        met: 5.0
    },
    {
        name: 'Rowing',
        type: 'Water Sports',
        description: 'Propelling a boat using oars, providing an intense full-body workout that strengthens legs, core, back, and arms simultaneously.',
        met: 7.0
    },

    // ========== OTHER SPORTS ==========
    {
        name: 'Tennis',
        type: 'Other Sports',
        description: 'A racquet sport involving quick lateral movements, hand-eye coordination, and cardiovascular endurance played on various court surfaces.',
        met: 7.3
    },
    {
        name: 'Badminton',
        type: 'Other Sports',
        description: 'A fast-paced racquet sport requiring agility, reflexes, and stamina, played with a shuttlecock on an indoor or outdoor court.',
        met: 5.5
    },
    {
        name: 'Pilates',
        type: 'Other Sports',
        description: 'A low-impact exercise method focusing on controlled movements to improve core strength, flexibility, posture, and mind-body awareness.',
        met: 3.0
    },
    {
        name: 'Golf',
        type: 'Other Sports',
        description: 'A precision sport involving walking the course, swinging clubs, and strategic thinking while enjoying outdoor environments.',
        met: 4.8
    },
    {
        name: 'Weightlifting',
        type: 'Other Sports',
        description: 'Resistance training using free weights or machines to build muscular strength, increase bone density, and boost metabolism.',
        met: 6.0
    },
];

module.exports = activities;
