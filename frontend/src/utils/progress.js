/**
 * Progress / loading bar colors (3 Tiers):
 * - Lower than 30 (< 30%): Red
 * - Above 30 (>= 30% and < 80%): Blue
 * - Above 80 (>= 80%): Green
 */

export const getProgressBarColor = (percentage) => {
  const p = Number(percentage) || 0;
  if (p >= 80) return 'bg-emerald-500';
  if (p >= 30) return 'bg-blue-500';
  return 'bg-red-500';
};

export const getProgressTextColor = (percentage) => {
  const p = Number(percentage) || 0;
  if (p >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (p >= 30) return 'text-blue-600 dark:text-blue-400';
  return 'text-red-600 dark:text-red-400';
};

export const getProgressBadge = (percentage) => {
  const p = Number(percentage) || 0;
  if (p >= 80) {
    return {
      label: p >= 100 ? 'Achieved' : 'On Track',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  if (p >= 30) {
    return {
      label: 'In Progress',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }
  return {
    label: 'Low Progress',
    badgeClass: 'bg-red-50 text-red-700 border-red-200'
  };
};
