import React, { useState, useEffect } from 'react';
import { userAPI, ordersAPI, reviewsAPI } from '../../api';
import ReviewModal from '../../components/ReviewModal/ReviewModal';
import styles from './ProfilePage.module.css';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders]   = useState([]);
  const [frequent, setFrequent] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [tab, setTab]         = useState('orders');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [reviewModal, setReviewModal] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: prof }, { data: ord }, { data: freq }, { data: rev }] = await Promise.all([
          userAPI.getProfile(),
          ordersAPI.getAll(),
          userAPI.getFrequent(),
          reviewsAPI.getMy(),
        ]);
        setProfile(prof);
        setOrders(ord.orders || []);
        setFrequent(freq.frequent_products || []);
        setMyReviews(rev.reviews || []);
        setEmail(prof.email);
      } catch {
        // обработка ошибок
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (email !== profile.email) payload.email = email;
      if (password) payload.password = password;

      await userAPI.updateProfile(payload);
      setSaveMsg('Профиль обновлён ✓');
      setPassword('');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('Ошибка: ' + (err.response?.data?.error || 'попробуйте снова'));
    }
  };

  const hasReview = (orderId, productId) =>
    myReviews.some((r) => r.orderId === orderId && r.productId === productId);

  const handleReviewSuccess = async () => {
    const { data } = await reviewsAPI.getMy();
    setMyReviews(data.reviews || []);
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Шапка профиля */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {profile?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className={styles.profileName}>{profile?.email}</h1>
            <p className={styles.profileRole}>
              {profile?.role === 'ADMIN' ? '👑 Администратор' : '🛒 Покупатель'}
            </p>
          </div>
        </div>

        {/* Вкладки */}
        <div className={styles.tabs}>
          {[
            { key: 'orders',   label: '📦 История заказов' },
            { key: 'frequent', label: '⭐ Часто покупаю' },
            { key: 'reviews',  label: '💬 Мои отзывы' },
            { key: 'settings', label: '⚙️ Настройки' },
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
              orders.map((order) => (
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
                      {/* КНОПКА ОТСЛЕЖИВАНИЯ */}
                      {order.status !== 'DONE' && order.status !== 'CANCELLED' && (
                        <button
                          className={styles.trackBtn}
                          onClick={() => navigate('/tracking', {
                            state: { order, deliveryMinutes: order.deliveryMinutes || 30 }
                          })}
                        >
                          🚚 Отследить
                        </button>
                      )}
                      {order.status === 'DONE' && (
                        <button
                          className={styles.trackBtn}
                          onClick={() => navigate('/tracking', {
                            state: { order, deliveryMinutes: order.deliveryMinutes || 30 }
                          })}
                        >
                          📦 Подробности
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    {order.items?.map((item, i) => (
                      <div key={i} className={styles.orderItemRow}>
                        <span className={styles.orderItem}>
                          {item.name} × {item.quantity}
                        </span>
                        {order.status === 'DONE' && !hasReview(order.id, item.productId) && (
                          <button
                            className={styles.reviewBtn}
                            onClick={() => setReviewModal({ product: item, order })}
                          >
                            Оставить отзыв
                          </button>
                        )}
                        {order.status === 'DONE' && hasReview(order.id, item.productId) && (
                          <span className={styles.reviewDone}>✓ Оценено</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className={styles.orderAddress}>
                    📍 {order.deliveryAddress || '—'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Часто покупаемые */}
        {tab === 'frequent' && (
          <div className={styles.tabContent}>
            {frequent.length === 0 ? (
              <p className={styles.emptyTab}>
                Купите что-нибудь, чтобы здесь появилась статистика 🛒
              </p>
            ) : (
              <div className={styles.frequentGrid}>
                {frequent.map((item, i) => (
                  <div key={i} className={styles.frequentCard}>
                    <div className={styles.frequentRank}>#{i + 1}</div>
                    <img
                      src={
                        item.imageUrl ||
                        `https://picsum.photos/seed/${item.name}/80/80`
                      }
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
            {myReviews.length === 0 ? (
              <p className={styles.emptyTab}>Вы ещё не оставили ни одного отзыва 💬</p>
            ) : (
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
            )}
          </div>
        )}

        {/* Настройки */}
        {tab === 'settings' && (
          <div className={styles.tabContent}>
            <form className={styles.settingsForm} onSubmit={handleSave}>
              <h2 className={styles.settingsTitle}>Редактирование профиля</h2>

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

      {reviewModal && (
        <ReviewModal
          product={reviewModal.product}
          order={reviewModal.order}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
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
    CANCELLED:  'Отменён',
  };
  return labels[status] || status;
}