import React, { useEffect, useState } from 'react';
// Use Loader2 instead of LoaderCircle
import { Loader2, CheckCircle } from 'lucide-react';

interface PaymentAnimationProps {
  onComplete: () => void;
}

const PaymentAnimation: React.FC<PaymentAnimationProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'processing' | 'complete'>('processing');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('complete');
    }, 2500); // Simulate processing time

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3500); // Show complete message briefly

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white z-50">
      <div className="bg-white/20 backdrop-blur-lg p-8 rounded-lg shadow-xl text-center">
        {status === 'processing' ? (
          <>
            {/* Use Loader2 here */}
            <Loader2 className="animate-spin h-16 w-16 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-semibold mb-2">Processing Secure Payment</h2>
            <p className="text-lg opacity-80">Please wait while we verify your transaction...</p>
            <div className="w-full bg-white/30 rounded-full h-2.5 mt-6">
              <div className="bg-green-400 h-2.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-lg opacity-80">Redirecting to your trading dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentAnimation;
