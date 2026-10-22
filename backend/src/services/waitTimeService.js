// JavaScript - Wait Time Estimation Service
// backend/src/services/waitTimeService.js 

async function calculateWaitTime({
  customersAhead, averageServiceTime = 5, activeCounters = 1
}) {
  const safeAhead = Math.max(0, parseInt(customersAhead, 10) || 0); 
  const safeAvgTime = Math.max(1, parseFloat(averageServiceTime) || 5); 
  const safeCounters = Math.max(1, parseInt(activeCounters, 10) || 1);

  // Core Queuing Formula
  const rawWait = (safeAhead * safeAvgTime) / safeCounters; 
  const estimatedMinutes = Math.round(rawWait);

  let formattedWait = '0 min'; 
  if (estimatedMinutes === 1) {
    formattedWait = '1 min';
  } else if (estimatedMinutes > 1) { 
    formattedWait = `${estimatedMinutes} min`;
  }

  return { 
    estimatedMinutes, 
    formattedWait,
    customersAhead: safeAhead, 
    activeCounters: safeCounters
  };
}

function calculateRollingAverageServiceTime(baseline = 5, completedIntervals = []) {
  if (!completedIntervals || completedIntervals.length === 0) {
    return baseline;
  }
  const lastFive = completedIntervals.slice(-5);
  const avgRecent = lastFive.reduce((sum, val) => sum + val, 0) / lastFive.length;
  // Adaptive rolling formulation: (0.7 * Configured Baseline) + (0.3 * Last 5 Completed Intervals)
  return Math.round(((0.7 * baseline) + (0.3 * avgRecent)) * 10) / 10;
}

module.exports = { calculateWaitTime, calculateRollingAverageServiceTime };
