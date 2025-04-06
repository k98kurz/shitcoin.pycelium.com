import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceDisplayProps {
  price: number;
  previousPrice: number | null;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, previousPrice }) => {
  const priceChange = previousPrice !== null ? price - previousPrice : 0;
  const isUp = priceChange >= 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-semibold mb-2 text-gray-700">fAuxUSD / $HIT</h2>
      <div className="flex items-center justify-center space-x-2">
         <p className={`text-4xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
           {price.toFixed(4)}
         </p>
         {previousPrice !== null && (
            isUp ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-red-600" />
         )}
      </div>
       <p className="text-sm text-gray-500 mt-1">
         {previousPrice !== null ? `Change: ${priceChange.toFixed(4)} (${((priceChange / previousPrice) * 100).toFixed(2)}%)` : 'Loading price...'}
       </p>
    </div>
  );
};

export default PriceDisplay;
