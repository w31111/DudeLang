const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const PRICE_IDS = {
  MONTHLY: 'price_1RZ5o6JTpnvhxeZ7TrRYOb3y',
  ANNUAL: 'price_1RZ5ooJTpnvhxeZ7Wibjdzfk'
};

export async function initiatePayment(priceId: string, anonymousId: string) {
  try {
    const response = await fetch(`${SERVER_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, anonymousId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment initiation failed');
    }
    window.location.href = data.url;
  } catch (error) {
    console.error('Error initiating payment:', error);
    alert('お支払い処理を開始できませんでした。');
  }
}

export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const response = await fetch(`${SERVER_URL}/api/retrieve-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to retrieve checkout session');
    }
    return data.session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(customerId: string) {
  try {
    const response = await fetch(`${SERVER_URL}/api/create-customer-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create customer portal session');
    }
    return data.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
} 