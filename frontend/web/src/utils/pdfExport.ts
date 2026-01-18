import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Brand colors based on default theme (tokens.ts)
const COLORS = {
  primary: [56, 182, 255] as [number, number, number],      // #38b6ff - Primary blue
  primaryDark: [46, 84, 132] as [number, number, number],   // #2e5484 - Secondary dark blue
  secondary: [46, 84, 132] as [number, number, number],     // #2e5484 - Secondary
  accent: [16, 185, 129] as [number, number, number],       // #10B981 - Green/Emerald
  danger: [228, 88, 88] as [number, number, number],        // #E45858 - Error red
  warning: [255, 152, 0] as [number, number, number],       // #FF9800 - Warning orange
  info: [33, 150, 243] as [number, number, number],         // #2196F3 - Info blue
  purple: [156, 39, 176] as [number, number, number],       // #9C27B0 - Purple
  orange: [255, 111, 0] as [number, number, number],        // #FF6F00 - Orange accent
  textDark: [26, 25, 22] as [number, number, number],       // #1a1916 - Text color
  textLight: [74, 85, 104] as [number, number, number],     // #4a5568 - Text secondary
  headerBg: [232, 245, 255] as [number, number, number],    // Light blue tint for header
  white: [255, 255, 255] as [number, number, number],       // White
  grayLight: [248, 250, 252] as [number, number, number],   // Surface color
};


export interface UserHealthData {
  _id: string;
  username: string;
  email: string;
  age?: number;
  gender?: string;
  registeredDate: string;
  physicalMetrics?: {
    height?: { value: number };
    weight?: { value: number };
    bmi?: number;
    waistCircumference?: number;
  };
  lifestyle?: {
    activityLevel?: string;
    sleepHours?: number;
  };
  dietaryProfile?: {
    preferences?: string[];
    allergies?: string[];
    dailyWaterIntake?: number;
    mealFrequency?: number;
  };
  healthProfile?: {
    currentConditions?: string[];
    familyHistory?: string[];
    medications?: string[];
    bloodType?: string;
  };
  environmentalFactors?: {
    pollutionExposure?: string;
    occupationType?: string;
  };
  riskFactors?: {
    addictions?: Array<{
      substance: string;
      severity: string;
      duration: number;
    }>;
    stressLevel?: string;
  };
  lastPrediction?: {
    predictions?: Array<{
      name: string;
      probability: number;
      percentage: number;
      source: string;
      factors?: Array<[string, number]>;
    }>;
    predictedAt?: string;
  };
}

export interface WorkoutData {
  _id: string;
  category: string;
  type: string;
  name: string;
  description?: string;
  equipment_needed?: string;
  createdAt: string;
}

export interface GeoSessionData {
  _id: string;
  user_id?: {
    username?: string;
    email?: string;
  };
  activity_type?: {
    name?: string;
    met?: number;
  };
  distance_km: number;
  moving_time_sec: number;
  calories_burned: number;
  createdAt: string;
}

export interface GeoActivityData {
  _id: string;
  name: string;
  description?: string;
  met: number;
  createdAt: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background - light blue tint
  doc.setFillColor(COLORS.headerBg[0], COLORS.headerBg[1], COLORS.headerBg[2]);
  doc.rect(0, 0, pageWidth, 48, 'F');
  
  // Title - centered
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
  doc.text(title, pageWidth / 2, 16, { align: 'center' });
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text(subtitle, pageWidth / 2, 26, { align: 'center' });
  }
  
  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, 36, { align: 'center' });
  
  // Bottom accent line
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(1.5);
  doc.line(0, 48, pageWidth, 48);
  
  return 55;
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text('Lifora Health Platform', 20, pageHeight - 10);
    
    // Page number on right
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }
};

// Common table styles for consistent look
const getTableStyles = (headerColor: [number, number, number] = COLORS.primary) => ({
  theme: 'striped' as const,
  headStyles: {
    fillColor: headerColor,
    textColor: [255, 255, 255] as [number, number, number],
    fontSize: 10,
    fontStyle: 'bold' as const,
    cellPadding: 4,
  },
  bodyStyles: {
    fontSize: 9,
    cellPadding: 3,
    textColor: COLORS.textDark,
  },
  alternateRowStyles: {
    fillColor: [249, 250, 251] as [number, number, number], // Gray 50
  },
  styles: {
    fontSize: 9,
    cellPadding: 3,
    lineColor: [229, 231, 235] as [number, number, number], // Gray 200
    lineWidth: 0.1,
  },
  margin: { left: 15, right: 15 },
});

// Section title helper
const addSectionHeader = (doc: jsPDF, title: string, yPos: number, color: [number, number, number] = COLORS.primary): number => {
  // Accent bar
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(15, yPos - 3, 3, 10, 'F');
  
  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, 22, yPos + 4);
  
  return yPos + 12;
};

/**
 * Export a single user's health analysis to PDF
 */
export const exportUserHealthReport = (user: UserHealthData): void => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'User Health Analysis Report', `For: ${user.username}`);
  
  // User Basic Info
  yPos = addSectionHeader(doc, 'Basic Information', yPos, COLORS.primary);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: [
      ['Username', user.username],
      ['Email', user.email],
      ['Age', user.age?.toString() || 'N/A'],
      ['Gender', user.gender || 'N/A'],
      ['Registered', new Date(user.registeredDate).toLocaleDateString()],
    ],
    ...getTableStyles(COLORS.primary),
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Physical Metrics
  if (user.physicalMetrics) {
    yPos = addSectionHeader(doc, 'Physical Metrics', yPos, COLORS.info);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Height', user.physicalMetrics.height?.value ? `${user.physicalMetrics.height.value} cm` : 'N/A'],
        ['Weight', user.physicalMetrics.weight?.value ? `${user.physicalMetrics.weight.value} kg` : 'N/A'],
        ['BMI', user.physicalMetrics.bmi ? user.physicalMetrics.bmi.toFixed(1) : 'N/A'],
        ['Waist Circumference', user.physicalMetrics.waistCircumference ? `${user.physicalMetrics.waistCircumference} cm` : 'N/A'],
      ],
      ...getTableStyles(COLORS.info),
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  }
  
  // Lifestyle
  if (user.lifestyle) {
    yPos = addSectionHeader(doc, 'Lifestyle', yPos, COLORS.purple);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Factor', 'Value']],
      body: [
        ['Activity Level', user.lifestyle.activityLevel?.replace('_', ' ') || 'N/A'],
        ['Sleep Hours', user.lifestyle.sleepHours?.toString() || 'N/A'],
      ],
      ...getTableStyles(COLORS.purple),
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  }
  
  // Health Predictions
  if (user.lastPrediction?.predictions && user.lastPrediction.predictions.length > 0) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 25;
    }
    
    yPos = addSectionHeader(doc, 'Health Risk Predictions', yPos, COLORS.danger);
    
    const predictionsData = user.lastPrediction.predictions.map(pred => [
      pred.name,
      `${(pred.probability * 100).toFixed(1)}%`,
      pred.source || 'ML Model'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Condition', 'Risk Level', 'Source']],
      body: predictionsData,
      ...getTableStyles(COLORS.danger),
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    if (user.lastPrediction.predictedAt) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Last prediction: ${new Date(user.lastPrediction.predictedAt).toLocaleString()}`, 20, yPos);
    }
  }
  
  // Health Profile
  if (user.healthProfile) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 25;
    }
    
    yPos = addSectionHeader(doc, 'Health Profile', yPos, COLORS.secondary);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Details']],
      body: [
        ['Blood Type', user.healthProfile.bloodType || 'N/A'],
        ['Current Conditions', user.healthProfile.currentConditions?.join(', ') || 'None'],
        ['Family History', user.healthProfile.familyHistory?.join(', ') || 'None'],
        ['Medications', user.healthProfile.medications?.join(', ') || 'None'],
      ],
      ...getTableStyles(COLORS.secondary),
      columnStyles: { 1: { cellWidth: 120 } }
    });
  }
  
  // Risk Factors
  if (user.riskFactors) {
    yPos = doc.lastAutoTable.finalY + 12;
    
    if (yPos > 220) {
      doc.addPage();
      yPos = 25;
    }
    
    yPos = addSectionHeader(doc, 'Risk Factors', yPos, COLORS.warning);
    
    const riskData: string[][] = [
      ['Stress Level', user.riskFactors.stressLevel || 'N/A'],
    ];
    
    if (user.riskFactors.addictions && user.riskFactors.addictions.length > 0) {
      riskData.push(['Addictions', user.riskFactors.addictions.map(a => `${a.substance} (${a.severity})`).join(', ')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [['Factor', 'Details']],
      body: riskData,
      ...getTableStyles(COLORS.warning),
    });
  }
  
  addFooter(doc);
  doc.save(`health-report-${user.username}-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export all users' health data summary to PDF
 */
export const exportAllUsersHealthReport = (users: UserHealthData[]): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'All Users Health Summary Report', `Total Users: ${users.length}`);
  
  const tableData = users.map(user => [
    user.username,
    user.email,
    user.age?.toString() || 'N/A',
    user.gender || 'N/A',
    user.physicalMetrics?.bmi?.toFixed(1) || 'N/A',
    user.lifestyle?.activityLevel?.replace('_', ' ') || 'N/A',
    user.lastPrediction?.predictions?.[0]?.name || 'None',
    user.lastPrediction?.predictions?.[0] ? 
      `${(user.lastPrediction.predictions[0].probability * 100).toFixed(0)}%` : 'N/A',
    new Date(user.registeredDate).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: 65,
    head: [['Username', 'Email', 'Age', 'Gender', 'BMI', 'Activity', 'Top Risk', 'Risk %', 'Registered']],
    body: tableData,
    ...getTableStyles(COLORS.primary),
  });
  
  addFooter(doc);
  doc.save(`all-users-health-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export workouts data to PDF
 */
export const exportWorkoutsReport = (workouts: WorkoutData[], stats?: {
  totalWorkouts: number;
  bodyweightWorkouts: number;
  equipmentWorkouts: number;
}): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Workouts Report', `Total Workouts: ${workouts.length}`);
  
  // Stats summary if available
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Bodyweight: ${stats.bodyweightWorkouts}`, 15, yPos);
    doc.text(`|`, 85, yPos);
    doc.text(`Equipment: ${stats.equipmentWorkouts}`, 95, yPos);
    yPos += 8;
  }
  
  const tableData = workouts.map(workout => [
    workout.name,
    workout.category,
    workout.type.replace('_', ' '),
    workout.description?.substring(0, 50) + (workout.description && workout.description.length > 50 ? '...' : '') || 'N/A',
    workout.equipment_needed || 'None',
    new Date(workout.createdAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Category', 'Type', 'Description', 'Equipment', 'Created']],
    body: tableData,
    ...getTableStyles(COLORS.danger),
    columnStyles: { 3: { cellWidth: 80 } }
  });
  
  addFooter(doc);
  doc.save(`workouts-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export geo activities/sessions data to PDF
 */
export const exportGeoActivitiesReport = (
  sessions: GeoSessionData[],
  activities: GeoActivityData[],
  stats?: {
    totalSessions: number;
    totalActivities: number;
    totalUsers: number;
  }
): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Geo Activities Report', `Total Sessions: ${sessions.length}`);
  
  // Stats summary
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Activity Types: ${stats.totalActivities}`, 15, yPos);
    doc.text(`|`, 95, yPos);
    doc.text(`Active Users: ${stats.totalUsers}`, 105, yPos);
    yPos += 8;
  }
  
  // Sessions table
  yPos = addSectionHeader(doc, 'User Sessions', yPos, COLORS.orange);
  
  const sessionsData = sessions.map(session => [
    session.user_id?.username || 'Unknown',
    session.activity_type?.name || 'Unknown',
    `${session.distance_km.toFixed(2)} km`,
    formatDuration(session.moving_time_sec),
    `${session.calories_burned} kcal`,
    new Date(session.createdAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['User', 'Activity', 'Distance', 'Duration', 'Calories', 'Date']],
    body: sessionsData,
    ...getTableStyles(COLORS.orange),
  });
  
  // Activities types on new page
  if (activities.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addSectionHeader(doc, 'Activity Types', yPos, COLORS.warning);
    
    const activitiesData = activities.map(activity => [
      activity.name,
      activity.description?.substring(0, 60) + (activity.description && activity.description.length > 60 ? '...' : '') || 'N/A',
      activity.met.toString(),
      new Date(activity.createdAt).toLocaleDateString()
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Description', 'MET', 'Created']],
      body: activitiesData,
      ...getTableStyles(COLORS.warning),
      columnStyles: { 1: { cellWidth: 120 } }
    });
  }
  
  addFooter(doc);
  doc.save(`geo-activities-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// ============================================
// FOOD LOGS EXPORT
// ============================================

export interface FoodLogData {
  _id: string;
  userId: {
    username: string;
    email: string;
  };
  analyzedAt: string;
  inputMethod: string;
  foodName: string;
  dishName?: string;
  calories: number;
  servingSize: string;
  nutrients?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  confidence?: string;
}

export interface FoodLogStatsData {
  totalFoodLogs: number;
  totalUsers: number;
  recentLogs: number;
  averageLogsPerUser: string;
}

/**
 * Export food logs data to PDF
 */
export const exportFoodLogsReport = (
  foodLogs: FoodLogData[],
  stats?: FoodLogStatsData
): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Food Logs Report', `Total Logs: ${foodLogs.length}`);
  
  // Stats summary if available
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Active Users: ${stats.totalUsers}`, 15, yPos);
    doc.text(`|`, 85, yPos);
    doc.text(`Recent (7d): ${stats.recentLogs}`, 95, yPos);
    doc.text(`|`, 165, yPos);
    doc.text(`Avg/User: ${stats.averageLogsPerUser}`, 175, yPos);
    yPos += 8;
  }
  
  const tableData = foodLogs.map(log => [
    log.userId?.username || 'Unknown',
    log.foodName,
    log.dishName || '-',
    `${log.calories} kcal`,
    log.servingSize,
    log.nutrients ? `P: ${log.nutrients.protein || 0}g | C: ${log.nutrients.carbs || 0}g | F: ${log.nutrients.fat || 0}g` : 'N/A',
    log.inputMethod,
    log.confidence || 'N/A',
    new Date(log.analyzedAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['User', 'Food', 'Dish', 'Calories', 'Serving', 'Nutrients (P|C|F)', 'Method', 'Confidence', 'Date']],
    body: tableData,
    ...getTableStyles(COLORS.warning),
    columnStyles: { 5: { cellWidth: 45 } }
  });
  
  addFooter(doc);
  doc.save(`food-logs-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// PROGRAMS EXPORT
// ============================================

export interface ProgramData {
  _id: string;
  user_id: {
    username: string;
    email: string;
  };
  name: string;
  description?: string;
  workouts: Array<{
    workout_id?: {
      name: string;
      type: string;
    };
  }>;
  geo_activities: Array<{
    activity_id?: {
      name: string;
    };
  }>;
  created_at: string;
}

export interface ProgramStatsData {
  totalPrograms: number;
  totalCreators: number;
  recentPrograms: number;
  avgWorkoutsPerProgram: string;
  avgActivitiesPerProgram: string;
}

/**
 * Export programs data to PDF
 */
export const exportProgramsReport = (
  programs: ProgramData[],
  stats?: ProgramStatsData
): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Programs Report', `Total Programs: ${programs.length}`);
  
  // Stats summary if available
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Creators: ${stats.totalCreators}`, 15, yPos);
    doc.text(`|`, 85, yPos);
    doc.text(`Avg Workouts: ${stats.avgWorkoutsPerProgram}`, 95, yPos);
    doc.text(`|`, 175, yPos);
    doc.text(`Avg Activities: ${stats.avgActivitiesPerProgram}`, 185, yPos);
    yPos += 8;
  }
  
  const tableData = programs.map(program => [
    program.user_id?.username || 'Unknown',
    program.name,
    program.description?.substring(0, 40) + (program.description && program.description.length > 40 ? '...' : '') || '-',
    program.workouts?.length?.toString() || '0',
    program.geo_activities?.length?.toString() || '0',
    program.workouts?.map(w => w.workout_id?.name).filter(Boolean).join(', ').substring(0, 30) || '-',
    new Date(program.created_at).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Creator', 'Program Name', 'Description', 'Workouts', 'Activities', 'Workout Names', 'Created']],
    body: tableData,
    ...getTableStyles(COLORS.purple),
  });
  
  addFooter(doc);
  doc.save(`programs-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// ACHIEVEMENTS EXPORT
// ============================================

export interface AchievementData {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  criteria: {
    type: string;
    target: number;
    metric: string;
  };
  points: number;
  tier: string;
  is_active: boolean;
  earnedCount?: number;
  created_at: string;
}

export interface AchievementStatsData {
  totalAchievements: number;
  activeAchievements: number;
  totalUserAchievements: number;
  completionRate: string;
}

/**
 * Export achievements data to PDF
 */
export const exportAchievementsReport = (
  achievements: AchievementData[],
  stats?: AchievementStatsData
): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Achievements Report', `Total Achievements: ${achievements.length}`);
  
  // Stats summary if available
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Active: ${stats.activeAchievements}`, 15, yPos);
    doc.text(`|`, 75, yPos);
    doc.text(`User Achievements: ${stats.totalUserAchievements}`, 85, yPos);
    doc.text(`|`, 175, yPos);
    doc.text(`Completion: ${stats.completionRate}`, 185, yPos);
    yPos += 8;
  }
  
  const tableData = achievements.map(achievement => [
    achievement.name,
    achievement.description.substring(0, 50) + (achievement.description.length > 50 ? '...' : ''),
    achievement.category,
    achievement.tier,
    achievement.points.toString(),
    `${achievement.criteria.type}: ${achievement.criteria.target} ${achievement.criteria.metric}`,
    achievement.is_active ? 'Yes' : 'No',
    achievement.earnedCount?.toString() || '0',
    new Date(achievement.created_at).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Description', 'Category', 'Tier', 'Points', 'Criteria', 'Active', 'Earned', 'Created']],
    body: tableData,
    ...getTableStyles(COLORS.secondary),
  });
  
  addFooter(doc);
  doc.save(`achievements-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// USER REPORTS EXPORT (Flags/Reports)
// ============================================

export interface ReportData {
  _id: string;
  reporter: {
    username: string;
    email: string;
  };
  reportType: string;
  reportedUser: {
    username: string;
    email: string;
  } | null;
  reason: string;
  description?: string;
  status: string;
  resolution?: {
    action: string;
    notes?: string;
    resolvedAt?: string;
  };
  createdAt: string;
}

export interface ReportStatsData {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
}

/**
 * Export user reports/flags data to PDF
 */
export const exportReportsReport = (
  reports: ReportData[],
  stats?: ReportStatsData
): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'User Reports', `Total Reports: ${reports.length}`);
  
  // Stats summary if available
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Pending: ${stats.pendingReports}`, 15, yPos);
    doc.text(`|`, 75, yPos);
    doc.text(`Resolved: ${stats.resolvedReports}`, 85, yPos);
    doc.text(`|`, 155, yPos);
    doc.text(`Dismissed: ${stats.dismissedReports}`, 165, yPos);
    yPos += 8;
  }
  
  const tableData = reports.map(report => [
    report.reporter?.username || 'Unknown',
    report.reportType,
    report.reportedUser?.username || 'N/A',
    report.reason.replace(/_/g, ' '),
    report.description?.substring(0, 30) + (report.description && report.description.length > 30 ? '...' : '') || '-',
    report.status,
    report.resolution?.action?.replace(/_/g, ' ') || '-',
    new Date(report.createdAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Reporter', 'Type', 'Reported User', 'Reason', 'Description', 'Status', 'Resolution', 'Date']],
    body: tableData,
    ...getTableStyles(COLORS.danger),
  });
  
  addFooter(doc);
  doc.save(`user-reports-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// USERS EXPORT
// ============================================

export interface UserData {
  _id: string;
  username: string;
  email: string;
  role: string;
  registeredDate: string;
  verified: boolean;
  age?: number;
  gender?: string;
  physicalMetrics?: {
    bmi?: number;
  };
  lifestyle?: {
    activityLevel?: string;
  };
  lastPrediction?: {
    predictions?: Array<{
      name: string;
      probability: number;
    }>;
  };
}

/**
 * Export users data to PDF
 */
export const exportUsersReport = (
  users: UserData[],
  stats?: { totalUsers: number; totalAdmins: number }
): void => {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Users Report', `Total Users: ${users.length}`);
  
  // Stats summary if available
  let yPos = 62;
  if (stats) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Total Users: ${stats.totalUsers}`, 15, yPos);
    doc.text(`|`, 95, yPos);
    doc.text(`Admins: ${stats.totalAdmins}`, 105, yPos);
    yPos += 8;
  }
  
  const tableData = users.map(user => [
    user.username,
    user.email,
    user.role,
    user.verified ? 'Yes' : 'No',
    user.age?.toString() || 'N/A',
    user.gender || 'N/A',
    user.physicalMetrics?.bmi?.toFixed(1) || 'N/A',
    user.lifestyle?.activityLevel || 'N/A',
    user.lastPrediction?.predictions?.[0]?.name || 'No prediction',
    new Date(user.registeredDate).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Username', 'Email', 'Role', 'Verified', 'Age', 'Gender', 'BMI', 'Activity', 'Top Risk', 'Registered']],
    body: tableData,
    ...getTableStyles(COLORS.primary),
  });
  
  addFooter(doc);
  doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// DASHBOARD SUMMARY EXPORT
// ============================================

export interface DashboardStatsData {
  totalUsers: number;
  totalAdmins: number;
  reportStats?: {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    dismissedReports?: number;
    byType?: {
      post?: number;
      message?: number;
      user?: number;
    };
  };
  workoutStats?: {
    totalWorkouts: number;
    bodyweightWorkouts: number;
    equipmentWorkouts: number;
  };
  programStats?: {
    totalPrograms: number;
    totalCreators: number;
    avgWorkoutsPerProgram: string;
  };
  foodLogStats?: {
    totalFoodLogs: number;
    totalUsers: number;
    recentLogs: number;
    averageLogsPerUser: string;
  };
  achievementStats?: {
    totalAchievements: number;
    activeAchievements: number;
    totalUserAchievements: number;
    completionRate: string;
  };
  geoStats?: {
    totalActivities: number;
    totalSessions: number;
    totalUsers: number;
  };
}

/**
 * Export comprehensive dashboard summary to PDF
 */
export const exportDashboardSummary = (stats: DashboardStatsData): void => {
  const doc = new jsPDF('portrait');
  addHeader(doc, 'Admin Dashboard Summary', 'Comprehensive System Overview Report');
  
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageBreakThreshold = pageHeight - 80; // Leave 80pt margin at bottom for safety
  let yPos = 60;
  const sectionGap = 12;
  
  // Helper to check if we need a new page before a section
  const checkPageBreak = (estimatedHeight: number = 60) => {
    if (yPos + estimatedHeight > pageBreakThreshold) {
      doc.addPage();
      yPos = 25;
    }
  };
  
  // ============ USER STATISTICS ============
  checkPageBreak(50);
  yPos = addSectionHeader(doc, 'User Statistics', yPos, COLORS.primary);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Registered Users', stats.totalUsers.toLocaleString()],
      ['Admin Accounts', stats.totalAdmins.toLocaleString()],
      ['Regular Users', (stats.totalUsers - stats.totalAdmins).toLocaleString()],
    ],
    ...getTableStyles(COLORS.primary),
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + sectionGap;
  
  // ============ REPORT STATISTICS ============
  if (stats.reportStats) {
    const reportRowCount = 3 + (stats.reportStats.dismissedReports !== undefined ? 1 : 0) + (stats.reportStats.byType ? 3 : 0);
    checkPageBreak(40 + reportRowCount * 10);
    yPos = addSectionHeader(doc, 'Report Statistics', yPos, COLORS.danger);
    
    const reportData = [
      ['Total Reports', stats.reportStats.totalReports.toLocaleString()],
      ['Pending Review', stats.reportStats.pendingReports.toLocaleString()],
      ['Resolved', stats.reportStats.resolvedReports.toLocaleString()],
    ];
    
    if (stats.reportStats.dismissedReports !== undefined) {
      reportData.push(['Dismissed', stats.reportStats.dismissedReports.toLocaleString()]);
    }
    
    if (stats.reportStats.byType) {
      reportData.push(['Post Reports', (stats.reportStats.byType.post || 0).toLocaleString()]);
      reportData.push(['Message Reports', (stats.reportStats.byType.message || 0).toLocaleString()]);
      reportData.push(['User Reports', (stats.reportStats.byType.user || 0).toLocaleString()]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count']],
      body: reportData,
      ...getTableStyles(COLORS.danger),
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + sectionGap;
  }
  
  // ============ WORKOUT STATISTICS ============
  if (stats.workoutStats) {
    checkPageBreak(60);
    
    yPos = addSectionHeader(doc, 'Workout Statistics', yPos, COLORS.accent);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count']],
      body: [
        ['Total Workouts', stats.workoutStats.totalWorkouts.toLocaleString()],
        ['Bodyweight Exercises', stats.workoutStats.bodyweightWorkouts.toLocaleString()],
        ['Equipment Exercises', stats.workoutStats.equipmentWorkouts.toLocaleString()],
      ],
      ...getTableStyles(COLORS.accent),
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + sectionGap;
  }
  
  // ============ PROGRAM STATISTICS ============
  if (stats.programStats) {
    checkPageBreak(60);
    
    yPos = addSectionHeader(doc, 'Program Statistics', yPos, COLORS.purple);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Programs', stats.programStats.totalPrograms.toLocaleString()],
        ['Program Creators', stats.programStats.totalCreators.toLocaleString()],
        ['Avg Workouts/Program', stats.programStats.avgWorkoutsPerProgram],
      ],
      ...getTableStyles(COLORS.purple),
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + sectionGap;
  }
  
  // ============ FOOD LOG STATISTICS ============
  if (stats.foodLogStats) {
    checkPageBreak(70);
    
    yPos = addSectionHeader(doc, 'Food Log Statistics', yPos, COLORS.warning);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Food Logs', stats.foodLogStats.totalFoodLogs.toLocaleString()],
        ['Active Users', stats.foodLogStats.totalUsers.toLocaleString()],
        ['Recent Logs (7 days)', stats.foodLogStats.recentLogs.toLocaleString()],
        ['Avg Logs/User', stats.foodLogStats.averageLogsPerUser],
      ],
      ...getTableStyles(COLORS.warning),
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + sectionGap;
  }
  
  // ============ ACHIEVEMENT STATISTICS ============
  if (stats.achievementStats) {
    checkPageBreak(70);
    
    yPos = addSectionHeader(doc, 'Achievement Statistics', yPos, COLORS.secondary);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Achievements', stats.achievementStats.totalAchievements.toLocaleString()],
        ['Active Achievements', stats.achievementStats.activeAchievements.toLocaleString()],
        ['User Achievements Earned', stats.achievementStats.totalUserAchievements.toLocaleString()],
        ['Completion Rate', stats.achievementStats.completionRate],
      ],
      ...getTableStyles(COLORS.secondary),
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + sectionGap;
  }
  
  // ============ GEO ACTIVITY STATISTICS ============
  if (stats.geoStats) {
    checkPageBreak(60);
    
    yPos = addSectionHeader(doc, 'Geo Activity Statistics', yPos, COLORS.orange);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Activity Types', stats.geoStats.totalActivities.toLocaleString()],
        ['Total Sessions', stats.geoStats.totalSessions.toLocaleString()],
        ['Active Users', stats.geoStats.totalUsers.toLocaleString()],
      ],
      ...getTableStyles(COLORS.orange),
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' as const, fontStyle: 'bold' as const } }
    });
  }
  
  addFooter(doc);
  doc.save(`dashboard-summary-${new Date().toISOString().split('T')[0]}.pdf`);
};
