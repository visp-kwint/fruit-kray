import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { reviewsAPI } from '../../api';
import styles from './ProductDetailsModal.module.css';

const BASE_URL =
  process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8080';

function resolveImage(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

export default function ProductDetailsModal({ product, onClose, onAddToCart }) {
  const { addItem } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    setLoadingReviews(true);
    reviewsAPI.getByProduct(product.id)
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [product?.id]);

  if (!product) return null;

  const img = resolveImage(product.imageUrl || product.image_url);
  const placeholder = `https://picsum.photos/seed/${product.id}/800/500`;

  const handleAdd = () => {
    addItem({
      ...product,
      image_url:    product.imageUrl || product.image_url || '',
      categoryName: product.category?.name || '',
      categorySlug: product.category?.slug || '',
    });
    onAddToCart?.(product);
    onClose();
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <img
          src={img || placeholder}
          alt={product.name}
          className={styles.image}
          onError={(e) => { e.target.src = placeholder; }}
        />

        <div className={styles.body}>
          <p className={styles.category}>
            {product.category?.name}
          </p>

          <h2 className={styles.title}>{product.name}</h2>

          {product.description && (
            <p className={styles.short}>{product.description}</p>
          )}

          {product.details && product.details !== product.description && (
            <p className={styles.details}>{product.details}</p>
          )}

          <div className={styles.badges}>
            {product.isNew      && <span className="badge badge-new">Новинка</span>}
            {product.isPopular  && <span className="badge badge-popular">Хит</span>}
            {product.isDayItem  && <span className="badge badge-day">Товар дня</span>}
            {product.isDiscount && <span className="badge badge-new">Скидка</span>}
          </div>

          {avgRating && (
            <div className={styles.ratingRow}>
              <span className={styles.ratingStars}>
                {'★'.repeat(Math.round(Number(avgRating)))}
              </span>
              <span className={styles.ratingValue}>{avgRating}</span>
              <span className={styles.ratingCount}>({reviews.length} отзывов)</span>
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.price}>
              {Number(product.price).toLocaleString('ru-RU')} ₽
            </div>
            <button className="btn btn-cherry btn-lg" onClick={handleAdd}>
              В корзину
            </button>
          </div>

          <div className={styles.reviewsSection}>
            <h3 className={styles.reviewsTitle}>Отзывы</h3>
            {loadingReviews ? (
              <p className={styles.reviewsLoading}>Загружаем отзывы…</p>
            ) : reviews.length === 0 ? (
              <p className={styles.reviewsEmpty}>Пока нет отзывов. Будьте первым!</p>
            ) : (
              <div className={styles.reviewsList}>
                {reviews.map((r) => (
                  <div key={r.id} className={styles.reviewItem}>
                    <div className={styles.reviewTop}>
                      <span className={styles.reviewAuthor}>{r.user?.email?.split('@')[0] || 'Пользователь'}</span>
                      <span className={styles.reviewItemStars}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    <p className={styles.reviewItemComment}>{r.comment}</p>
                    <p className={styles.reviewItemDate}>
                      {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}