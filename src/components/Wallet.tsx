import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Wallet as WalletIcon } from 'lucide-react'; // Renamed to avoid conflict

interface WalletProps {
  $hitBalance: number;
  fAuxUSDBalance: number;
  currentPrice: number;
  onWalletUpdate: (updater: (prevWallet: { $HIT: number; fAuxUSD: number }) => { $HIT: number; fAuxUSD: number }) => void;
}

const Wallet: React.FC<WalletProps> = ({ $hitBalance, fAuxUSDBalance, currentPrice, onWalletUpdate }) => {
  const score = useMemo(() => {
    return Math.log((fAuxUSDBalance + ($hitBalance * currentPrice)) + 1) * Math.PI;
  }, [$hitBalance, fAuxUSDBalance, currentPrice]);

  // --- Withdrawal modal state and logic ---
  // Modal stages: 'confirm' (initial confirmation),
  // 'blockchain' (processing on the blockchain), or 'result' (final message)
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState<'confirm' | 'blockchain' | 'result'>('confirm');
  // Withdrawal (drain) rate, starting at 1% per second
  const [withdrawRate, setWithdrawRate] = useState(0.01);
  // Message shown in the final result stage
  const [resultMessage, setResultMessage] = useState('');
  // Refs to hold interval and timeout IDs so they can be cleared if needed.
  const withdrawalIntervalRef = useRef<number | null>(null);
  const blockchainTimeoutRef = useRef<number | null>(null);

  // Every second while the modal is open (and not in the final result stage),
  // update the wallet state in App by reducing both balances by the current drain rate.
  useEffect(() => {
    if (showModal && modalStage !== 'result') {
      // Clear any existing interval to avoid duplicates.
      if (withdrawalIntervalRef.current) {
        clearInterval(withdrawalIntervalRef.current);
      }
      withdrawalIntervalRef.current = window.setInterval(() => {
        onWalletUpdate(prev => ({
          $HIT: prev.$HIT * (1 - withdrawRate),
          fAuxUSD: prev.fAuxUSD * (1 - withdrawRate),
        }));
      }, 1000);
      return () => {
        if (withdrawalIntervalRef.current) {
          clearInterval(withdrawalIntervalRef.current);
        }
      };
    }
  }, [showModal, modalStage, withdrawRate, onWalletUpdate]);

  // When the user clicks on the wallet icon, open the modal.
  const handleWalletIconClick = () => {
    setWithdrawRate(0.001);
    setModalStage('confirm');
    setShowModal(true);
  };

  // Cancel the withdrawal process: stop any intervals/timeouts and close the modal.
  const handleCancel = () => {
    if (withdrawalIntervalRef.current) {
      clearInterval(withdrawalIntervalRef.current);
    }
    if (blockchainTimeoutRef.current) {
      clearTimeout(blockchainTimeoutRef.current);
    }
    setShowModal(false);
  };

  // When the user confirms the withdrawal, change the drain rate to 10%,
  // display the blockchain confirmation message and set a random timeout.
  const handleConfirm = () => {
    if (modalStage === 'confirm') {
      if (withdrawalIntervalRef.current) {
        clearInterval(withdrawalIntervalRef.current);
      }
      setWithdrawRate(0.05);
      setModalStage('blockchain');
      // Set a random delay between 3 and 9 seconds.
      const delaySeconds = Math.floor(Math.random() * 7) + 3;
      blockchainTimeoutRef.current = window.setTimeout(() => {
        if (withdrawalIntervalRef.current) {
          clearInterval(withdrawalIntervalRef.current);
        }
        // Convert all remaining $HIT to fAuxUSD and display the result.
        onWalletUpdate(prev => {
          const convertedUSD = prev.fAuxUSD + (prev.$HIT * currentPrice);
          const profit = convertedUSD - 420.69;
          if (profit > 0) {
            setResultMessage(`Congrats, you cleared ${profit.toFixed(2)} fAuxUSD profit`);
          } else {
            setResultMessage(`You gave up ${Math.abs(profit).toFixed(2)} fAuxUSD, thanks for your business`);
          }
          return { $HIT: 0, fAuxUSD: convertedUSD };
        });
        setModalStage('result');
        // After displaying the result, refresh the page after 10 seconds.
        setTimeout(() => {
          window.location.reload();
        }, 10000);
      }, delaySeconds * 1000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
        <WalletIcon onClick={handleWalletIconClick} className="mr-2 h-5 w-5 text-indigo-600 cursor-pointer" /> My Wallet
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
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">Score:</span>
          <span className="text-lg font-bold text-indigo-700">{score.toFixed(3)}</span>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            {modalStage === 'confirm' && (
              <>
                <h3 className="text-lg font-bold mb-4">Confirm Withdrawal</h3>
                <div className="flex justify-end space-x-4">
                  <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
                    Cancel
                  </button>
                  <button onClick={handleConfirm} className="px-4 py-2 bg-indigo-600 text-white rounded">
                    Confirm
                  </button>
                </div>
              </>
            )}
            {modalStage === 'blockchain' && (
              <>
                <h3 className="text-lg font-bold mb-4">Confirming transaction on the blockchain...</h3>
                <div className="flex justify-end">
                  <button onClick={handleCancel} className="px-2 py-1 bg-gray-400 text-white rounded text-sm">
                    Cancel
                  </button>
                </div>
              </>
            )}
            {modalStage === 'result' && (
              <>
                <h3 className="text-lg font-bold mb-4">{resultMessage}</h3>
                <p className="text-sm">Redirecting to the next phase in 10 seconds...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
