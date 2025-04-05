/**
 * Generates initial price history data.
 * @param initialPrice The starting price.
 * @param count The number of data points to generate.
 * @returns An array of price numbers.
 */
export const generateInitialPriceHistory = (initialPrice: number, count: number): number[] => {
  const history: number[] = [initialPrice];
  let current = initialPrice;
  for (let i = 1; i < count; i++) {
    const change = (Math.random() - 0.5) * 0.1 * current; // +/- up to 5%
    current = Math.max(0.01, current + change);
    history.push(current);
  }
  return history;
};

/**
 * Calculates the Simple Moving Average (SMA) for a given dataset and period.
 * @param data The array of numbers.
 * @param period The period for the SMA calculation.
 * @returns An array containing SMA values, with nulls at the beginning.
 */
export const calculateSMA = (data: number[], period: number): (number | null)[] => {
  if (period <= 0 || data.length < period) {
    // Return array of nulls if period is invalid or data is too short
    return Array(data.length).fill(null);
  }

  const sma: (number | null)[] = Array(period - 1).fill(null); // Pad beginning with nulls

  // Calculate sum for the first valid SMA point
  let sum = 0;
  for (let k = 0; k < period; k++) {
    sum += data[k];
  }
  sma.push(sum / period);

  // Calculate subsequent SMA points efficiently
  for (let i = period; i < data.length; i++) {
    sum -= data[i - period]; // Subtract the oldest value from the window
    sum += data[i];         // Add the newest value to the window
    sma.push(sum / period);
  }

  return sma;
};


/**
 * Creates an SVG path string for a simple line chart from numeric data points.
 * Handles scaling and padding. Correctly maps points even if data starts with nulls.
 * @param data The array of data points (can include nulls).
 * @param width The width of the SVG chart area.
 * @param height The height of the SVG chart area.
 * @param dataMin Pre-calculated minimum value of the combined dataset (price + SMA) for scaling.
 * @param dataMax Pre-calculated maximum value of the combined dataset (price + SMA) for scaling.
 * @param totalPoints Total number of points in the original dataset for x-scaling.
 * @returns The SVG path 'd' attribute string, potentially with multiple "M" commands if there are gaps (nulls).
 */
export const generateSvgPath = (
  data: (number | null)[],
  width: number,
  height: number,
  dataMin: number,
  dataMax: number,
  totalPoints: number
): string => {
  if (totalPoints < 2) return '';

  const dataRange = dataMax - dataMin === 0 ? 1 : dataMax - dataMin; // Avoid division by zero
  const padding = dataRange * 0.05; // 5% padding
  const effectiveHeight = height - 2 * padding;
  const effectiveMin = dataMin - padding;
  const effectiveRange = dataRange + 2 * padding;

  let pathSegments: string[] = [];
  let currentSegmentPoints: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const value = data[i];

    if (value !== null) {
      // Calculate x based on the original index relative to the total number of points
      const x = (i / (totalPoints - 1)) * width;

      // Adjust y calculation for padding
      const y = height - (padding + ((value - effectiveMin) / effectiveRange) * effectiveHeight);
      // Ensure y is within bounds
      const clampedY = Math.max(0, Math.min(height, y));
      currentSegmentPoints.push(`${x.toFixed(2)},${clampedY.toFixed(2)}`);
    } else {
      // End the current segment if we encounter a null and the segment has points
      if (currentSegmentPoints.length > 0) {
        // Need at least 2 points for a line segment (M + L)
        if (currentSegmentPoints.length >= 2) {
           pathSegments.push(`M ${currentSegmentPoints.join(' L ')}`);
        } else {
           // Handle single point segment if needed (e.g., draw a small circle)
           // For a line chart, a single point doesn't draw anything, so we can just ignore it
           // or add specific logic here if desired.
        }
        currentSegmentPoints = []; // Start a new segment
      }
    }
  }

  // Add the last segment if it has points
  if (currentSegmentPoints.length >= 2) {
    pathSegments.push(`M ${currentSegmentPoints.join(' L ')}`);
  }

  return pathSegments.join(' '); // Join segments (each starts with M)
};
