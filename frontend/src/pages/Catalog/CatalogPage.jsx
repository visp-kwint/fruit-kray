import React, { useEffect, useState } from 'react';
import { categoriesAPI, productsAPI } from '../../api';
import ProductDetailsModal from '../../components/ProductDetailsModal/ProductDetailsModal';
import styles from './CatalogPage.module.css';

const BASE_URL =
  process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8080';

function resolveImage(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

export default function CatalogPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [categorySlug, setCategorySlug] = useState('all');
  const [search, setSearch]         = useState('');
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    categoriesAPI.getAll().then(({ data }) => {
      const list = Array.isArray(data) ? data : data?.categories ?? [];
      setCategories(list);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { page: 1, limit: 200 };
        if (categorySlug !== 'all') params.categorySlug = categorySlug;
        if (search.trim())  params.search   = search.trim();
        if (minPrice)       params.minPrice = Number(minPrice);
        if (maxPrice)       params.maxPrice = Number(maxPrice);

        const { data } = await productsAPI.getAll(params);
        const list = Array.isArray(data) ? data : data?.products ?? [];
        setProducts(list);
      } catch (e) {
        console.error(e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [categorySlug, search, minPrice, maxPrice]);

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className="section-title">Каталог</h1>
        <p className="section-subtitle">Свежие товары с доставкой</p>

        {/* Фильтры */}
        <div className={styles.filters}>
          <input
            className={styles.input}
            placeholder="🔍 Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.chips}>
            <button
              type="button"
              className={`${styles.chip} ${categorySlug === 'all' ? styles.active : ''}`}
              onClick={() => setCategorySlug('all')}
            >
              Все
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.chip} ${categorySlug === c.slug ? styles.active : ''}`}
                onClick={() => setCategorySlug(c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className={styles.priceRow}>
            <input
              className={styles.smallInput}
              placeholder="От ₽"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              className={styles.smallInput}
              placeholder="До ₽"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Список */}
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyWrap}>
            <span>🥕</span>
            <p>Товары не найдены</p>
          </div>
        ) : (
          <div className={styles.list}>
            {products.map((p) => {
              const img = resolveImage(p.imageUrl);
              const placeholder = `https://picsum.photos/seed/${p.id}/240/160`;

              return (
                <button
                  key={p.id}
                  type="button"
                  className={styles.row}
                  onClick={() => setSelected(p)}
                >
                  <img
                    src={img || placeholder}
                    alt={p.name}
                    className={styles.rowImg}
                    onError={(e) => { e.target.src = placeholder; }}
                  />

                  <div className={styles.rowInfo}>
                    <div className={styles.rowTop}>
                      <h3 className={styles.rowName}>{p.name}</h3>
                      <span className={styles.rowCategory}>
                        {p.category?.name}
                      </span>
                    </div>
                    <p className={styles.rowDesc}>{p.description}</p>
                    <div className={styles.rowBadges}>
                      {p.isNew      && <span className="badge badge-new">Новинка</span>}
                      {p.isPopular  && <span className="badge badge-popular">Хит</span>}
                      {p.isDayItem  && <span className="badge badge-day">Товар дня</span>}
                      {p.isDiscount && <span className="badge badge-new">Скидка</span>}
                    </div>
                  </div>

                  <div className={styles.rowRight}>
                    <div className={styles.rowPrice}>
                      {Number(p.price).toLocaleString('ru-RU')} ₽
                    </div>
                    <span className={styles.rowOpen}>Подробнее →</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ProductDetailsModal
        product={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}