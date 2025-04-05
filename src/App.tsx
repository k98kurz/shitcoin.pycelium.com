import React, { useState, useEffect, useCallback } from 'react';
import PaymentAnimation from './components/PaymentAnimation';
import Wallet from './components/Wallet';
import PriceDisplay from './components/PriceDisplay';
import SwapUI from './components/SwapUI';
import PriceChart from './components/PriceChart';
import { Coins } from 'lucide-react';
import { generateInitialPriceHistory } from './utils/chartUtils';

type Currency = '$HIT' | 'FauxUSD';

interface WalletState {
  $HIT: number;
  FauxUSD: number;
}

const INITIAL_PRICE = 420.69;
const PRICE_HISTORY_LENGTH = 200;
const PRICE_UPDATE_INTERVAL = 500; // ms (Updated to 0.5 seconds)
const SINE_WAVE_PERIOD_SECONDS = 60; // 1 minute cycle
const SINE_BIAS_MAGNITUDE = 0.01; // Max bias is +/- 1% of current price

function App() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [wallet, setWallet] = useState<WalletState>({ $HIT: 0.0069, FauxUSD: 420 });
  const [currentPrice, setCurrentPrice] = useState<number>(INITIAL_PRICE);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
	const [volatility, setVolatility] = useState<number>(0.08);

  // Generate initial price history ONCE when the component mounts
  useEffect(() => {
    const initialHistory = generateInitialPriceHistory(INITIAL_PRICE, PRICE_HISTORY_LENGTH);
    setPriceHistory(initialHistory);
    const lastGeneratedPrice = initialHistory[initialHistory.length - 1];
    const secondLastGeneratedPrice = initialHistory[initialHistory.length - 2] ?? lastGeneratedPrice;
    setCurrentPrice(lastGeneratedPrice);
    setPreviousPrice(secondLastGeneratedPrice);
  }, []); // Empty dependency array ensures this runs only once on mount


  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  // Update price periodically after animation is done
  useEffect(() => {
    if (showAnimation) return; // Don't run the interval timer during animation

    const intervalId = setInterval(() => {
      const nowSeconds = Date.now() / 1000; // Current time in seconds for sine wave calculation

      // Use functional updates to ensure we always have the latest state
      setCurrentPrice(prevCurrentPrice => {
        setPreviousPrice(prevCurrentPrice); // Store the old price before calculating new one

				// 0. Update volatility
				let vol = (Math.random() - 0.5) * 0.01 + volatility;
				if (vol < 0.02) {
					vol = 0.02;
				} else if (vol > 0.2) {
					vol = 0.2;
				}
				setVolatility(vol);

        // 1. Calculate random change (from base volatility)
        const randomChangeFactor = (Math.random() - 0.5) * vol;
        const randomChange = randomChangeFactor * prevCurrentPrice;

        // 2. Calculate sine wave bias based on time
        const angularFrequency = (2 * Math.PI) / SINE_WAVE_PERIOD_SECONDS;
        const sineValue = Math.sin(nowSeconds * angularFrequency);
        const sineBias = sineValue * SINE_BIAS_MAGNITUDE * prevCurrentPrice; // Bias up to +/- MAGNITUDE%

        // 3. Combine random change and sine bias
        const totalChange = randomChange + sineBias;

        // 4. Calculate new price, ensuring it doesn't go below a minimum threshold
        const newPrice = Math.max(0.01, prevCurrentPrice + totalChange);

        // Update price history using functional update as well
        setPriceHistory(prevHistory => {
          const updatedHistory = [...prevHistory, newPrice];
          // Keep only the last N points
          return updatedHistory.slice(-PRICE_HISTORY_LENGTH);
        });

        return newPrice; // Return the new price for setCurrentPrice
      });
    }, PRICE_UPDATE_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup interval
  }, [showAnimation]); // Dependency array includes only showAnimation

  const handleSwap = useCallback((fromCurrency: Currency, toCurrency: Currency, amount: number) => {
    setWallet(prevWallet => {
      const newWallet = { ...prevWallet };
      let amountToReceive: number;

      // Use the most up-to-date price for the swap calculation
      const priceForSwap = currentPrice;

      if (fromCurrency === '$HIT' && toCurrency === 'FauxUSD') {
        // Selling $HIT
        amountToReceive = amount * priceForSwap;
        // Check balance BEFORE making changes
        if (amount > prevWallet.$HIT) {
           console.warn("Attempted to sell more $HIT than available.");
           return prevWallet; // Not enough balance, return original wallet state
        }
        newWallet.$HIT -= amount;
        newWallet.FauxUSD += amountToReceive;
      } else if (fromCurrency === 'FauxUSD' && toCurrency === '$HIT') {
        // Buying $HIT
        amountToReceive = amount / priceForSwap;
         // Check balance BEFORE making changes
        if (amount > prevWallet.FauxUSD) {
           console.warn("Attempted to spend more FauxUSD than available.");
           return prevWallet; // Not enough balance, return original wallet state
        }
        newWallet.FauxUSD -= amount;
        newWallet.$HIT += amountToReceive;
      } else {
        console.error("Invalid swap pair");
        return prevWallet; // Invalid pair, return original wallet state
      }

      // Avoid negative balances due to potential floating point issues slightly below zero
      // Although checks above should prevent this, it's good practice
      newWallet.$HIT = Math.max(0, newWallet.$HIT);
      newWallet.FauxUSD = Math.max(0, newWallet.FauxUSD);

      return newWallet; // Return the updated wallet state
    });
  }, [currentPrice]); // Keep currentPrice dependency for swap calculation logic

  if (showAnimation) {
    // Pass the onComplete handler to the animation component
    return <PaymentAnimation onComplete={handleAnimationComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-10 px-4 sm:px-6 lg:px-8">
      <header className="max-w-4xl mx-auto mb-8 text-center">
         <div className="flex items-center justify-center mb-2">
           <Coins className="h-10 w-10 text-indigo-600 mr-3" />
           <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
             $HIT Coin Trader Pro
           </h1>
         </div>
         <p className="text-lg text-gray-600">The totally not sketchy platform for trading $HIT coins.</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <PriceDisplay price={currentPrice} previousPrice={previousPrice} />
          {/* Pass the priceHistory state to the chart */}
          <PriceChart data={priceHistory} height={250} />
        </div>

        <div className="space-y-6">
          <Wallet $hitBalance={wallet.$HIT} fauxUSDBalance={wallet.FauxUSD} />
          <SwapUI
            $hitBalance={wallet.$HIT}
            fauxUSDBalance={wallet.FauxUSD}
            currentPrice={currentPrice}
            onSwap={handleSwap}
          />
        </div>
      </main>

      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>Disclaimer: prices are made up.</p>
        <p>Exchange may collapse at our sole discretion.</p>
      </footer>
    </div>
  );
}

export default App;
