import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, featured = false, onAddToCart }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setAdding(true);

    addItem({
      ...product,
      image_url: product.imageUrl || product.image_url || '',
      categoryName: product.category?.name || product.categoryName || '',
      categorySlug: product.category?.slug || product.categorySlug || '',
    });

    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      onAddToCart?.(product);
      setTimeout(() => setAdded(false), 1600);
    }, 250);
  };

  const placeholderImg = `https://picsum.photos/seed/${product.name}/400/300`;

  return (
    <div className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.badges}>
        {product.isNew && <span className="badge badge-new">Новинка</span>}
        {product.isPopular && <span className="badge badge-popular">Хит</span>}
        {product.isDayItem && <span className="badge badge-day">Товар дня</span>}
      </div>

      <div className={styles.imageWrap}>
        <img
          src={product.imageUrl || product.image_url || placeholderImg}
          alt={product.name}
          className={styles.image}
          loading="lazy"
          onError={(e) => {
            e.target.src = placeholderImg;
          }}
        />
      </div>

      <div className={styles.body}>
        <p className={styles.category}>
          {product.category?.name || product.categoryName || 'Категория'}
        </p>
        <h3 className={styles.name}>{product.name}</h3>
        {product.description && <p className={styles.desc}>{product.description}</p>}

        <div className={styles.footer}>
          <span className={styles.price}>{Number(product.price).toLocaleString('ru-RU')} ₽</span>
          <button
            className={`${styles.addBtn} ${added ? styles.added : ''}`}
            onClick={handleAddToCart}
            disabled={adding}
          >
            {added ? '✓ Добавлено' : adding ? '...' : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  );
}