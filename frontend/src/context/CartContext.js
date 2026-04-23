import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartAPI } from '../api';
import { useAuth } from './AuthContext';

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

function toServerItem(item) {
  return {
    productId: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.image_url || '',
    categoryName: item.categoryName || '',
    categorySlug: item.categorySlug || '',
  };
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  // Загрузка корзины с сервера при логине
  useEffect(() => {
    if (!user) return;
    const loadServerCart = async () => {
      try {
        const { data } = await cartAPI.getAll();
        if (data.items) {
          const mapped = data.items.map((i) => ({
            id: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image_url: i.imageUrl,
            categoryName: i.categoryName,
            categorySlug: i.categorySlug,
            category: { name: i.categoryName, slug: i.categorySlug },
          }));
          setItems(mapped);
          localStorage.setItem('cart', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Ошибка загрузки корзины:', err);
      }
    };
    loadServerCart();
  }, [user?.id]);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Синхронизация с сервером
  const syncWithServer = useCallback(async (nextItems) => {
    if (!user) return;
    try {
      await cartAPI.sync(nextItems.map(toServerItem));
    } catch (err) {
      console.error('Ошибка синхронизации корзины:', err);
      if (err.response?.data?.error?.includes('больше не существует')) {
        setItems([]);
        localStorage.removeItem('cart');
        await cartAPI.clear().catch(() => {});
      }
    }
  }, [user]);

  const addItem = useCallback((product, qty = 1) => {
    const normalized = normalizeProduct(product);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === normalized.id);
      let next;
      if (existing) {
        next = prev.map((i) =>
          i.id === normalized.id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        next = [...prev, { ...normalized, quantity: qty }];
      }
      syncWithServer(next);
      return next;
    });
  }, [syncWithServer]);

  const removeItem = useCallback((productId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== productId);
      syncWithServer(next);
      return next;
    });
  }, [syncWithServer]);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== productId);
        syncWithServer(next);
        return next;
      });
      return;
    }

    setItems((prev) => {
      const next = prev.map((i) => (i.id === productId ? { ...i, quantity: qty } : i));
      syncWithServer(next);
      return next;
    });
  }, [syncWithServer]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (user) {
      cartAPI.clear().catch(() => {});
    }
  }, [user]);

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