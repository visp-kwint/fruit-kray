import React, { useState } from 'react';
import { reviewsAPI } from '../../api';
import styles from './ReviewModal.module.css';

export default function ReviewModal({ product, order, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await reviewsAPI.create({
        productId: product.productId || product.id,
        orderId: order.id,
        rating,
        comment,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки отзыва');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h3 className={styles.title}>Оставить отзыв</h3>
        <p className={styles.subtitle}>{product.name}</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.star} ${star <= rating ? styles.starActive : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            className={styles.textarea}
            placeholder="Расскажите о товаре..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btn btn-cherry ${styles.submit}`} disabled={loading}>
            {loading ? 'Отправляем...' : 'Отправить отзыв'}
          </button>
        </form>
      </div>
    </div>
  );
}