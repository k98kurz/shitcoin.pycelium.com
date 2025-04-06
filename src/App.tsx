import { useState, useEffect, useCallback } from 'react';
import PaymentAnimation from './components/PaymentAnimation';
import Wallet from './components/Wallet';
import PriceDisplay from './components/PriceDisplay';
import SwapUI from './components/SwapUI';
import PriceChart from './components/PriceChart';
import { Coins } from 'lucide-react';
import { generateInitialPriceHistory } from './utils/chartUtils';

type Currency = '$HIT' | 'fAuxUSD';

interface WalletState {
  $HIT: number;
  fAuxUSD: number;
}

const INITIAL_PRICE = 420.69;
const PRICE_HISTORY_LENGTH = 200;
const PRICE_UPDATE_INTERVAL = 500; // ms (0.5 seconds)
const SHORT_MOMENTUM_WAVE_PERIOD = 60; // 1 minute cycle
const SHORT_MOMENTUM_MAGNITUDE = 0.01; // +/- 1% bias
const LONG_MOMENTUM_WAVE_PERIOD = 600; // 10 minute cycle
const LONG_MOMENTUM_MAGNITUDE = 0.005; // +/- 0.5% bias

let intervalId: number|undefined = undefined;

function App() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [wallet, setWallet] = useState<WalletState>({ $HIT: 0.0069, fAuxUSD: 420 });
  const [currentPrice, setCurrentPrice] = useState<number>(INITIAL_PRICE);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [volatility, setVolatility] = useState<number>(0.08);

  // Generate initial price history ONCE on mount.
  useEffect(() => {
    const initialHistory = generateInitialPriceHistory(INITIAL_PRICE, PRICE_HISTORY_LENGTH);
    setPriceHistory(initialHistory);
    const lastGeneratedPrice = initialHistory[initialHistory.length - 1];
    const secondLastGeneratedPrice = initialHistory[initialHistory.length - 2] ?? lastGeneratedPrice;
    setCurrentPrice(lastGeneratedPrice);
    setPreviousPrice(secondLastGeneratedPrice);
  }, []);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  /*
  const debugPriceTo3000 = () => {
    setCurrentPrice(prevCurrentPrice => {
      setPreviousPrice(prevCurrentPrice);
      setPriceHistory(prevHistory => {
        const updatedHistory = [...prevHistory, 3000];
        return updatedHistory.slice(-PRICE_HISTORY_LENGTH);
      });
      return 3000;
    });
  };
  */
  /*
  const debugPriceTo3000th = () => {
    setCurrentPrice(prevCurrentPrice => {
      setPreviousPrice(prevCurrentPrice);
      setPriceHistory(prevHistory => {
        const updatedHistory = [...prevHistory, 1/3000];
        return updatedHistory.slice(-PRICE_HISTORY_LENGTH);
      });
      return 1/3000;
    });
  };
  */

  // Periodically update the price (once the animation is done).
  useEffect(() => {
    if (showAnimation) return;

    intervalId = setInterval(() => {
      const nowSeconds = Date.now() / 1000;
      setCurrentPrice(prevCurrentPrice => {
        setPreviousPrice(prevCurrentPrice);
        let vol = (Math.random() - 0.5) * 0.01 + volatility;
        if (vol < 0.02) vol = 0.02;
        else if (vol > 0.2) vol = 0.2;
        setVolatility(vol);

        const randomChange = ((Math.random() - 0.5) * vol) * prevCurrentPrice;
        const shortMomentum = Math.sin(nowSeconds * (2 * Math.PI) / SHORT_MOMENTUM_WAVE_PERIOD);
        const shortMomentumBias = shortMomentum * SHORT_MOMENTUM_MAGNITUDE * prevCurrentPrice;
        const longMomentum = Math.sin(nowSeconds * (2 * Math.PI) / LONG_MOMENTUM_WAVE_PERIOD);
        const longMomentumBias = longMomentum * LONG_MOMENTUM_MAGNITUDE * prevCurrentPrice;
        const totalChange = randomChange + shortMomentumBias + longMomentumBias;
        const newPrice = Math.max(0.01, prevCurrentPrice + totalChange);

        setPriceHistory(prevHistory => {
          const updatedHistory = [...prevHistory, newPrice];
          return updatedHistory.slice(-PRICE_HISTORY_LENGTH);
        });
        return newPrice;
      });
    }, PRICE_UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [showAnimation, volatility]);

  // const stopSimulation = () => {
  //   clearInterval(intervalId);
  // };

  const handleSwap = useCallback((fromCurrency: Currency, toCurrency: Currency, amount: number) => {
    setWallet(prevWallet => {
      const newWallet = { ...prevWallet };
      let amountToReceive: number;
      const priceForSwap = currentPrice;

      if (fromCurrency === '$HIT' && toCurrency === 'fAuxUSD') {
        amountToReceive = amount * priceForSwap;
        if (amount > prevWallet.$HIT) {
          console.warn("Attempted to sell more $HIT than available.");
          return prevWallet;
        }
        newWallet.$HIT -= amount;
        newWallet.fAuxUSD += amountToReceive;
      } else if (fromCurrency === 'fAuxUSD' && toCurrency === '$HIT') {
        amountToReceive = amount / priceForSwap;
        if (amount > prevWallet.fAuxUSD) {
          console.warn("Attempted to spend more fAuxUSD than available.");
          return prevWallet;
        }
        newWallet.fAuxUSD -= amount;
        newWallet.$HIT += amountToReceive;
      } else {
        console.error("Invalid swap pair");
        return prevWallet;
      }
      newWallet.$HIT = Math.max(0, newWallet.$HIT);
      newWallet.fAuxUSD = Math.max(0, newWallet.fAuxUSD);
      return newWallet;
    });
  }, [currentPrice]);

  // New callback for staking — updates wallet balances using the provided multiplier.
  const handleStake = useCallback((multiplier: number) => {
    setWallet(prevWallet => ({
      $HIT: prevWallet.$HIT * multiplier,
      fAuxUSD: prevWallet.fAuxUSD * multiplier,
    }));
  }, []);

  if (showAnimation) {
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
          <PriceChart data={priceHistory} height={250} />
        </div>

        <div className="space-y-6">
          <Wallet $hitBalance={wallet.$HIT} fAuxUSDBalance={wallet.fAuxUSD} />
          <SwapUI
            $hitBalance={wallet.$HIT}
            fAuxUSDBalance={wallet.fAuxUSD}
            currentPrice={currentPrice}
            onSwap={handleSwap}
            onStake={handleStake}
            priceHistory={priceHistory}
          />
        </div>

        {/* <div className="space-y-6">
          <button onClick={debugPriceTo3000}>Debug: set price to 3000</button>
          <button onClick={debugPriceTo3000th}>Debug: set price to 1/3000</button>
          <button onClick={stopSimulation}>Stop simulation</button>
        </div> */}
      </main>

      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>Disclaimer: prices are made up.</p>
        <p>Exchange may collapse at our sole discretion.</p>
      </footer>
    </div>
  );
}

export default App;
