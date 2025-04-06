import React from 'react';
import { Wallet as WalletIcon } from 'lucide-react'; // Renamed to avoid conflict

interface WalletProps {
  $hitBalance: number;
  fAuxUSDBalance: number;
}

const Wallet: React.FC<WalletProps> = ({ $hitBalance, fAuxUSDBalance }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
        <WalletIcon className="mr-2 h-5 w-5 text-indigo-600" /> My Wallet
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">$HIT:</span>
          <span className="text-lg font-bold text-indigo-700">{$hitBalance.toFixed(4)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">fAuxUSD:</span>
          <span className="text-lg font-bold text-green-700">{fAuxUSDBalance.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
