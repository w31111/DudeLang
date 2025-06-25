import React, { useEffect, useState } from 'react';
import { IconCheck, IconLoading } from '../constants';
import { retrieveCheckoutSession } from '@/services/stripeService';

interface SuccessViewProps {
  onSubscriptionSuccess: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ onSubscriptionSuccess }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('決済情報を確認中...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const anonymousId = urlParams.get('anonymous_id');

    if (sessionId && anonymousId) {
      // バックエンドAPIを呼び出してセッションIDと匿名IDを検証
      // まずはセッション情報を取得してcustomer_idを保存
      retrieveCheckoutSession(sessionId)
        .then((sessionData: any) => {
          // セッション情報を検証し、customer_idをローカルストレージに保存
          if (sessionData.payment_status === 'paid' && sessionData.status === 'complete') {
            if (sessionData.customer) {
              localStorage.setItem('stripe_customer_id', sessionData.customer);
              console.log('Stripe Customer ID saved:', sessionData.customer);
            }

            // サーバー側の検証エンドポイントを呼び出してサブスクリプション状態を更新
            fetch(`http://localhost:3000/api/verify-checkout-session?session_id=${sessionId}&anonymous_id=${anonymousId}`)
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  setStatus('success');
                  setMessage('購読が正常に有効化されました！');
                  onSubscriptionSuccess();
                } else {
                  setStatus('error');
                  setMessage(data.error || '決済の検証に失敗しました。');
                }
              })
              .catch((error: any) => {
                console.error('Error verifying session with backend:', error);
                setStatus('error');
                setMessage('エラーが発生しました。もう一度お試しください。');
              });
          } else {
            setStatus('error');
            setMessage('決済が完了していないか、セッションが有効ではありません。');
          }
        })
        .catch((error: any) => {
          console.error('Error retrieving checkout session:', error);
          setStatus('error');
          setMessage('セッション情報の取得に失敗しました。');
        });
    } else {
      setStatus('error');
      setMessage('決済セッションIDまたは匿名IDが見つかりませんでした。');
    }
  }, [onSubscriptionSuccess]);

  return (
    <div className="p-4 text-white flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-lg bg-neutral-800 p-6 sm:p-8 rounded-xl shadow-xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <IconLoading className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{message}</h2>
            <p className="text-neutral-300">しばらくお待ちください。</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <IconCheck className="w-12 h-12 text-green-400 mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mb-3">{message}</h2>
            <p className="text-neutral-300">すべてのプレミアム機能をお楽しみください！</p>
            <button
              onClick={() => window.location.href = '/'} // ホームに戻る
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-md"
            >
              ホームに戻る
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-red-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.174 3.374 1.94 3.374h14.71c1.766 0 2.806-1.874 1.94-3.374L13.94 3.376c-.866-1.5-3.033-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="text-2xl sm:text-3xl font-bold text-red-500 mb-3">エラー</h2>
            <p className="text-neutral-300">{message}</p>
            <button
              onClick={() => window.location.href = '/'} // ホームに戻る
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-md"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessView; 