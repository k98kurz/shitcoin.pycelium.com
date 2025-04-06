import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { calculateSMA } from '../utils/chartUtils';

type Currency = '$HIT' | 'fAuxUSD';

interface SwapUIProps {
  $hitBalance: number;
  fAuxUSDBalance: number;
  currentPrice: number; // Price of 1 HIT in fAuxUSD
  onSwap: (fromCurrency: Currency, toCurrency: Currency, amount: number) => void;
  onStake: (multiplier: number) => void; // New onStake callback for staking bonus/penalty
  priceHistory: number[];
}

interface StakeOutcome {
  bonusMultiplier: number;
  isFailure: boolean;
  lockDuration: number;
  errorMessage?: string;
}

const SwapUI: React.FC<SwapUIProps> = ({
  $hitBalance,
  fAuxUSDBalance,
  currentPrice,
  onSwap,
  onStake,
  priceHistory,
}) => {
  const [fromCurrency, setFromCurrency] = useState<Currency>('fAuxUSD');
  const [toCurrency, setToCurrency] = useState<Currency>('$HIT');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // --- Staking-related state ---
  const [stakeLockRemaining, setStakeLockRemaining] = useState<number>(0);
  const [stakeOutcome, setStakeOutcome] = useState<StakeOutcome | null>(null);
  const [stakeError, setStakeError] = useState<string | null>(null);

  // --- Auto toggle states ---
  const [autoStakeEnabled, setAutoStakeEnabled] = useState<boolean>(false);
  const [autoSwapEnabled, setAutoSwapEnabled] = useState<boolean>(false);
  const [autoSwapPercentage, setAutoSwapPercentage] = useState<number>(10);

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
      if (type === 'from') setFromAmount(value);
      else setToAmount(value);
      setError("Please enter a valid positive number");
      // Clear the other field if the current one is invalid
      if (type === 'from') setToAmount('');
      else setFromAmount('');
      return;
    }

    if (type === 'from') {
      setFromAmount(value);
      if (fromCurrency === 'fAuxUSD') {
        // Buying $HIT with fAuxUSD
        setToAmount((numericValue / currentPrice).toFixed(8));
      } else {
        // Selling $HIT for fAuxUSD
        setToAmount((numericValue * currentPrice).toFixed(2));
      }
    } else {
      // type === 'to'
      setToAmount(value);
      if (toCurrency === '$HIT') {
        // Buying $HIT with fAuxUSD
        setFromAmount((numericValue * currentPrice).toFixed(2));
      } else {
        // Selling $HIT for fAuxUSD
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

    const balance = fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance;
    if (amount > balance) {
      amount = balance;
    }

    setError(null);
    // Pass the precise numeric amount, not the potentially rounded string
    onSwap(fromCurrency, toCurrency, amount);
    // Clear inputs after successful swap if the user hit the max button
    if (amount + 1e-9 >= balance || balance - amount <= 1e-6) {
      setFromAmount('');
      setToAmount('');
    } else if (amount > (balance - amount)) {
      setFromAmount((balance - amount).toFixed(fromCurrency === '$HIT' ? 8 : 2));
      setToAmount('');
    }
  };

  // Recalculate 'toAmount' if price changes while amounts are entered
  useEffect(() => {
    if (fromAmount !== '' && !isNaN(parseFloat(fromAmount)) && parseFloat(fromAmount) >= 0) {
      handleAmountChange(fromAmount, 'from');
    } else if (fromAmount !== '' && (isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) < 0)) {
      setToAmount('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice, fromCurrency, toCurrency]);

  const handleMaxClick = () => {
    const balance = fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance;
    const precision = fromCurrency === '$HIT' ? 8 : 2;
    const formattedBalance = balance.toFixed(precision);
    handleAmountChange(formattedBalance, 'from');
  };

  const handleAmountClick = (percentage: number) => {
    const balance = fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance;
    const amount = balance * percentage;
    handleAmountChange(amount.toFixed(fromCurrency === '$HIT' ? 8 : 2), 'from');
  };

  // --- New staking functionality ---
  const handleStakeCoins = () => {
    // Do nothing if a stake is already in progress.
    if (stakeLockRemaining > 0) return;

    // Clear the amount fields when staking starts
    setFromAmount('');
    setToAmount('');

    const roll = Math.random();
    if (roll < 0.1) {
      // Failure outcome: 10% chance — lock for 10 seconds, wallet is cut in half.
      const errorMessages = [
        "Validator node failed. Stake slashed!",
        "Coins lost to MEV attack!",
        "DeFi contract hack!",
        "Dex owner rug pulled!"
      ];
      const chosenError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      const outcome: StakeOutcome = {
        bonusMultiplier: 0.5, // wallet balances will be halved
        isFailure: true,
        lockDuration: 10,
        errorMessage: chosenError
      };
      setStakeOutcome(outcome);
      setStakeLockRemaining(outcome.lockDuration);
    } else {
      // Success outcome (95% chance) — pick one of three outcomes equally.
      const outcomes = [
        { bonusMultiplier: 1.05, lockDuration: 10 },
        { bonusMultiplier: 1.2, lockDuration: 30 },
        { bonusMultiplier: 1.5, lockDuration: 60 }
      ];
      const chosen = outcomes[Math.floor(Math.random() * outcomes.length)];
      const outcome: StakeOutcome = {
        ...chosen,
        isFailure: false
      };
      setStakeOutcome(outcome);
      setStakeLockRemaining(outcome.lockDuration);
    }
  };

  // Start a countdown (one interval per stake operation) when a stake is in progress.
  useEffect(() => {
    if (stakeOutcome !== null) {
      const timer = setInterval(() => {
        setStakeLockRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stakeOutcome]);

  // When the stake lock reaches 0, complete the stake operation.
  useEffect(() => {
    if (stakeLockRemaining === 0 && stakeOutcome !== null) {
      // Invoke the parent's onStake callback to update wallet balances.
      onStake(stakeOutcome.bonusMultiplier);
      // If this was a failure, show the error modal.
      if (stakeOutcome.isFailure) {
        setStakeError(stakeOutcome.errorMessage || "Unknown error");
      }
      // Clear the stake outcome so this effect does not run multiple times.
      setStakeOutcome(null);
    }
  }, [stakeLockRemaining, stakeOutcome, onStake]);

  // --- Refs to hold latest state/props for auto actions ---
  const autoStakeEnabledRef = useRef(autoStakeEnabled);
  useEffect(() => {
    autoStakeEnabledRef.current = autoStakeEnabled;
  }, [autoStakeEnabled]);

  const autoSwapEnabledRef = useRef(autoSwapEnabled);
  useEffect(() => {
    autoSwapEnabledRef.current = autoSwapEnabled;
  }, [autoSwapEnabled]);

  const stakeLockRemainingRef = useRef(stakeLockRemaining);
  useEffect(() => {
    stakeLockRemainingRef.current = stakeLockRemaining;
  }, [stakeLockRemaining]);

  const currentPriceRef = useRef(currentPrice);
  useEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  const fAuxUSDBalanceRef = useRef(fAuxUSDBalance);
  useEffect(() => {
    fAuxUSDBalanceRef.current = fAuxUSDBalance;
  }, [fAuxUSDBalance]);

  const $hitBalanceRef = useRef($hitBalance);
  useEffect(() => {
    $hitBalanceRef.current = $hitBalance;
  }, [$hitBalance]);

  const priceHistoryRef = useRef(priceHistory);
  useEffect(() => {
    priceHistoryRef.current = priceHistory;
  }, [priceHistory]);

  // Store onSwap in a ref (in case it changes)
  const onSwapRef = useRef(onSwap);
  useEffect(() => {
    onSwapRef.current = onSwap;
  }, [onSwap]);

  // Store handleStakeCoins in a ref
  const handleStakeCoinsRef = useRef(handleStakeCoins);
  useEffect(() => {
    handleStakeCoinsRef.current = handleStakeCoins;
  }, [handleStakeCoins]);

  // New ref for auto swap percentage
  const autoSwapPercentageRef = useRef(autoSwapPercentage);
  useEffect(() => {
    autoSwapPercentageRef.current = autoSwapPercentage;
  }, [autoSwapPercentage]);

  // --- AutoStake interval (runs every 7 seconds) ---
  useEffect(() => {
    const autoStakeInterval = setInterval(() => {
      if (!autoStakeEnabledRef.current) return;
      if (stakeLockRemainingRef.current !== 0) return;
      // Call the current stake function and clear any stake error
      handleStakeCoinsRef.current();
      setStakeError(null);
    }, 7000);
    return () => clearInterval(autoStakeInterval);
  }, []);

  // --- AutoSwap interval (runs every second) ---
  useEffect(() => {
    const autoSwapInterval = setInterval(() => {
      if (!autoSwapEnabledRef.current) return;
      if (stakeLockRemainingRef.current > 0) return; // Do nothing if coins are staked

      const smaArray = calculateSMA(priceHistoryRef.current, 20);
      const lastSma = smaArray[smaArray.length - 1];
      if (lastSma === null) return; // Not enough data
      // Get the configured proportion from the slider (percentage converted to fraction)
      const proportion = autoSwapPercentageRef.current / 100;
      if (currentPriceRef.current > lastSma) {
        const amount = fAuxUSDBalanceRef.current * proportion;
        if (amount > 0) {
          onSwapRef.current('fAuxUSD', '$HIT', amount);
        }
      } else if (currentPriceRef.current < lastSma) {
        const amount = $hitBalanceRef.current * proportion;
        if (amount > 0) {
          onSwapRef.current('$HIT', 'fAuxUSD', amount);
        }
      }
    }, 1000);
    return () => clearInterval(autoSwapInterval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      {/* Error Modal for stake failure */}
      {stakeError && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="text-red-600 font-bold mb-4">{stakeError}</p>
            <button
              onClick={() => setStakeError(null)}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Swap or Stake Coins</h2>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4">
        {/* Auto stake and auto swap checkboxes */}
        <div className="flex flex-row items-center space-x-2">
          <input
            type="checkbox"
            id="autoStake"
            className="form-checkbox h-5 w-5 text-indigo-600"
            checked={autoStakeEnabled}
            onChange={(e) => setAutoStakeEnabled(e.target.checked)}
          />
          <label htmlFor="autoStake" className="text-sm text-gray-700">Auto stake</label>
          <input
            type="checkbox"
            id="autoSwap"
            className="form-checkbox h-5 w-5 text-indigo-600"
            checked={autoSwapEnabled}
            onChange={(e) => setAutoSwapEnabled(e.target.checked)}
          />
          <label htmlFor="autoSwap" className="text-sm text-gray-700">Auto swap</label>
        </div>
        {/* Slider for autoSwap percentage (visible only when Auto swap is enabled) */}
        {autoSwapEnabled && (
          <div className="mt-2 w-full">
            <label htmlFor="autoSwapPercentage" className="text-sm text-gray-700">
              Auto swap percentage: {autoSwapPercentage}%
            </label>
            <input
              type="range"
              id="autoSwapPercentage"
              min="0"
              max="100"
              step="1"
              value={autoSwapPercentage}
              onChange={(e) => setAutoSwapPercentage(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {!autoSwapEnabled &&
          <>
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
                min="0"
                step="any"
                disabled={stakeLockRemaining > 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Balance:{' '}
                <button
                  onClick={handleMaxClick}
                  className="text-indigo-600 hover:text-indigo-800 focus:outline-none underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                  title={`Use max ${fromCurrency} balance`}
                  disabled={(fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance) <= 1e-9 || stakeLockRemaining > 0}
                >
                  {(fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance).toFixed(fromCurrency === '$HIT' ? 4 : 2)}
                </button>
                &nbsp;&nbsp;&nbsp;(
                <button
                  onClick={() => handleAmountClick(0.5)}
                  className="text-indigo-600 hover:text-indigo-800 focus:outline-none underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                  title="Use 50% of balance"
                  disabled={(fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance) <= 1e-9 || stakeLockRemaining > 0}
                >
                  50%
                </button>
                )&nbsp;&nbsp;&nbsp;(
                <button
                  onClick={() => handleAmountClick(0.25)}
                  className="text-indigo-600 hover:text-indigo-800 focus:outline-none underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                  title="Use 25% of balance"
                  disabled={(fromCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance) <= 1e-9 || stakeLockRemaining > 0}
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
                disabled={stakeLockRemaining > 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Balance: {(toCurrency === '$HIT' ? $hitBalance : fAuxUSDBalance).toFixed(toCurrency === '$HIT' ? 4 : 2)}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              {/* Swap Button: also disabled when a stake is in progress */}
              <button
                onClick={handleSwap}
                disabled={
                  !fromAmount ||
                  isNaN(parseFloat(fromAmount)) ||
                  parseFloat(fromAmount) <= 0 ||
                  !toAmount ||
                  isNaN(parseFloat(toAmount)) ||
                  parseFloat(toAmount) <= 0 ||
                  !!error ||
                  stakeLockRemaining > 0
                }
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Swap
              </button>
            </div>
          </>
        }

        <div className="flex flex-col items-center space-y-2">
          {/* Stake Coins Button */}
          {!autoStakeEnabled &&
            <button
              onClick={handleStakeCoins}
              disabled={stakeLockRemaining > 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Stake Coins
            </button>
          }
          {/* Display the staking lock remaining message and expected rewards */}
          {stakeLockRemaining > 0 && stakeOutcome && (
            <div>
              <p className="text-sm text-center text-gray-600 mt-2">
                Coins locked: {stakeLockRemaining} second{stakeLockRemaining === 1 ? '' : 's'} remaining
              </p>
              <p className="text-sm text-center text-gray-600">
                Expected rewards: {stakeOutcome.isFailure ? '5%' : `${((stakeOutcome.bonusMultiplier - 1) * 100).toFixed(0)}%`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapUI;
