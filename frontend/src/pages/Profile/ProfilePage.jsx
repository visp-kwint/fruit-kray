import React, { useState, useEffect } from 'react';
import { userAPI, ordersAPI } from '../../api';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders]   = useState([]);
  const [frequent, setFrequent] = useState([]);
  const [tab, setTab]         = useState('orders');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: prof }, { data: ord }, { data: freq }] = await Promise.all([
          userAPI.getProfile(),
          ordersAPI.getAll(),
          userAPI.getFrequent(),
        ]);
        setProfile(prof);
        setOrders(ord.orders || []);
        setFrequent(freq.frequent_products || []);
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
              {profile?.role === 'admin' ? '👑 Администратор' : '🛒 Покупатель'}
            </p>
          </div>
        </div>

        {/* Вкладки */}
        <div className={styles.tabs}>
          {[
            { key: 'orders',   label: '📦 История заказов' },
            { key: 'frequent', label: '⭐ Часто покупаю' },
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
                        {new Date(order.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={styles.orderRight}>
                      <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                        {statusLabel(order.status)}
                      </span>
                      <p className={styles.orderTotal}>
                        {order.total_price.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    {order.items.map((item, i) => (
                      <span key={i} className={styles.orderItem}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>

                  <p className={styles.orderAddress}>
                    📍 {order.delivery_address}
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
                        item.product_details?.image_url ||
                        `https://picsum.photos/seed/${item.name}/80/80`
                      }
                      alt={item.name}
                      className={styles.frequentImg}
                    />
                    <div className={styles.frequentInfo}>
                      <p className={styles.frequentName}>{item.name}</p>
                      <p className={styles.frequentQty}>
                        Куплено: <strong>{item.total_qty}</strong> шт.
                      </p>
                      <p className={styles.frequentPrice}>{item.last_price} ₽</p>
                    </div>
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
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    pending:    'Ожидает',
    processing: 'Обработка',
    delivering: 'Доставляется',
    done:       'Выполнен',
    cancelled:  'Отменён',
  };
  return labels[status] || status;
}