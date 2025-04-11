import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceDisplayProps {
  price: number;
  previousPrice: number | null;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, previousPrice }) => {
  const priceChange = previousPrice !== null ? price - previousPrice : 0;
  const isUp = priceChange >= 0;

  // Save the app start time in a ref so it persists
  const appStart = useRef(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Update elapsed time every second
    const intervalId = setInterval(() => {
      setElapsedTime(Date.now() - appStart.current);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Format the elapsed milliseconds into either seconds, minutes, or hours.
  const formatElapsedTime = (ms: number): string => {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) {
      return `${sec} seconds`;
    } else if (sec < 3600) {
      const min = sec / 60;
      return `${min.toFixed(1)} minutes`;
    } else {
      const hr = sec / 3600;
      return `${hr.toFixed(1)} hours`;
    }
  };

  const formattedTime = formatElapsedTime(elapsedTime);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-semibold mb-2 text-gray-700">
        <span className="relative group cursor-help">
          fAuxUSD
          <span className="absolute w-96 left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            ∫ (Au(x, USD)) is the integrated gold-cross-USD swap derivative that has had proven stability for {formattedTime}
          </span>
        </span>
        {" / "}
        <span className="relative group cursor-help">
          $HIT
          <span className="absolute w-96 left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            $HIT is the High Intensity Trading token, designed to compress a decade of financial market stress into a single afternoon
          </span>
        </span>
      </h2>
      <div className="flex items-center justify-center space-x-2">
        <p className={`text-4xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {price.toFixed(4)}
        </p>
        {previousPrice !== null && (
          isUp ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-red-600" />
        )}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {previousPrice !== null
          ? `Change: ${priceChange.toFixed(4)} (${((priceChange / previousPrice) * 100).toFixed(2)}%)`
          : 'Loading price...'}
      </p>
    </div>
  );
};

export default PriceDisplay;
