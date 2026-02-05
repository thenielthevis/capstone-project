/**
 * Seed script for Leaderboard Achievements
 * Run with: node scripts/seedAchievements.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Achievement = require('../models/achievementModel');

const achievements = [
  // ============ Milestone Achievements ============
  {
    name: 'First Steps',
    description: 'Log your first meal',
    category: 'milestone',
    icon: '🍽️',
    criteria: {
      type: 'count',
      target: 1,
      metric: 'meals_logged'
    },
    points: 10,
    tier: 'bronze'
  },
  {
    name: 'Getting Started',
    description: 'Log 10 meals',
    category: 'milestone',
    icon: '📝',
    criteria: {
      type: 'count',
      target: 10,
      metric: 'meals_logged'
    },
    points: 25,
    tier: 'bronze'
  },
  {
    name: 'Century Club',
    description: 'Log 100 meals',
    category: 'milestone',
    icon: '💯',
    criteria: {
      type: 'count',
      target: 100,
      metric: 'meals_logged'
    },
    points: 100,
    tier: 'silver'
  },
  {
    name: 'Food Journal Master',
    description: 'Log 500 meals',
    category: 'milestone',
    icon: '📚',
    criteria: {
      type: 'count',
      target: 500,
      metric: 'meals_logged'
    },
    points: 250,
    tier: 'gold'
  },
  {
    name: 'Nutrition Expert',
    description: 'Log 1000 meals',
    category: 'milestone',
    icon: '🎓',
    criteria: {
      type: 'count',
      target: 1000,
      metric: 'meals_logged'
    },
    points: 500,
    tier: 'platinum'
  },
  
  // ============ Workout/Calorie Achievements ============
  {
    name: 'First Workout',
    description: 'Complete your first workout',
    category: 'workout',
    icon: '💪',
    criteria: {
      type: 'count',
      target: 1,
      metric: 'workouts_completed'
    },
    points: 15,
    tier: 'bronze'
  },
  {
    name: 'Workout Warrior',
    description: 'Complete 25 workouts',
    category: 'workout',
    icon: '🏋️',
    criteria: {
      type: 'count',
      target: 25,
      metric: 'workouts_completed'
    },
    points: 75,
    tier: 'silver'
  },
  {
    name: 'Fitness Fanatic',
    description: 'Complete 100 workouts',
    category: 'workout',
    icon: '🔥',
    criteria: {
      type: 'count',
      target: 100,
      metric: 'workouts_completed'
    },
    points: 200,
    tier: 'gold'
  },
  {
    name: 'Calorie Crusher',
    description: 'Burn 10,000 total calories',
    category: 'workout',
    icon: '🔥',
    criteria: {
      type: 'threshold',
      target: 10000,
      metric: 'calories_burned'
    },
    points: 150,
    tier: 'silver'
  },
  {
    name: 'Calorie Destroyer',
    description: 'Burn 50,000 total calories',
    category: 'workout',
    icon: '💥',
    criteria: {
      type: 'threshold',
      target: 50000,
      metric: 'calories_burned'
    },
    points: 300,
    tier: 'gold'
  },
  {
    name: 'Calorie Annihilator',
    description: 'Burn 100,000 total calories',
    category: 'workout',
    icon: '☄️',
    criteria: {
      type: 'threshold',
      target: 100000,
      metric: 'calories_burned'
    },
    points: 500,
    tier: 'platinum'
  },
  {
    name: 'Marathon Milestone',
    description: 'Burn 3,500 calories in a week',
    category: 'workout',
    icon: '🏃',
    criteria: {
      type: 'threshold',
      target: 3500,
      metric: 'weekly_calories_burned'
    },
    points: 100,
    tier: 'silver'
  },
  {
    name: 'Active Hour',
    description: 'Accumulate 60 minutes of activity',
    category: 'workout',
    icon: '⏱️',
    criteria: {
      type: 'threshold',
      target: 60,
      metric: 'activity_minutes'
    },
    points: 20,
    tier: 'bronze'
  },
  {
    name: 'Active Day',
    description: 'Accumulate 500 minutes of activity',
    category: 'workout',
    icon: '📆',
    criteria: {
      type: 'threshold',
      target: 500,
      metric: 'activity_minutes'
    },
    points: 75,
    tier: 'silver'
  },
  {
    name: 'Active Week',
    description: 'Accumulate 2000 minutes of activity',
    category: 'workout',
    icon: '🗓️',
    criteria: {
      type: 'threshold',
      target: 2000,
      metric: 'activity_minutes'
    },
    points: 150,
    tier: 'gold'
  },
  
  // ============ Streak Achievements ============
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day logging streak',
    category: 'streak',
    icon: '📅',
    criteria: {
      type: 'streak',
      target: 7,
      metric: 'logging_streak'
    },
    points: 50,
    tier: 'bronze'
  },
  {
    name: 'Two Week Titan',
    description: 'Maintain a 14-day logging streak',
    category: 'streak',
    icon: '📆',
    criteria: {
      type: 'streak',
      target: 14,
      metric: 'logging_streak'
    },
    points: 100,
    tier: 'bronze'
  },
  {
    name: 'Consistency King',
    description: 'Maintain a 30-day logging streak',
    category: 'streak',
    icon: '👑',
    criteria: {
      type: 'streak',
      target: 30,
      metric: 'logging_streak'
    },
    points: 200,
    tier: 'silver'
  },
  {
    name: 'Habit Master',
    description: 'Maintain a 60-day logging streak',
    category: 'streak',
    icon: '🏆',
    criteria: {
      type: 'streak',
      target: 60,
      metric: 'logging_streak'
    },
    points: 350,
    tier: 'gold'
  },
  {
    name: 'Century Streak',
    description: 'Maintain a 100-day logging streak',
    category: 'streak',
    icon: '💎',
    criteria: {
      type: 'streak',
      target: 100,
      metric: 'logging_streak'
    },
    points: 500,
    tier: 'platinum'
  },
  {
    name: 'Year of Dedication',
    description: 'Maintain a 365-day logging streak',
    category: 'streak',
    icon: '🌟',
    criteria: {
      type: 'streak',
      target: 365,
      metric: 'logging_streak'
    },
    points: 1000,
    tier: 'diamond'
  },
  
  // ============ Goal Achievements ============
  {
    name: 'On Target',
    description: 'Achieve your daily calorie goal',
    category: 'nutrition',
    icon: '🎯',
    criteria: {
      type: 'count',
      target: 1,
      metric: 'goal_days'
    },
    points: 15,
    tier: 'bronze'
  },
  {
    name: 'Balanced Week',
    description: 'Maintain calorie goal for 7 days',
    category: 'nutrition',
    icon: '⚖️',
    criteria: {
      type: 'count',
      target: 7,
      metric: 'goal_days'
    },
    points: 75,
    tier: 'silver'
  },
  {
    name: 'Balanced Life',
    description: 'Maintain calorie goal for 30 days',
    category: 'nutrition',
    icon: '🌈',
    criteria: {
      type: 'count',
      target: 30,
      metric: 'goal_days'
    },
    points: 200,
    tier: 'gold'
  },
  {
    name: 'Goal Crusher',
    description: 'Achieve calorie goal 100 times',
    category: 'nutrition',
    icon: '💪',
    criteria: {
      type: 'count',
      target: 100,
      metric: 'goal_days'
    },
    points: 400,
    tier: 'platinum'
  },
  
  // ============ Social Achievements ============
  {
    name: 'Making Friends',
    description: 'Connect with 5 friends',
    category: 'health',
    icon: '🤝',
    criteria: {
      type: 'count',
      target: 5,
      metric: 'friends_count'
    },
    points: 30,
    tier: 'bronze'
  },
  {
    name: 'Social Butterfly',
    description: 'Connect with 10 friends',
    category: 'health',
    icon: '🦋',
    criteria: {
      type: 'count',
      target: 10,
      metric: 'friends_count'
    },
    points: 75,
    tier: 'silver'
  },
  {
    name: 'Community Leader',
    description: 'Connect with 25 friends',
    category: 'health',
    icon: '👥',
    criteria: {
      type: 'count',
      target: 25,
      metric: 'friends_count'
    },
    points: 150,
    tier: 'gold'
  },
  
  // ============ Program Achievements ============
  {
    name: 'Program Starter',
    description: 'Complete your first program session',
    category: 'program',
    icon: '🚀',
    criteria: {
      type: 'count',
      target: 1,
      metric: 'workouts_completed'
    },
    points: 20,
    tier: 'bronze'
  },
  {
    name: 'Program Pro',
    description: 'Complete 50 program sessions',
    category: 'program',
    icon: '⭐',
    criteria: {
      type: 'count',
      target: 50,
      metric: 'workouts_completed'
    },
    points: 150,
    tier: 'silver'
  },
  
  // ============ Leaderboard/Competitive Achievements ============
  {
    name: 'Podium Finish',
    description: 'Reach top 3 in the weekly leaderboard',
    category: 'leaderboard',
    icon: '🏅',
    criteria: {
      type: 'threshold',
      target: 3,
      metric: 'weekly_rank'
    },
    points: 200,
    tier: 'gold'
  },
  {
    name: 'Top Performer',
    description: 'Reach top 10 in any leaderboard category',
    category: 'leaderboard',
    icon: '🌟',
    criteria: {
      type: 'threshold',
      target: 10,
      metric: 'best_rank'
    },
    points: 100,
    tier: 'silver'
  },
  {
    name: 'Champion',
    description: 'Achieve #1 rank in any category for a week',
    category: 'leaderboard',
    icon: '🏆',
    criteria: {
      type: 'threshold',
      target: 1,
      metric: 'weekly_rank'
    },
    points: 500,
    tier: 'platinum'
  },
  {
    name: 'Age Group Leader',
    description: 'Reach #1 in your age bracket',
    category: 'leaderboard',
    icon: '👑',
    criteria: {
      type: 'threshold',
      target: 1,
      metric: 'age_group_rank'
    },
    points: 150,
    tier: 'gold'
  },
  {
    name: 'Rising Star',
    description: 'Improve your rank by 10 positions in a week',
    category: 'leaderboard',
    icon: '📈',
    criteria: {
      type: 'threshold',
      target: 10,
      metric: 'rank_improvement'
    },
    points: 75,
    tier: 'silver'
  },
  {
    name: 'Score Hunter',
    description: 'Accumulate 1,000 leaderboard points',
    category: 'leaderboard',
    icon: '💯',
    criteria: {
      type: 'threshold',
      target: 1000,
      metric: 'weekly_score'
    },
    points: 50,
    tier: 'bronze'
  },
  {
    name: 'Score Master',
    description: 'Accumulate 10,000 leaderboard points in a month',
    category: 'leaderboard',
    icon: '🔥',
    criteria: {
      type: 'threshold',
      target: 10000,
      metric: 'monthly_score'
    },
    points: 200,
    tier: 'gold'
  },
  
  // ============ Social Achievements ============
  {
    name: 'Team Player',
    description: 'Join a fitness challenge with friends',
    category: 'social',
    icon: '🤝',
    criteria: {
      type: 'count',
      target: 1,
      metric: 'challenges_joined'
    },
    points: 25,
    tier: 'bronze'
  },
  {
    name: 'Motivator',
    description: 'Get 50 likes on your progress posts',
    category: 'social',
    icon: '❤️',
    criteria: {
      type: 'threshold',
      target: 50,
      metric: 'total_likes'
    },
    points: 100,
    tier: 'silver'
  },
  {
    name: 'Influencer',
    description: 'Get 200 likes on your progress posts',
    category: 'social',
    icon: '🌟',
    criteria: {
      type: 'threshold',
      target: 200,
      metric: 'total_likes'
    },
    points: 250,
    tier: 'gold'
  },
  {
    name: 'Helpful Hand',
    description: 'Leave 25 encouraging comments on others posts',
    category: 'social',
    icon: '💬',
    criteria: {
      type: 'count',
      target: 25,
      metric: 'comments_given'
    },
    points: 75,
    tier: 'bronze'
  }
];

async function seedAchievements() {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing achievements (optional - comment out to preserve existing)
    // await Achievement.deleteMany({});
    // console.log('Cleared existing achievements');
    
    // Insert or update achievements
    for (const achievement of achievements) {
      await Achievement.findOneAndUpdate(
        { name: achievement.name },
        achievement,
        { upsert: true, new: true }
      );
      console.log(`✓ Upserted: ${achievement.name}`);
    }
    
    console.log(`\n✅ Successfully seeded ${achievements.length} achievements`);
    
    // Display summary
    const counts = await Achievement.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log('\nAchievements by category:');
    counts.forEach(c => console.log(`  ${c._id}: ${c.count}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
}

seedAchievements();
