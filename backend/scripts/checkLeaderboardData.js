const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const LeaderboardStats = require('../models/leaderboardModel');
const User = require('../models/userModel'); // Required for populate

async function main() {
  await mongoose.connect(process.env.DB_URI);
  console.log('Connected to MongoDB');
  
  // Get all users with their scores
  const stats = await LeaderboardStats.find({})
    .populate('user_id', 'username')
    .select('user_id scores all_time.total_meals_logged all_time.total_workouts_completed privacy')
    .sort({ 'scores.all_time_score': -1 })
    .limit(50)
    .lean();
  
  console.log('\n=== TOP 50 LEADERBOARD STATS ===\n');
  console.log('Rank | Username | Weekly | Monthly | AllTime | Meals | Workouts | Show?');
  console.log('-'.repeat(90));
  
  stats.forEach((s, i) => {
    const username = s.user_id?.username || 'NO_USER';
    const weekly = s.scores?.weekly_score || 0;
    const monthly = s.scores?.monthly_score || 0;
    const allTime = s.scores?.all_time_score || 0;
    const meals = s.all_time?.total_meals_logged || 0;
    const workouts = s.all_time?.total_workouts_completed || 0;
    const showOnLeaderboard = s.privacy?.show_on_leaderboard !== false;
    
    console.log(`${String(i + 1).padStart(4)} | ${username.substring(0, 20).padEnd(20)} | ${String(weekly).padStart(6)} | ${String(monthly).padStart(7)} | ${String(allTime).padStart(7)} | ${String(meals).padStart(5)} | ${String(workouts).padStart(8)} | ${showOnLeaderboard}`);
  });
  
  // Count active vs inactive users
  const totalUsers = await LeaderboardStats.countDocuments();
  const activeUsers = await LeaderboardStats.countDocuments({
    $or: [
      { 'scores.weekly_score': { $gt: 0 } },
      { 'scores.monthly_score': { $gt: 0 } },
      { 'scores.all_time_score': { $gt: 0 } }
    ]
  });
  const usersWithMeals = await LeaderboardStats.countDocuments({ 'all_time.total_meals_logged': { $gt: 0 } });
  const usersWithWorkouts = await LeaderboardStats.countDocuments({ 'all_time.total_workouts_completed': { $gt: 0 } });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total LeaderboardStats records: ${totalUsers}`);
  console.log(`Users with score > 0: ${activeUsers}`);
  console.log(`Users with meals logged: ${usersWithMeals}`);
  console.log(`Users with workouts: ${usersWithWorkouts}`);
  
  await mongoose.disconnect();
  console.log('\nDisconnected');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
