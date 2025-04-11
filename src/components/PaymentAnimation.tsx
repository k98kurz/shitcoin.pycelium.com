import React, { useEffect, useState } from 'react';
// Use Loader2 instead of LoaderCircle
import { Loader2, CheckCircle } from 'lucide-react';

interface PaymentAnimationProps {
  onComplete: () => void;
}

const PaymentAnimation: React.FC<PaymentAnimationProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'processing' | 'complete'>('processing');
  const [showForm, setShowForm] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const cardNumberTarget = "1234 5678 1234 5678";
  const billingAddressTarget = "123 0th Street Nowhere, XZ 00000";
  const nameOnCardTarget = "Defi Degen, Jr.";

  // Animate typing effect sequentially for each field
  useEffect(() => {
    const animateField = (
      target: string,
      setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
      return new Promise<void>((resolve) => {
        let index = 0;
        const interval = setInterval(() => {
          // Capture the current character before updating index.
          const char = target.charAt(index);
          setter((prev) => prev + char);
          index++;
          if (index === target.length) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    };

    (async () => {
      await animateField(cardNumberTarget, setCardNumber);
      await animateField(billingAddressTarget, setBillingAddress);
      await animateField(nameOnCardTarget, setNameOnCard);
      // After all fields finish typing, wait an additional 300 ms, then hide the form.
      setTimeout(() => {
        setShowForm(false);
      }, 300);
    })();
  }, []);

  // Start the spinner animation (and later the payment success) once the form is gone.
  useEffect(() => {
    if (!showForm) {
      const processingTimer = setTimeout(() => {
        setStatus('complete');
      }, 2500); // Change to complete after spinner is shown for 2.5 seconds

      const completeTimer = setTimeout(() => {
        onComplete();
      }, 3500); // After 3.5 seconds, call onComplete

      return () => {
        clearTimeout(processingTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [showForm, onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center z-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="text-center py-2">
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          >
            epirts
          </h1>
        </header>
        {/* Main content */}
        <main className="mb-2">
          {showForm ? (
            <>
              {/* Product details */}
              <div className="bg-white/20 backdrop-blur-lg p-4 rounded-lg shadow-xl text-center mb-4">
                <h3 className="text-xl font-bold text-white">"Stable" Coins</h3>
                <p className="text-lg text-white">$420.69</p>
              </div>
              {/* Credit Card Form with auto-typing */}
              <div className="bg-white/20 backdrop-blur-lg p-4 rounded-lg shadow-xl text-center">
                <form className="text-left">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-white">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      readOnly
                      className="mt-1 w-full rounded-md border-gray-300 px-2 py-1 bg-white/90 shadow-sm"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-white">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      value={billingAddress}
                      readOnly
                      className="mt-1 w-full rounded-md border-gray-300 px-2 py-1 bg-white/90 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={nameOnCard}
                      readOnly
                      className="mt-1 w-full rounded-md border-gray-300 px-2 py-1 bg-white/90 shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md mt-4 w-full"
                  >
                    Checkout
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Payment Animation Card with spinner or success message.
            <div className="bg-white/20 backdrop-blur-lg p-8 rounded-lg shadow-xl text-center">
              {status === 'processing' ? (
                <>
                  <Loader2 className="animate-spin h-16 w-16 mx-auto mb-4 text-white" />
                  <h2 className="text-2xl text-white font-semibold mb-2">
                    Processing Secure Payment
                  </h2>
                  <p className="text-lg opacity-80 text-white">
                    Please wait while we verify your transaction...
                  </p>
                  <div className="w-full bg-white/30 rounded-full h-2.5 mt-6">
                    <div
                      className="bg-green-400 h-2.5 rounded-full animate-pulse"
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
                  <h2 className="text-2xl text-white font-semibold mb-2">
                    Payment Successful!
                  </h2>
                  <p className="text-lg text-white opacity-80">
                    Redirecting to your trading dashboard...
                  </p>
                </>
              )}
            </div>
          )}
        </main>
        {/* Footer */}
        <footer className="text-center py-2">
          <p className="text-sm text-white opacity-80">
            Disclaimer: epirts is not a real payment processor; nothing is actually happening
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PaymentAnimation;
