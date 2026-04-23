import React, { useState, useEffect } from 'react';
import { userAPI, ordersAPI, reviewsAPI, deliveryReviewsAPI } from '../../api';
import ReviewModal from '../../components/ReviewModal/ReviewModal';
import styles from './ProfilePage.module.css';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders]   = useState([]);
  const [frequent, setFrequent] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [myDeliveryReviews, setMyDeliveryReviews] = useState([]);
  const [tab, setTab]         = useState('orders');
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [password, setPassword] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [reviewModal, setReviewModal] = useState(null);
  const [deliveryReviewModal, setDeliveryReviewModal] = useState(null);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [deliveryComment, setDeliveryComment] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError('');
      
      try {
        const profRes = await userAPI.getProfile();
        setProfile(profRes.data);
        setEmail(profRes.data.email);
        setName(profRes.data.name || '');
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setLoadError('Не удалось загрузить профиль');
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        ordersAPI.getAll(),
        userAPI.getFrequent(),
        reviewsAPI.getMy(),
        deliveryReviewsAPI.getMy().catch(() => ({ data: { reviews: [] } }))
      ]);

      const [ordersRes, frequentRes, reviewsRes, deliveryRes] = results;

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value.data?.orders || []);
      } else {
        console.error('Ошибка заказов:', ordersRes.reason);
      }

      if (frequentRes.status === 'fulfilled') {
        setFrequent(frequentRes.value.data?.frequent_products || []);
      }

      if (reviewsRes.status === 'fulfilled') {
        setMyReviews(reviewsRes.value.data?.reviews || []);
      }

      if (deliveryRes.status === 'fulfilled') {
        setMyDeliveryReviews(deliveryRes.value.data?.reviews || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (email !== profile.email) payload.email = email;
      if (name !== (profile.name || '')) payload.name = name;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setSaveMsg('Нет изменений для сохранения');
        setTimeout(() => setSaveMsg(''), 3000);
        return;
      }

      await userAPI.updateProfile(payload);
      
      // Обновляем профиль в стейте и localStorage
      const updatedProfile = { ...profile, ...payload };
      delete updatedProfile.password;
      setProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      
      setSaveMsg('Профиль обновлён');
      setPassword('');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('Ошибка: ' + (err.response?.data?.error || 'попробуйте снова'));
    }
  };

  const hasReview = (orderId, productId) =>
    myReviews.some((r) => r.orderId === orderId && r.productId === productId);

  const hasDeliveryReview = (orderId) =>
    myDeliveryReviews.some((r) => r.orderId === orderId);

  const handleReviewSuccess = async () => {
    try {
      const { data } = await reviewsAPI.getMy();
      setMyReviews(data.reviews || []);
    } catch (err) {
      console.error('Ошибка обновления отзывов:', err);
    }
  };

  const handleDeliveryReviewSuccess = async () => {
    try {
      const { data } = await deliveryReviewsAPI.getMy();
      setMyDeliveryReviews(data.reviews || []);
    } catch (err) {
      console.error('Ошибка обновления отзывов на доставку:', err);
    }
  };

  const handleDeliveryReviewSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryReviewModal) return;
    setDeliveryError('');
    setDeliveryLoading(true);
    try {
      await deliveryReviewsAPI.create({
        orderId: deliveryReviewModal.id,
        rating: deliveryRating,
        comment: deliveryComment,
      });
      await handleDeliveryReviewSuccess();
      setDeliveryReviewModal(null);
      setDeliveryRating(5);
      setDeliveryComment('');
    } catch (err) {
      setDeliveryError(err.response?.data?.error || 'Ошибка отправки отзыва');
    } finally {
      setDeliveryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Загружаем данные...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.emptyTab} style={{ color: '#dc2626', padding: 40 }}>
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.emptyTab}>Не удалось загрузить профиль</div>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || profile?.email;
  const displayEmail = profile?.name ? profile?.email : null;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Шапка профиля */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {displayName?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className={styles.profileName}>{displayName}</h1>
            {displayEmail && <p className={styles.profileEmail}>{displayEmail}</p>}
            <p className={styles.profileRole}>
              {profile?.role === 'ADMIN' ? 'Администратор' : 'Покупатель'}
            </p>
          </div>
        </div>

        {/* Вкладки */}
        <div className={styles.tabs}>
          {[
            { key: 'orders',   label: 'История заказов' },
            { key: 'frequent', label: 'Часто покупаю' },
            { key: 'reviews',  label: 'Мои отзывы' },
            { key: 'settings', label: 'Настройки' },
          ].map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.activeTab : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* История заказов */}
        {tab === 'orders' && (
          <div className={styles.tabContent}>
            {orders.length === 0 ? (
              <p className={styles.emptyTab}>Заказов пока нет</p>
            ) : (
              orders.map((order) => {
                const isDone = order.status === 'DONE';
                const orderHasDeliveryReview = hasDeliveryReview(order.id);
                
                return (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <p className={styles.orderId}>
                          Заказ #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className={styles.orderDate}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </p>
                      </div>
                      <div className={styles.orderRight}>
                        <span className={`${styles.statusBadge} ${styles[order.status?.toLowerCase()]}`}>
                          {statusLabel(order.status)}
                        </span>
                        <p className={styles.orderTotal}>
                          {(order.totalPrice ?? 0).toLocaleString('ru-RU')} ₽
                        </p>
                        {order.status !== 'DONE' && order.status !== 'CANCELLED' && (
                          <button
                            className={styles.trackBtn}
                            onClick={() => navigate('/tracking', {
                              state: { order, deliveryMinutes: order.deliveryMinutes || 30 }
                            })}
                          >
                            Отследить
                          </button>
                        )}
                        {order.status === 'DONE' && (
                          <button
                            className={styles.trackBtn}
                            onClick={() => navigate('/tracking', {
                              state: { order, deliveryMinutes: order.deliveryMinutes || 30 }
                            })}
                          >
                            Подробности
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      <p className={styles.orderItemsTitle}>Товары</p>
                      {order.items?.map((item, i) => {
                        const itemHasReview = hasReview(order.id, item.productId);
                        return (
                          <div key={i} className={styles.orderItemRow}>
                            <span className={styles.orderItem}>
                              {item.name} × {item.quantity}
                            </span>
                            {isDone && !itemHasReview && (
                              <button
                                className={styles.reviewBtn}
                                onClick={() => setReviewModal({ product: item, order })}
                              >
                                Оставить отзыв
                              </button>
                            )}
                            {itemHasReview && (
                              <span className={styles.reviewDone}>Оценено</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.deliverySection}>
                      <p className={styles.orderItemsTitle}>Доставка</p>
                      <div className={styles.deliveryRow}>
                        <span className={styles.deliveryAddress}>
                          {order.deliveryAddress || '—'}
                        </span>
                        {isDone && !orderHasDeliveryReview && (
                          <button
                            className={styles.reviewBtn}
                            onClick={() => setDeliveryReviewModal(order)}
                          >
                            Оценить доставку
                          </button>
                        )}
                        {orderHasDeliveryReview && (
                          <span className={styles.reviewDone}>Доставка оценена</span>
                        )}
                        {!isDone && !orderHasDeliveryReview && (
                          <span className={styles.deliveryPending}>В процессе</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Часто покупаемые */}
        {tab === 'frequent' && (
          <div className={styles.tabContent}>
            {frequent.length === 0 ? (
              <p className={styles.emptyTab}>
                Купите что-нибудь, чтобы здесь появилась статистика
              </p>
            ) : (
              <div className={styles.frequentGrid}>
                {frequent.map((item, i) => (
                  <div key={i} className={styles.frequentCard}>
                    <div className={styles.frequentRank}>#{i + 1}</div>
                    <img
                      src={item.imageUrl || `https://picsum.photos/seed/${item.name}/80/80`}
                      alt={item.name}
                      className={styles.frequentImg}
                    />
                    <div className={styles.frequentInfo}>
                      <p className={styles.frequentName}>{item.name}</p>
                      <p className={styles.frequentQty}>
                        Куплено: <strong>{item.totalQty ?? item.total_qty ?? 0}</strong> шт.
                      </p>
                      <p className={styles.frequentPrice}>
                        {(item.price ?? item.last_price ?? 0).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Мои отзывы */}
        {tab === 'reviews' && (
          <div className={styles.tabContent}>
            {myReviews.length === 0 && myDeliveryReviews.length === 0 ? (
              <p className={styles.emptyTab}>Вы еще не оставили ни одного отзыва</p>
            ) : (
              <>
                {myReviews.length > 0 && (
                  <div className={styles.reviewsSection}>
                    <h3 className={styles.reviewsSectionTitle}>Отзывы на товары</h3>
                    <div className={styles.reviewsList}>
                      {myReviews.map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <img
                              src={review.product?.imageUrl || `https://picsum.photos/seed/${review.product?.name}/60/60`}
                              alt={review.product?.name}
                              className={styles.reviewProductImg}
                            />
                            <div className={styles.reviewMeta}>
                              <p className={styles.reviewProductName}>{review.product?.name}</p>
                              <div className={styles.reviewStars}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>★</span>
                                ))}
                              </div>
                              <p className={styles.reviewDate}>
                                {review.createdAt
                                  ? new Date(review.createdAt).toLocaleDateString('ru-RU')
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          <p className={styles.reviewComment}>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myDeliveryReviews.length > 0 && (
                  <div className={styles.reviewsSection}>
                    <h3 className={styles.reviewsSectionTitle}>Отзывы на доставку</h3>
                    <div className={styles.reviewsList}>
                      {myDeliveryReviews.map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <div className={styles.reviewMeta}>
                              <p className={styles.reviewProductName}>
                                Заказ #{review.order?.id?.slice(-6).toUpperCase() || '—'}
                              </p>
                              <div className={styles.reviewStars}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>★</span>
                                ))}
                              </div>
                              <p className={styles.reviewDate}>
                                {review.createdAt
                                  ? new Date(review.createdAt).toLocaleDateString('ru-RU')
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          <p className={styles.reviewComment}>{review.comment}</p>
                          <p className={styles.reviewAddress}>
                            {review.order?.deliveryAddress || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Настройки */}
        {tab === 'settings' && (
          <div className={styles.tabContent}>
            <form className={styles.settingsForm} onSubmit={handleSave}>
              <h2 className={styles.settingsTitle}>Редактирование профиля</h2>

              <div className={styles.field}>
                <label className={styles.label}>Имя</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Новый пароль</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Оставьте пустым, чтобы не менять"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {saveMsg && (
                <p className={`${styles.saveMsg} ${saveMsg.startsWith('Ошибка') ? styles.error : styles.success}`}>
                  {saveMsg}
                </p>
              )}

              <button type="submit" className="btn btn-cherry">
                Сохранить изменения
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Модалка отзыва на товар */}
      {reviewModal && (
        <ReviewModal
          product={reviewModal.product}
          order={reviewModal.order}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Модалка отзыва на доставку */}
      {deliveryReviewModal && (
        <div className={styles.overlay} onClick={() => setDeliveryReviewModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setDeliveryReviewModal(null)}>×</button>
            <h3 className={styles.modalTitle}>Оценить доставку</h3>
            <p className={styles.modalSub}>Заказ #{deliveryReviewModal.id.slice(-6).toUpperCase()}</p>
            <form onSubmit={handleDeliveryReviewSubmit}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.star} ${s <= deliveryRating ? styles.starActive : ''}`}
                    onClick={() => setDeliveryRating(s)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Расскажите о доставке..."
                value={deliveryComment}
                onChange={(e) => setDeliveryComment(e.target.value)}
                rows={4}
                required
              />
              {deliveryError && <p className={styles.error}>{deliveryError}</p>}
              <button type="submit" className="btn btn-cherry" disabled={deliveryLoading}>
                {deliveryLoading ? 'Отправляем...' : 'Отправить отзыв'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    PENDING:    'Ожидает',
    PROCESSING: 'Обработка',
    DELIVERING: 'Доставляется',
    DONE:       'Выполнен',
    CANCELLED:  'Отменен',
  };
  return labels[status] || status;
}