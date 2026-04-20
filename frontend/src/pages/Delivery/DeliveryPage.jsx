import React, { useEffect, useMemo, useState } from 'react';
import { YMaps, Map, Placemark, ZoomControl } from '@pbe/react-yandex-maps';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api';
import styles from './DeliveryPage.module.css';

const API_KEY = process.env.REACT_APP_YANDEX_MAPS_KEY;

// Ростовская область: bbox = "lon1,lat1~lon2,lat2"
const ROSTOV_BBOX = '37.0,45.7~44.2,51.5';
const START_CENTER = [47.2357, 39.7015]; // Ростов-на-Дону

export default function DeliveryPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [coords, setCoords] = useState([
    user?.last_lat || START_CENTER[0],
    user?.last_lng || START_CENTER[1],
  ]);
  const [address, setAddress] = useState(user?.last_address || '');
  const [query, setQuery] = useState(user?.last_address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const mapState = useMemo(
    () => ({
      center: coords,
      zoom: 11,
      controls: ['zoomControl'],
    }),
    [coords]
  );

  // Поиск по адресу в Ростовской области
  useEffect(() => {
    if (!API_KEY) return;
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggest(true);

        const url =
          `https://geocode-maps.yandex.ru/1.x/` +
          `?apikey=${API_KEY}` +
          `&format=json` +
          `&lang=ru_RU` +
          `&geocode=${encodeURIComponent(query)}` +
          `&results=5` +
          `&bbox=${ROSTOV_BBOX}` +
          `&rspn=1`;

        const res = await fetch(url);
        const data = await res.json();

        const members =
          data?.response?.GeoObjectCollection?.featureMember || [];

        const parsed = members.map((item) => {
          const obj = item.GeoObject;
          const [lng, lat] = obj.Point.pos.split(' ').map(Number);

          return {
            address: obj.metaDataProperty.GeocoderMetaData.text,
            coords: [lat, lng],
          };
        });

        setSuggestions(parsed);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const reverseGeocode = async ([lat, lng]) => {
    if (!API_KEY) return;

    try {
      const url =
        `https://geocode-maps.yandex.ru/1.x/` +
        `?apikey=${API_KEY}` +
        `&format=json` +
        `&lang=ru_RU` +
        `&geocode=${lng},${lat}` +
        `&results=1` +
        `&bbox=${ROSTOV_BBOX}` +
        `&rspn=1`;

      const res = await fetch(url);
      const data = await res.json();

      const obj =
        data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

      if (obj) {
        const text = obj.metaDataProperty.GeocoderMetaData.text;
        setAddress(text);
        setQuery(text);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const selectSuggestion = (item) => {
    setAddress(item.address);
    setQuery(item.address);
    setCoords(item.coords);
    setSuggestions([]);
  };

  const handleMapClick = (e) => {
    const nextCoords = e.get('coords');
    setCoords(nextCoords);
    reverseGeocode(nextCoords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      setError('Укажите адрес доставки');
      return;
    }

    if (items.length === 0) {
      setError('Корзина пуста');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map((i) => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      const { data } = await ordersAPI.create({
        items: orderItems,
        deliveryAddress: address,
        deliveryLat: coords[0],
        deliveryLng: coords[1],
      });

      setSuccess(data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🍒</div>
          <h2 className={styles.successTitle}>Заказ оформлен!</h2>
          <p className={styles.successSub}>
            Ваш заказ #{success.order.id.slice(-6).toUpperCase()} принят
          </p>

          <div className={styles.deliveryTimer}>
            <span className={styles.timerIcon}>⏱️</span>
            <div>
              <p className={styles.timerLabel}>Ожидаемое время доставки</p>
              <p className={styles.timerValue}>{success.deliveryMinutes} минут</p>
            </div>
          </div>

          <div className={styles.orderInfo}>
            <div className={styles.orderInfoRow}>
              <span>Адрес</span>
              <span>{success.order.deliveryAddress}</span>
            </div>
            <div className={styles.orderInfoRow}>
              <span>Сумма</span>
              <span>{success.order.total_price?.toLocaleString?.('ru-RU') || success.order.totalPrice?.toLocaleString?.('ru-RU')} ₽</span>
            </div>
          </div>

          <div className={styles.successActions}>
            <button className="btn btn-cherry" onClick={() => navigate('/profile')}>
              Мои заказы
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/catalog')}>
              Продолжить покупки
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 8 }}>
          Оформление заказа
        </h1>
        <p className="section-subtitle">
          Выберите точку доставки на карте или введите адрес вручную
        </p>

        <div className={styles.layout}>
          <div className={styles.mapSection}>
            <div className={styles.searchBox}>
              <label className={styles.label}>Адрес доставки</label>
              <input
                className={styles.input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAddress(e.target.value);
                }}
                placeholder="Например: Ростов-на-Дону, улица Пушкинская"
              />

              {loadingSuggest && (
                <div className={styles.suggestLoading}>Ищем адреса…</div>
              )}

              {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.suggestionItem}
                      onClick={() => selectSuggestion(item)}
                    >
                      {item.address}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.mapWrap}>
              <YMaps query={{ apikey: API_KEY, lang: 'ru_RU' }}>
                <Map
                  state={mapState}
                  width="100%"
                  height="500px"
                  onClick={handleMapClick}
                  options={{
                    suppressMapOpenBlock: true,
                    yandexMapDisablePoiInteractivity: true,
                  }}
                >
                  <ZoomControl options={{ float: 'right' }} />

                  {/* Стандартная красная метка, без вишни */}
                  <Placemark geometry={coords} />
                </Map>
              </YMaps>
            </div>

            <p className={styles.mapHint}>
              Нажмите на карту, чтобы выбрать точку доставки
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Детали доставки</h2>

            <div className={styles.coordsRow}>
              <div className={styles.field}>
                <label className={styles.label}>Широта</label>
                <input className={styles.input} value={coords[0].toFixed(5)} readOnly />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Долгота</label>
                <input className={styles.input} value={coords[1].toFixed(5)} readOnly />
              </div>
            </div>

            <div className={styles.orderSummary}>
              <h3 className={styles.summaryHead}>Ваш заказ</h3>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                </div>
              ))}
              <div className={styles.summaryTotal}>
                <span>Итого</span>
                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={`btn btn-cherry ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Оформляем...' : 'Оформить заказ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}