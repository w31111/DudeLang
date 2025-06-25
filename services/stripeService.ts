import { loadStripe } from '@stripe/stripe-js';

// Stripeの公開可能キーを環境変数から取得
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

// Stripeのインスタンスを初期化
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// プランの価格ID
export const PRICE_IDS = {
  MONTHLY: 'price_1RZ5o6JTpnvhxeZ7TrRYOb3y', // 実際のStripeの価格IDに置き換えてください
  ANNUAL: 'price_1RZ5ooJTpnvhxeZ7Wibjdzfk',   // 実際のStripeの価格IDに置き換えてください
};

// 支払い処理を開始する関数
export const initiatePayment = async (priceId: string, anonymousId: string) => {
  try {
    const response = await fetch('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        anonymousId,
      }),
    });

    const session = await response.json();

    // Stripeのチェックアウトページにリダイレクト
    const stripe = await stripePromise;
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    console.error('Payment initiation failed:', error);
    throw error;
  }
}; 