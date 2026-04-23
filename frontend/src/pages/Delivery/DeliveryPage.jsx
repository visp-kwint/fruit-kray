import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api';
import styles from './DeliveryPage.module.css';

const API_KEY = process.env.REACT_APP_YANDEX_MAPS_KEY;
const ROSTOV_BBOX = '37.0,45.7~44.2,51.5';

// ── Границы Ростовской области ───────────────────────────────────
const ROSTOV_BOUNDS = {
  minLat: 45.85,
  maxLat: 50.35,
  minLng: 38.05,
  maxLng: 43.35,
};

function isInRostovOblast(lat, lng) {
  return (
    lat >= ROSTOV_BOUNDS.minLat &&
    lat <= ROSTOV_BOUNDS.maxLat &&
    lng >= ROSTOV_BOUNDS.minLng &&
    lng <= ROSTOV_BOUNDS.maxLng
  );
}

const START_CENTER = [47.2357, 39.7015];

function loadYandexMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.ymaps && window.ymaps.Map) {
      resolve(window.ymaps);
      return;
    }
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) {
      const check = setInterval(() => {
        if (window.ymaps && window.ymaps.Map) {
          clearInterval(check);
          resolve(window.ymaps);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => resolve(window.ymaps));
      } else {
        reject(new Error('ymaps не загрузился'));
      }
    };
    script.onerror = () => reject(new Error('Ошибка загрузки Яндекс Карт'));
    document.head.appendChild(script);
  });
}

export default function DeliveryPage() {
  const { user, refreshUser } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const placemarkRef = useRef(null);

  const [coords, setCoords] = useState(START_CENTER);
  const [address, setAddress] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const freshUser = await refreshUser();
        if (!mounted || !freshUser) return;

        if (freshUser.lastAddress) {
          setAddress(freshUser.lastAddress);
          setQuery(freshUser.lastAddress);
        }
        if (freshUser.lastLat && freshUser.lastLng) {
          setCoords([freshUser.lastLat, freshUser.lastLng]);
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    let destroyed = false;

    loadYandexMapsScript()
      .then((ymaps) => {
        if (destroyed || !mapRef.current) return;

        const map = new ymaps.Map(mapRef.current, {
          center: coords,
          zoom: 13,
          controls: ['zoomControl'],
        });

        // Ограничиваем область просмотра Ростовской областью
        map.options.set('restrictMapArea', [
          [ROSTOV_BOUNDS.minLat, ROSTOV_BOUNDS.minLng],
          [ROSTOV_BOUNDS.maxLat, ROSTOV_BOUNDS.maxLng],
        ]);

        map.options.set('suppressMapOpenBlock', true);
        map.options.set('yandexMapDisablePoiInteractivity', true);

        const placemark = new ymaps.Placemark(coords);
        map.geoObjects.add(placemark);

        map.events.add('click', (e) => {
          const nextCoords = e.get('coords');
          setCoords(nextCoords);
          placemark.geometry.setCoordinates(nextCoords);
          reverseGeocode(nextCoords);
        });

        mapInstance.current = map;
        placemarkRef.current = placemark;
        setMapReady(true);
      })
      .catch((err) => {
        console.error('Ошибка карт:', err);
        setError('Не удалось загрузить карту. Проверьте API-ключ.');
      });

    return () => {
      destroyed = true;
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current && placemarkRef.current) {
      mapInstance.current.setCenter(coords, 13);
      placemarkRef.current.geometry.setCoordinates(coords);
    }
  }, [coords]);

  useEffect(() => {
    if (!API_KEY || !query || query.trim().length < 3) {
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
        const members = data?.response?.GeoObjectCollection?.featureMember || [];

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
      const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

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

    // ── Проверка: только Ростовская область ───────────────────────
    if (!isInRostovOblast(coords[0], coords[1])) {
      setError('Доставка возможна только в пределах Ростовской области. Выберите адрес на карте внутри региона.');
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

      clearCart();
      navigate('/tracking', {
        state: { order: data.order, deliveryMinutes: data.deliveryMinutes },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 8 }}>
          Оформление заказа
        </h1>
        <p className="section-subtitle">
          Выберите точку доставки на карте или введите адрес вручную (только Ростовская область)
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
              {!mapReady && (
                <div className={styles.mapLoading}>
                  <div className={styles.spinner} />
                  <p>Загружаем карту…</p>
                </div>
              )}
              <div
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '500px',
                  borderRadius: '16px',
                  display: mapReady ? 'block' : 'none',
                }}
              />
            </div>

            <p className={styles.mapHint}>
              Нажмите на карту, чтобы выбрать точку доставки (только Ростовская область)
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Детали доставки</h2>

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