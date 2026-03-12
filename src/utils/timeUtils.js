/**
 * Convert float time (e.g., 9.5) to HH:MM format (e.g., "09:30")
 * @param {number|null} floatTime - The time as a float (hours.decimal)
 * @returns {string} - Formatted time string or empty string if null
 */
export const floatToTime = (floatTime) => {
  if (floatTime === null || floatTime === undefined) {
    return '';
  }
  
  const hours = Math.floor(floatTime);
  const minutes = Math.round((floatTime - hours) * 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Format a time slot from float times
 * @param {number|null} t1 - Start time as float
 * @param {number|null} t2 - End time as float
 * @returns {string} - Formatted time range or status message
 */
export const formatTimeSlot = (t1, t2) => {
  if (t1 === null || t2 === null) {
    return 'Unavailable';
  }
  
  return `${floatToTime(t1)} - ${floatToTime(t2)}`;
};

/**
 * Check if a time slot is available
 * @param {object} timing - Timing object with t1 and t2 properties
 * @returns {boolean} - True if slot has valid times
 */
export const isSlotAvailable = (timing) => {
  return timing && timing.t1 !== null && timing.t2 !== null;
};
