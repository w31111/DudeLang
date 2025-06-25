import React, { useState } from 'react';
import { IconSparkles } from '../constants';
import { initiatePayment, PRICE_IDS, createCustomerPortalSession } from '../src/services/stripeService2';

interface SettingsViewProps {
  isSubscribed: boolean;
  onToggleSubscription: () => void;
  anonymousId: string;
}

type Plan = 'monthly' | 'annual';

const SettingsView: React.FC<SettingsViewProps> = ({ isSubscribed, onToggleSubscription, anonymousId }) => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const getSubscribeButtonText = () => {
    if (!selectedPlan) return "Select a Plan to Subscribe";
    return `Subscribe to ${selectedPlan === 'monthly' ? 'Monthly' : 'Annual'} Plan`;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    try {
      setIsProcessing(true);
      const priceId = selectedPlan === 'monthly' ? PRICE_IDS.MONTHLY : PRICE_IDS.ANNUAL;
      
      console.log('Sending anonymousId to initiatePayment:', anonymousId);
      console.log('Type of anonymousId being sent:', typeof anonymousId);

      await initiatePayment(priceId, anonymousId);
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('申し訳ありません。支払い処理中にエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsProcessing(true);
    try {
      const customerId = localStorage.getItem('stripe_customer_id');
      if (!customerId) {
        alert('お客様情報が見つかりませんでした。再度ログインをお試しください。');
        return;
      }
      const portalUrl = await createCustomerPortalSession(customerId);
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      alert('退会処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 text-white flex flex-col items-center">
      <div className="w-full max-w-lg">
        {isSubscribed ? (
          <div className="text-center bg-neutral-800 p-6 sm:p-8 rounded-xl shadow-xl">
            <IconSparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mb-3">You are a Dude Lang. Pro!</h2>
            <p className="text-neutral-300 mb-6 text-base sm:text-lg">
              Enjoy all the premium features.
            </p>
            <div className="text-left mb-8 bg-neutral-900 p-4 rounded-lg inline-block">
                <h3 className="text-lg font-semibold text-white mb-2">Your Pro Benefits:</h3>
                <ul className="list-none space-y-1.5 text-neutral-300">
                    <li className="flex items-center"><IconSparkles className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0"/>Completely Ad-Free Experience</li>
                    <li className="flex items-center"><IconSparkles className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0"/>Detailed Slang Explanations</li>
                    <li className="flex items-center"><IconSparkles className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0"/>Contextual Example Sentences</li>
                </ul>
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
              aria-label="Unsubscribe from Pro"
            >
              {isProcessing ? "処理中..." : "Unsubscribe"}
            </button>
          </div>
        ) : (
          <div className="text-center bg-neutral-800 p-6 sm:p-8 rounded-xl shadow-xl">
            <IconSparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Go Pro with Dude Lang.!</h2>
            <p className="text-neutral-300 mb-6 text-base sm:text-lg">
              Unlock exclusive features and an ad-free experience. Select a plan below to get started.
            </p>
            
            <div className="text-left mb-6 bg-neutral-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Pro Benefits Include:</h3>
              <ul className="list-none space-y-1.5 text-neutral-300">
                <li className="flex items-center"><IconSparkles className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0"/>Completely Ad-Free Experience</li>
                <li className="flex items-center"><IconSparkles className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0"/>Detailed Slang Explanations</li>
                <li className="flex items-center"><IconSparkles className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0"/>Contextual Example Sentences</li>
              </ul>
            </div>

            <div className="my-6 space-y-4">
              <div
                onClick={() => handleSelectPlan('monthly')}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleSelectPlan('monthly')}
                className={`bg-neutral-700 p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 ${selectedPlan === 'monthly' ? 'border-2 border-blue-400 ring-2 ring-blue-400 ring-opacity-50' : 'border-2 border-transparent'}`}
              >
                <h4 className="text-xl font-semibold text-white mb-1">Monthly Plan</h4>
                <p className="text-3xl font-bold text-blue-300">
                  ¥500<span className="text-lg font-normal text-neutral-400">/month</span>
                </p>
              </div>
              <div
                onClick={() => handleSelectPlan('annual')}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleSelectPlan('annual')}
                className={`bg-neutral-700 p-4 rounded-lg shadow-lg relative cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 ${selectedPlan === 'annual' ? 'border-2 border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50' : 'border-2 border-transparent'}`}
              >
                <span className="absolute top-0 right-0 -mt-3 -mr-2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow">Most Popular</span>
                <h4 className="text-xl font-semibold text-yellow-300 mb-1">Annual Plan</h4>
                <p className="text-3xl font-bold text-yellow-300">
                  ¥3,000<span className="text-lg font-normal text-neutral-400">/year</span>
                </p>
                <p className="text-sm text-yellow-200 mt-1">
                  Effectively ¥250/month - <span className="font-semibold">50% off!</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={!selectedPlan || isProcessing}
              className={`w-full sm:w-auto font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg mt-8 ${
                !selectedPlan || isProcessing
                ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              aria-label={isProcessing ? "Processing..." : getSubscribeButtonText()}
            >
              {isProcessing ? "Processing..." : getSubscribeButtonText()}
            </button>
            <p className="text-xs text-neutral-500 mt-4 italic">
              Secure payment processing powered by Stripe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;