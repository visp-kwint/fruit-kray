import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        {/* <span className={styles.emptyIcon}>🛒</span> */}
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога, чтобы оформить заказ</p>
        <Link to="/catalog" className="btn btn-cherry" style={{ marginTop: 24 }}>
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Список товаров */}
          <div className={styles.itemsList}>
            <div className={styles.listHeader}>
              <h1 className="section-title">Корзина</h1>
              <button
                className={`btn btn-ghost btn-sm ${styles.clearBtn}`}
                onClick={clearCart}
              >
                Очистить
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                {/* Фото */}
                <div className={styles.itemImg}>
                  <img
                    src={item.image_url || `https://picsum.photos/seed/${item.name}/80/80`}
                    alt={item.name}
                  />
                </div>

                {/* Информация */}
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemCategory}>
                    {item.categoryName || 'Категория'}
                  </p>
                </div>

                {/* Количество */}
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                {/* Цена */}
                <div className={styles.itemPrice}>
                  {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                </div>

                {/* Удалить */}
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Итог */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Итого</h2>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Товаров</span>
                <span>
                  {items.reduce((s, i) => s + i.quantity, 0)} шт.
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Доставка</span>
                <span className={styles.freeDelivery}>Бесплатно</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Итого</span>
                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>

            <button
              className={`btn btn-cherry ${styles.checkoutBtn}`}
              onClick={() => navigate('/delivery')}
            >
              Оформить заказ →
            </button>

            <Link to="/catalog" className={styles.continueShopping}>
              ← Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}