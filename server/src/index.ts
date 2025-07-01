import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { getUserData, saveUserData } from './dataStorage'; // dataStorageから関数をインポート

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Stripeの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// ミドルウェアの設定
const corsOptions = {
  origin: 'https://dudelang.onrender.com', // ←ここをあなたのフロントエンドURLに
  credentials: true, // 必要なら
};
app.use(cors(corsOptions));
app.use(express.json());

// チェックアウトセッションを作成するエンドポイント
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, anonymousId } = req.body; // anonymousIdを受け取る

    // チェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&anonymous_id=${anonymousId}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: '支払いセッションの作成に失敗しました。' });
  }
});

// チェックアウトセッションを検証するエンドポイント
app.get('/api/verify-checkout-session', async (req: Request, res: Response) => {
  console.log('Received query parameters (before extraction):', req.query);

  const rawSessionId = req.query.session_id;
  const rawAnonymousId = req.query.anonymous_id;

  console.log('Raw sessionId from query:', rawSessionId);
  console.log('Type of raw sessionId:', typeof rawSessionId);
  console.log('Raw anonymousId from query:', rawAnonymousId);
  console.log('Type of raw anonymousId:', typeof rawAnonymousId);

  // 値が確実に文字列であることを保証し、undefinedの場合はundefinedにする
  const sessionId = typeof rawSessionId === 'string' ? rawSessionId : undefined;
  const anonymousId = typeof rawAnonymousId === 'string' ? rawAnonymousId : undefined;

  console.log('Processed sessionId (after type check):', sessionId);
  console.log('Processed anonymousId (after type check):', anonymousId);

  if (!sessionId || !anonymousId) {
    return res.status(400).json({ success: false, error: 'Session ID or Anonymous ID is missing.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.status === 'complete') {
      // ユーザーのサブスクリプション状態をサーバーサイドに保存
      await saveUserData({
        anonymousId: anonymousId,
        isSubscribed: true,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
      });

      res.json({ success: true, customerId: session.customer });
    } else {
      res.status(400).json({ success: false, error: 'Payment not successful or session not complete.' });
    }
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    res.status(500).json({ success: false, error: 'Failed to verify checkout session.' });
  }
});

// ユーザーのサブスクリプション状態を取得するエンドポイント
app.get('/api/get-subscription-status', async (req: Request, res: Response) => {
  const anonymousId = req.query.anonymous_id as string;

  if (!anonymousId) {
    return res.status(400).json({ isSubscribed: false, error: 'Anonymous ID is missing.' });
  }

  try {
    const userData = await getUserData(anonymousId);
    res.json({ isSubscribed: userData ? userData.isSubscribed : false });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ isSubscribed: false, error: 'Failed to fetch subscription status.' });
  }
});

// Stripe Checkout Sessionの詳細を取得するエンドポイントを追加
app.post('/api/retrieve-checkout-session', async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is missing.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ session });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Failed to retrieve checkout session.' });
  }
});

// Stripeカスタマーポータルセッションを作成するエンドポイントを追加
app.post('/api/create-customer-portal-session', async (req: Request, res: Response) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is missing.' });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/success`, // ユーザーがポータルを離れた後に戻るURL
    });
    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session.' });
  }
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
