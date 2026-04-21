import React, { useEffect, useRef, useState } from 'react';
import { categoriesAPI, productsAPI } from '../../api';
import ProductDetailsModal from '../../components/ProductDetailsModal/ProductDetailsModal';
import AdModal from '../../components/AdModal/AdModal';
import styles from './CatalogPage.module.css';

const BASE_URL =
  process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8080';

function resolveImage(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

const SORT_OPTIONS = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'popular', label: '🔥 Популярные' },
  { value: 'new', label: '✨ Новинки' },
  { value: 'cheap', label: 'Сначала дешевле' },
  { value: 'expensive', label: 'Сначала дороже' },
];

export default function CatalogPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [categorySlug, setCategorySlug] = useState('all');
  const [search, setSearch]         = useState('');
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');
  const [sort, setSort]             = useState('default');
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [adModalProductId, setAdModalProductId] = useState(null);

  const [catOpen, setCatOpen]       = useState(false);
  const [sortOpen, setSortOpen]     = useState(false);

  const catRef  = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target))  setCatOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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
        const params = { page: 1, limit: 100 };
        if (categorySlug !== 'all') params.categorySlug = categorySlug;
        if (search.trim())  params.search   = search.trim();
        if (minPrice)       params.minPrice = Number(minPrice);
        if (maxPrice)       params.maxPrice = Number(maxPrice);
        if (sort !== 'default') params.sort = sort;

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
  }, [categorySlug, search, minPrice, maxPrice, sort]);

  const activeCategoryName = categorySlug === 'all'
    ? 'Все категории'
    : categories.find((c) => c.slug === categorySlug)?.name || 'Категория';

  const activeSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label || 'Сортировка';

  const handleAddToCart = (product) => {
    setAdModalProductId(product.id);
  };

  const handleOpenProductDetails = (product) => {
    setSelected(product);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className="section-title">Каталог</h1>
        <p className="section-subtitle">Свежие товары с доставкой</p>

        <div className={styles.filters}>
          <input
            className={styles.input}
            placeholder="🔍 Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.filterRow}>
            <div className={styles.dropdown} ref={sortRef}>
              <button
                type="button"
                className={`${styles.dropdownTrigger} ${sortOpen ? styles.dropdownTriggerOpen : ''}`}
                onClick={() => setSortOpen((v) => !v)}
              >
                <span className={styles.dropdownLabel}>{activeSortLabel}</span>
                <span className={styles.dropdownArrow}>▾</span>
              </button>

              {sortOpen && (
                <div className={styles.dropdownMenu}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.dropdownItem} ${sort === opt.value ? styles.dropdownItemActive : ''}`}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.dropdown} ref={catRef}>
              <button
                type="button"
                className={`${styles.dropdownTrigger} ${catOpen ? styles.dropdownTriggerOpen : ''}`}
                onClick={() => setCatOpen((v) => !v)}
              >
                <span className={styles.dropdownLabel}>{activeCategoryName}</span>
                <span className={styles.dropdownArrow}>▾</span>
              </button>

              {catOpen && (
                <div className={styles.dropdownMenu}>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${categorySlug === 'all' ? styles.dropdownItemActive : ''}`}
                    onClick={() => { setCategorySlug('all'); setCatOpen(false); }}
                  >
                    Все категории
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.dropdownItem} ${categorySlug === c.slug ? styles.dropdownItemActive : ''}`}
                      onClick={() => { setCategorySlug(c.slug); setCatOpen(false); }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.priceWrap}>
              <input
                className={styles.smallInput}
                placeholder="От ₽"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className={styles.priceDash}>—</span>
              <input
                className={styles.smallInput}
                placeholder="До ₽"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

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
        onAddToCart={handleAddToCart}
      />

      <AdModal
        triggerProductId={adModalProductId}
        onClose={() => setAdModalProductId(null)}
        onOpenProductDetails={handleOpenProductDetails}
      />
    </div>
  );
}