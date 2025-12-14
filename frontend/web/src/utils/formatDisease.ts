/**
 * Format disease name by capitalizing all words and removing underscores
 * @param disease - Disease name (e.g., "coronary_heart_disease")
 * @returns Formatted disease name (e.g., "Coronary Heart Disease")
 */
export const formatDiseaseName = (disease: string): string => {
  if (!disease) return '';
  
  // Replace underscores with spaces
  const withSpaces = disease.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
