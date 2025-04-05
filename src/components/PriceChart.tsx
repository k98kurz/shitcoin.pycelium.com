import React from 'react';
import { generateSvgPath, calculateSMA } from '../utils/chartUtils';

interface PriceChartProps {
  data: number[];
  width?: number; // Intrinsic SVG width
  height?: number; // Intrinsic SVG height
  smaPeriod?: number; // SMA period
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  width = 400,
  height = 200,
  smaPeriod = 20
}) => {
  // Ensure we have enough data points for meaningful display and SMA calculation
  const MIN_POINTS_FOR_SMA = Math.max(2, smaPeriod); // Need at least 2 points for a line, and `smaPeriod` for SMA
  if (!data || data.length < MIN_POINTS_FOR_SMA) {
    return (
      <div
        className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center text-gray-400"
        style={{ minHeight: `${height}px` }}
      >
        {data.length < 2 ? 'Generating price history...' : `Need ${MIN_POINTS_FOR_SMA} data points for SMA...`}
      </div>
    );
  }

  // Calculate SMA
  const smaData = calculateSMA(data, smaPeriod);

  // Determine overall min/max for consistent scaling across price and SMA
  // Filter out nulls from SMA data before finding min/max
  const validSmaValues = smaData.filter(v => v !== null) as number[];
  // Ensure we don't try to spread an empty array if SMA calculation resulted in all nulls (unlikely with check above, but safe)
  const allValues = [...data, ...(validSmaValues.length > 0 ? validSmaValues : [])];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);

  // Generate paths using the updated generateSvgPath function
  const pricePathData = generateSvgPath(data, width, height, dataMin, dataMax, data.length);
  const smaPathData = generateSvgPath(smaData, width, height, dataMin, dataMax, data.length);


  // Determine price line color based on SMA
  const lastPrice = data[data.length - 1];
  const lastSma = smaData[smaData.length - 1]; // Will be null if data.length < smaPeriod

  let priceStrokeColor = 'stroke-red-500'; // Default to red (price < SMA or SMA not available)
  if (lastSma !== null && lastPrice >= lastSma) {
    priceStrokeColor = 'stroke-blue-500'; // Blue if price >= SMA
  }
  // Note: No fallback needed here, red is the default if lastSma is null.

  return (
    <div className="bg-white p-4 rounded-lg shadow-md overflow-hidden">
       <h3 className="text-sm font-medium text-gray-500 mb-2">Price History (Last {data.length} points)</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none" // Allows stretching
        className="w-full" // Take full width of container
        style={{ height: `${height}px` }} // Set explicit height for the SVG area
      >
        {/* SMA Line (drawn first, so it's underneath) */}
        <path
          d={smaPathData}
          fill="none"
          className="stroke-orange-400 opacity-70"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 4" // Make SMA dashed
        />
         {/* Price Line */}
        <path
          d={pricePathData}
          fill="none"
          className={`${priceStrokeColor} transition-stroke duration-300 ease-in-out`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
       {/* Optional: Add legend or labels later */}
       <div className="flex justify-end space-x-4 text-xs mt-2 px-2">
         <div className="flex items-center">
           <span className="w-3 h-0.5 bg-blue-500 mr-1"></span> Price &gt;= SMA
         </div>
         <div className="flex items-center">
           <span className="w-3 h-0.5 bg-red-500 mr-1"></span> Price &lt; SMA
         </div>
         <div className="flex items-center">
           <span className="w-3 h-0.5 border-t border-dashed border-orange-400 opacity-70 mr-1"></span> SMA ({smaPeriod})
         </div>
       </div>
    </div>
  );
};

export default PriceChart;
