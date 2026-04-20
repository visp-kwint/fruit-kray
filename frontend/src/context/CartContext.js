import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext(null);

function normalizeProduct(product) {
  const categoryObj = product.category && typeof product.category === 'object' ? product.category : null;

  return {
    ...product,
    image_url: product.image_url || product.imageUrl || '',
    categoryId: product.categoryId || categoryObj?.id || '',
    categoryName: product.categoryName || categoryObj?.name || (typeof product.category === 'string' ? product.category : ''),
    categorySlug: product.categorySlug || categoryObj?.slug || '',
    category: product.category,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    const normalized = normalizeProduct(product);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === normalized.id);
      if (existing) {
        return prev.map((i) =>
          i.id === normalized.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...normalized, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== productId));
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalPrice,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);