import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersAPI, deliveryReviewsAPI } from '../../api';
import styles from './OrderTrackingPage.module.css';

const PREPARE_SECONDS = 5 * 60;

export default function OrderTrackingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [order, setOrder] = useState(state.order || null);
  const [deliveryMinutes, setDeliveryMinutes] = useState(state.deliveryMinutes || 0);
  const [loading, setLoading] = useState(!state.order);
  const [phase, setPhase] = useState('preparing');
  const [timeLeft, setTimeLeft] = useState(PREPARE_SECONDS);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSent, setReviewSent] = useState(false);
  const [hasDeliveryReview, setHasDeliveryReview] = useState(false);

  useEffect(() => {
    if (state.order) {
      const refreshOrder = async () => {
        try {
          const { data } = await ordersAPI.getAll();
          const orders = data.orders || [];
          const actualOrder = orders.find(o => o.id === state.order.id);
          if (actualOrder) {
            setOrder(actualOrder);
            setDeliveryMinutes(actualOrder.deliveryMinutes || 30);
          }
        } catch {
        }
      };
      refreshOrder();
      return;
    }

    const load = async () => {
      try {
        const { data } = await ordersAPI.getAll();
        const orders = data.orders || [];
        const lastOrder = orders[0];
        if (lastOrder) {
          setOrder(lastOrder);
          setDeliveryMinutes(lastOrder.deliveryMinutes || 30);
        } else {
          navigate('/profile');
        }
      } catch {
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [state.order, navigate]);

  // Проверяем, есть ли уже отзыв на доставку для текущего заказа
  useEffect(() => {
    if (!order) return;
    const check = async () => {
      try {
        const { data } = await deliveryReviewsAPI.getMy();
        const exists = data.reviews?.some((r) => r.orderId === order.id);
        setHasDeliveryReview(exists);
        if (exists) setShowReview(false);
      } catch {
        setHasDeliveryReview(false);
      }
    };
    check();
  }, [order?.id]);

  // Таймер фаз доставки
  useEffect(() => {
    if (!order) return;

    const createdAt = new Date(order.createdAt).getTime();
    const totalSeconds = deliveryMinutes * 60;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);

      if (elapsed < PREPARE_SECONDS) {
        setPhase('preparing');
        setTimeLeft(PREPARE_SECONDS - elapsed);
      } else if (elapsed < totalSeconds) {
        setPhase('delivering');
        setTimeLeft(totalSeconds - elapsed);
      } else {
        setPhase('done');
        setTimeLeft(0);
        if (!hasDeliveryReview) setShowReview(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [order, deliveryMinutes, hasDeliveryReview]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    try {
      await deliveryReviewsAPI.create({
        orderId: order.id,
        rating,
        comment,
      });
      setReviewSent(true);
      setHasDeliveryReview(true);
      setTimeout(() => setShowReview(false), 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка отправки отзыва');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Загружаем заказ…</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const progressPercent =
    phase === 'preparing'
      ? ((PREPARE_SECONDS - timeLeft) / PREPARE_SECONDS) * 100
      : phase === 'delivering'
      ? ((deliveryMinutes * 60 - timeLeft) / (deliveryMinutes * 60)) * 100
      : 100;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <span className={styles.orderNum}>
            Заказ #{order.id.slice(-6).toUpperCase()}
          </span>

          <div className={styles.statusBlock}>
            {phase === 'preparing' && (
              <>
                <div className={styles.pulseWrap}>
                  <div className={styles.pulse} />
                  <span className={styles.bagIcon}></span>
                </div>
                <h2 className={styles.statusTitle}>Собираем ваш заказ</h2>
                <p className={styles.statusSub}>
                  Осталось примерно <strong>{formatTime(timeLeft)}</strong>
                </p>
              </>
            )}

            {phase === 'delivering' && (
              <>
                <div className={styles.carWrap}></div>
                <h2 className={styles.statusTitle}>Ваш заказ в пути</h2>
                <p className={styles.statusSub}>
                  Приблизительное время: <strong>{formatTime(timeLeft)}</strong>
                </p>
              </>
            )}

            {phase === 'done' && (
              <>
                <div className={styles.doneWrap}></div>
                <h2 className={styles.statusTitle}>Заказ доставлен!</h2>
                <p className={styles.statusSub}>Приятного аппетита</p>
              </>
            )}

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Адрес</span>
              <span>{order.deliveryAddress || '—'}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Сумма</span>
              <span>
                {(order.totalPrice ?? order.total_price ?? 0).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {phase === 'done' && hasDeliveryReview && (
            <p className={styles.alreadyReviewed}>Вы уже оставили отзыв о доставке</p>
          )}
        </div>
      </div>

      {showReview && !reviewSent && (
        <div className={styles.overlay} onClick={() => setShowReview(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Как прошла доставка?</h3>

            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.star} ${s <= rating ? styles.starActive : ''}`}
                  onClick={() => setRating(s)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className={styles.textarea}
              placeholder="Расскажите о курьере, скорости, упаковке..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
            />

            <button className="btn btn-cherry" onClick={handleReviewSubmit}>
              Отправить отзыв
            </button>
          </div>
        </div>
      )}

      {showReview && reviewSent && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.doneIcon}></div>
            <h3 className={styles.modalTitle}>Спасибо за отзыв!</h3>
          </div>
        </div>
      )}
    </div>
  );
}