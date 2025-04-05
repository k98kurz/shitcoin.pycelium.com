import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';

type Currency = '$HIT' | 'FauxUSD';

interface SwapUIProps {
  $hitBalance: number;
  fauxUSDBalance: number;
  currentPrice: number; // Price of 1 HIT in FauxUSD
  onSwap: (fromCurrency: Currency, toCurrency: Currency, amount: number) => void;
}

const SwapUI: React.FC<SwapUIProps> = ({ $hitBalance, fauxUSDBalance, currentPrice, onSwap }) => {
  const [fromCurrency, setFromCurrency] = useState<Currency>('FauxUSD');
  const [toCurrency, setToCurrency] = useState<Currency>('$HIT');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (value: string, type: 'from' | 'to') => {
    const numericValue = parseFloat(value);
    setError(null); // Clear error on input change

    // Allow empty string or positive numbers
    if (value === '') {
      setFromAmount('');
      setToAmount('');
      return;
    }

    // Check for invalid characters or negative numbers after checking for empty
    if (isNaN(numericValue) || numericValue < 0) {
        if (type === 'from') setFromAmount(value); else setToAmount(value);
        setError("Please enter a valid positive number");
        // Clear the other field if the current one is invalid
        if (type === 'from') setToAmount(''); else setFromAmount('');
        return;
    }


    if (type === 'from') {
      setFromAmount(value);
      if (fromCurrency === 'FauxUSD') {
        // Buying $HIT with FauxUSD
        setToAmount((numericValue / currentPrice).toFixed(8));
      } else {
        // Selling $HIT for FauxUSD
        setToAmount((numericValue * currentPrice).toFixed(2));
      }
    } else { // type === 'to'
      setToAmount(value);
      if (toCurrency === '$HIT') {
        // Buying $HIT with FauxUSD
        setFromAmount((numericValue * currentPrice).toFixed(2));
      } else {
        // Selling $HIT for FauxUSD
        setFromAmount((numericValue / currentPrice).toFixed(8));
      }
    }
  };

  const switchCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setToAmount('');
		setFromAmount('');
  };


  const handleSwap = () => {
    let amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount to swap.");
      return;
    }

    const balance = fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance;
    if (amount > balance) {
      amount = balance;
    }

    setError(null);
    // Pass the precise numeric amount, not the potentially rounded string
    onSwap(fromCurrency, toCurrency, amount);
    // Clear inputs after successful swap if the user hit the max button
    if (amount == balance) {
      setFromAmount('');
      setToAmount('');
    }
  };

  // Recalculate 'toAmount' if price changes while amounts are entered
  useEffect(() => {
    if (fromAmount !== '' && !isNaN(parseFloat(fromAmount)) && parseFloat(fromAmount) >= 0) {
      handleAmountChange(fromAmount, 'from');
    }
     // If fromAmount becomes invalid (e.g., negative), clear toAmount
    else if (fromAmount !== '' && (isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) < 0)) {
       setToAmount('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice, fromCurrency, toCurrency]); // Keep fromAmount out to avoid loops, handleAmountChange covers it


  const handleMaxClick = () => {
    const balance = fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance;
    // Use a higher precision internally for calculation, but maybe display less
    const precision = fromCurrency === '$HIT' ? 8 : 2; // Use higher precision for HIT input
    const formattedBalance = balance.toFixed(precision);
    handleAmountChange(formattedBalance, 'from');
  };

  const handleAmountClick = (percentage: number) => {
    const balance = fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance;
    const amount = balance * percentage;
    handleAmountChange(amount.toFixed(fromCurrency === '$HIT' ? 8 : 2), 'from');
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Swap Currencies</h2>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4">
        {/* From Currency Input */}
        <div>
          <label htmlFor="fromAmount" className="block text-sm font-medium text-gray-500 mb-1">
            Spend ({fromCurrency})
          </label>
          <input
            type="number"
            id="fromAmount"
            value={fromAmount}
            onChange={(e) => handleAmountChange(e.target.value, 'from')}
            placeholder="0.00"
            min="0" // Prevent negative numbers via browser validation (though handled in JS too)
            step="any" // Allow decimals
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
           <p className="text-xs text-gray-500 mt-1">
             Balance: {' '}
             <button
               onClick={handleMaxClick}
               className="text-indigo-600 hover:text-indigo-800 focus:outline-none underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
               title={`Use max ${fromCurrency} balance`}
               // Disable if balance is effectively zero
               disabled={(fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance) <= 1e-9}
             >
               {(fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance).toFixed(fromCurrency === '$HIT' ? 4 : 2)}
             </button>
             &nbsp;&nbsp;&nbsp;(
             <button
              onClick={() => handleAmountClick(0.5)}
              className="text-indigo-600 hover:text-indigo-800 focus:outline-none underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              title="Use 50% of balance"
              disabled={(fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance) <= 1e-9}
             >
              50%
             </button>
             )&nbsp;&nbsp;&nbsp;(
             <button
              onClick={() => handleAmountClick(0.25)}
              className="text-indigo-600 hover:text-indigo-800 focus:outline-none underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              title="Use 25% of balance"
              disabled={(fromCurrency === '$HIT' ? $hitBalance : fauxUSDBalance) <= 1e-9}
             >
              25%
             </button>
             )
           </p>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <button
            onClick={switchCurrencies}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            aria-label="Switch currencies"
          >
            <ArrowRightLeft className="h-5 w-5" />
          </button>
        </div>

        {/* To Currency Input */}
        <div>
          <label htmlFor="toAmount" className="block text-sm font-medium text-gray-500 mb-1">
            Receive ({toCurrency})
          </label>
          <input
            type="number"
            id="toAmount"
            value={toAmount}
            onChange={(e) => handleAmountChange(e.target.value, 'to')}
            placeholder="0.00"
            min="0"
            step="any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
           <p className="text-xs text-gray-500 mt-1">Balance: {(toCurrency === '$HIT' ? $hitBalance : fauxUSDBalance).toFixed(toCurrency === '$HIT' ? 4 : 2)}</p>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          // Ensure amounts are valid numbers > 0 before enabling swap
          disabled={
             !fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0 ||
             !toAmount || isNaN(parseFloat(toAmount)) || parseFloat(toAmount) <= 0 ||
             !!error
           }
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Swap
        </button>
      </div>
    </div>
  );
};

export default SwapUI;
