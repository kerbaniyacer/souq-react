import { describe, it, expect, beforeEach } from 'vitest';

// اختبار منطق سلة التسوق المحلية
const CART_KEY = 'souq-cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { id: 1, items: [], total: 0, items_count: 0 };
}

function saveCart(cart: { id: number; items: unknown[]; total: number; items_count: number }) {
  cart.total = (cart.items as { subtotal: number }[]).reduce((s, i) => s + (i.subtotal ?? 0), 0);
  cart.items_count = (cart.items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

describe('Cart localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('يُعيد سلة فارغة افتراضياً', () => {
    const cart = getCart();
    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });

  it('يحسب الإجمالي بشكل صحيح', () => {
    const cart = getCart();
    cart.items = [
      { id: 1, quantity: 2, subtotal: 1000 },
      { id: 2, quantity: 1, subtotal: 500 },
    ];
    saveCart(cart);
    const saved = getCart();
    expect(saved.total).toBe(1500);
    expect(saved.items_count).toBe(3);
  });

  it('يحفظ ويسترجع البيانات بشكل صحيح', () => {
    const cart = getCart();
    cart.items = [{ id: 1, quantity: 1, subtotal: 250 }];
    saveCart(cart);
    const retrieved = getCart();
    expect(retrieved.items).toHaveLength(1);
    expect(retrieved.total).toBe(250);
  });
});
