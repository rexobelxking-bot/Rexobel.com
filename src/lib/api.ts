import type { GarmentSize, MemberProfile, Order, Product, ShippingAddress } from '../types';

const TOKEN_KEY = 'veltron_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getProducts(): Promise<{ products: Product[] }> {
    return request('/api/products');
  },

  getMe(): Promise<{ user: MemberProfile }> {
    return request('/api/auth/me');
  },

  signup(payload: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string | null;
    preferredSize?: GarmentSize;
  }): Promise<{ user: MemberProfile; token: string }> {
    return request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: { email: string; password: string }): Promise<{ user: MemberProfile; token: string }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  loginDemo(): Promise<{ user: MemberProfile; token: string }> {
    return request('/api/auth/demo', {
      method: 'POST',
    });
  },

  logout(): Promise<{ ok: boolean }> {
    return request('/api/auth/logout', {
      method: 'POST',
    });
  },

  updateProfile(payload: {
    name?: string;
    handle?: string;
    bio?: string;
    avatarUrl?: string | null;
    preferredSize?: GarmentSize;
    shippingAddress?: ShippingAddress;
  }): Promise<{ user: MemberProfile }> {
    return request('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  toggleWishlist(productId: string): Promise<{ wishlist: string[] }> {
    return request('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  placeOrder(payload: {
    items: Array<{ productId: string; size: GarmentSize; quantity: number }>;
    shippingAddress: ShippingAddress;
    paymentMethod: { provider: 'card' | 'apple_pay' | 'paypal' | 'klarna'; label: string; summary: string };
  }): Promise<{ order: Order; user: MemberProfile }> {
    return request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  advanceOrderTracking(orderId: string): Promise<{ order: Order; user: MemberProfile }> {
    return request(`/api/orders/${encodeURIComponent(orderId)}/advance-tracking`, {
      method: 'POST',
    });
  },

  submitSupportEnquiry(payload: {
    name: string;
    email: string;
    orderNumber?: string;
    message: string;
  }): Promise<{ ticketNumber: string }> {
    return request('/api/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
