import React, { useEffect, useRef, useState } from 'react';
import { adminAPI, categoriesAPI, productsAPI, uploadAPI } from '../../api';
import styles from './AdminPage.module.css';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8080';

const EMPTY_PRODUCT = {
  name: '', description: '', details: '',
  price: '', imageUrl: '', categoryId: '',
  stock: 0,
  isNew: false, isDiscount: false, isPopular: false, isDayItem: false,
};

const EMPTY_CATEGORY = { name: '' };

const EMPTY_MODAL = {
  triggerCategoryId: '', title: '',
  description: '', productId: '', isActive: true,
};

function flash(setter, msg, ms = 2500) {
  setter(msg);
  setTimeout(() => setter(''), ms);
}

function unwrapArr(data) {
  if (Array.isArray(data)) return data;
  const key = Object.keys(data || {}).find((k) => Array.isArray(data[k]));
  return key ? data[key] : [];
}

export default function AdminPage() {
  const [tab, setTab]           = useState('products');
  const [loading, setLoading]   = useState(true);

  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [modals, setModals]         = useState([]);

  const [productForm, setProductForm]     = useState(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm]   = useState(EMPTY_CATEGORY);
  const [modalForm, setModalForm]         = useState(EMPTY_MODAL);

  const [editProductId, setEditProductId] = useState(null);

  const [productMsg, setProductMsg]   = useState('');
  const [categoryMsg, setCategoryMsg] = useState('');
  const [modalMsg, setModalMsg]       = useState('');

  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgPreview, setImgPreview]     = useState('');

  const fileInputRef = useRef(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        productsAPI.getAll({ limit: 200 }),
        categoriesAPI.getAdminAll(),
        adminAPI.getAdModals(),
      ]);

      const p = unwrapArr(pRes.data);
      const c = unwrapArr(cRes.data);
      const m = unwrapArr(mRes.data);

      setProducts(p);
      setCategories(c);
      setModals(m);

      setProductForm((prev) =>
        prev.categoryId || c.length === 0
          ? prev
          : { ...prev, categoryId: c[0].id }
      );

      setModalForm((prev) => ({
        ...prev,
        triggerCategoryId: prev.triggerCategoryId || c[0]?.id || '',
        productId:         prev.productId         || p[0]?.id || '',
      }));
    } catch (err) {
      console.error('loadAll error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Загрузка изображения
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgPreview(URL.createObjectURL(file));
    setUploadingImg(true);

    try {
      const { data } = await uploadAPI.image(file);
      const fullUrl = `${BASE_URL}${data.url}`;
      setProductForm((prev) => ({ ...prev, imageUrl: fullUrl }));
      flash(setProductMsg, 'Изображение загружено ✓');
    } catch (err) {
      flash(setProductMsg, 'Ошибка загрузки изображения');
      console.error(err);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!productForm.categoryId) {
      flash(setProductMsg, 'Ошибка: выберите категорию');
      return;
    }

    const payload = {
      name:        productForm.name.trim(),
      description: productForm.description.trim(),
      details:     productForm.details.trim(),
      price:       Number(productForm.price),
      imageUrl:    productForm.imageUrl.trim(),
      categoryId:  productForm.categoryId,
      stock:       Number(productForm.stock),
      isNew:       Boolean(productForm.isNew),
      isDiscount:  Boolean(productForm.isDiscount),
      isPopular:   Boolean(productForm.isPopular),
      isDayItem:   Boolean(productForm.isDayItem),
    };

    try {
      if (editProductId) {
        await adminAPI.updateProduct(editProductId, payload);
        flash(setProductMsg, 'Товар обновлён ✓');
      } else {
        await adminAPI.createProduct(payload);
        flash(setProductMsg, 'Товар добавлен ✓');
      }
      setProductForm(EMPTY_PRODUCT);
      setEditProductId(null);
      setImgPreview('');
      await loadAll();
    } catch (err) {
      flash(
        setProductMsg,
        `Ошибка: ${err.response?.data?.error || err.message}`
      );
    }
  };

  const handleEditProduct = (p) => {
    setEditProductId(p.id);
    setProductForm({
      name:        p.name        || '',
      description: p.description || '',
      details:     p.details     || '',
      price:       p.price       ?? '',
      imageUrl:    p.imageUrl    || '',
      categoryId:  p.categoryId  || p.category?.id || '',
      stock:       p.stock       ?? 0,
      isNew:       Boolean(p.isNew),
      isDiscount:  Boolean(p.isDiscount),
      isPopular:   Boolean(p.isPopular),
      isDayItem:   Boolean(p.isDayItem),
    });
    setImgPreview(p.imageUrl || '');
    setTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await adminAPI.deleteProduct(id);
      flash(setProductMsg, 'Товар удалён');
      await loadAll();
    } catch (err) {
      flash(setProductMsg, `Ошибка: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) { flash(setCategoryMsg, 'Ошибка: введите название'); return; }

    try {
      await categoriesAPI.create({ name });
      setCategoryForm(EMPTY_CATEGORY);
      flash(setCategoryMsg, 'Категория добавлена ✓');
      await loadAll();
    } catch (err) {
      flash(setCategoryMsg, `Ошибка: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Удалить категорию?')) return;
    try {
      await categoriesAPI.remove(id);
      flash(setCategoryMsg, 'Категория удалена');
      await loadAll();
    } catch (err) {
      flash(setCategoryMsg, `Ошибка: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.triggerCategoryId || !modalForm.productId) {
      flash(setModalMsg, 'Ошибка: выберите категорию и товар');
      return;
    }

    try {
      await adminAPI.createAdModal({
        triggerCategoryId: modalForm.triggerCategoryId,
        title:             modalForm.title.trim(),
        description:       modalForm.description.trim(),
        productId:         modalForm.productId,
        isActive:          Boolean(modalForm.isActive),
      });
      setModalForm(EMPTY_MODAL);
      flash(setModalMsg, 'Попап создан ✓');
      await loadAll();
    } catch (err) {
      flash(setModalMsg, `Ошибка: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteModal = async (id) => {
    if (!window.confirm('Удалить попап?')) return;
    try {
      await adminAPI.deleteAdModal(id);
      flash(setModalMsg, 'Попап удалён');
      await loadAll();
    } catch (err) {
      flash(setModalMsg, `Ошибка: ${err.response?.data?.error || err.message}`);
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

        {/* Header */}
        <div className={styles.adminHeader}>
          <div>
            <h1 className={styles.adminTitle}>👑 Админ-панель</h1>
            <p className={styles.adminSub}>Фрукт Край — управление магазином</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{products.length}</span>
              <span className={styles.statLabel}>Товаров</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{categories.length}</span>
              <span className={styles.statLabel}>Категорий</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{modals.length}</span>
              <span className={styles.statLabel}>Попапов</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { key: 'products',   label: '🛍️ Товары' },
            { key: 'categories', label: '📁 Категории' },
            { key: 'modals',     label: '🎁 Реклама' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tab} ${tab === t.key ? styles.activeTab : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ТОВАРЫ ── */}
        {tab === 'products' && (
          <div className={styles.tabContent}>

            {/* Форма */}
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>
                {editProductId ? '✏️ Редактировать товар' : '➕ Добавить товар'}
              </h2>

              <form className={styles.form} onSubmit={handleProductSubmit}>

                {/* Загрузка фото */}
                <div className={styles.uploadSection}>
                  <div
                    className={styles.uploadArea}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imgPreview ? (
                      <img
                        src={imgPreview}
                        alt="preview"
                        className={styles.uploadPreview}
                      />
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <span className={styles.uploadIcon}>📷</span>
                        <p>Нажмите чтобы загрузить фото</p>
                        <span className={styles.uploadHint}>
                          JPG, PNG, WebP — до 5 МБ
                        </span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInputHidden}
                    onChange={handleFileChange}
                  />

                  {uploadingImg && (
                    <p className={styles.uploadingText}>Загружаем...</p>
                  )}

                  <div className={styles.urlRow}>
                    <label className={styles.label}>или вставьте URL</label>
                    <input
                      name="imageUrl"
                      className={styles.input}
                      value={productForm.imageUrl}
                      onChange={handleProductChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Основные поля */}
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Название *</label>
                    <input
                      name="name"
                      className={styles.input}
                      value={productForm.name}
                      onChange={handleProductChange}
                      placeholder="Название товара"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Цена (₽) *</label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      className={styles.input}
                      value={productForm.price}
                      onChange={handleProductChange}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Категория *</label>
                    <select
                      name="categoryId"
                      className={styles.input}
                      value={productForm.categoryId}
                      onChange={handleProductChange}
                      required
                    >
                      <option value="">— Выберите категорию —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Остаток</label>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      className={styles.input}
                      value={productForm.stock}
                      onChange={handleProductChange}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Короткое описание</label>
                  <textarea
                    name="description"
                    className={`${styles.input} ${styles.textarea}`}
                    value={productForm.description}
                    onChange={handleProductChange}
                    placeholder="Короткое описание для карточки"
                    rows={2}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Подробное описание</label>
                  <textarea
                    name="details"
                    className={`${styles.input} ${styles.textarea}`}
                    value={productForm.details}
                    onChange={handleProductChange}
                    placeholder="Состав, особенности, для чего подходит..."
                    rows={4}
                  />
                </div>

                {/* Флаги */}
                <div className={styles.flags}>
                  {[
                    { name: 'isNew',      label: '✨ Новинка' },
                    { name: 'isDiscount', label: '💰 Скидка' },
                    { name: 'isPopular',  label: '🔥 Популярный' },
                    { name: 'isDayItem',  label: '⭐ Товар дня' },
                  ].map((f) => (
                    <label key={f.name} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name={f.name}
                        checked={Boolean(productForm[f.name])}
                        onChange={handleProductChange}
                        className={styles.checkbox}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>

                {productMsg && (
                  <p className={`${styles.msg} ${
                    productMsg.includes('Ошибка') ? styles.msgError : styles.msgOk
                  }`}>
                    {productMsg}
                  </p>
                )}

                <div className={styles.formActions}>
                  <button type="submit" className="btn btn-cherry" disabled={uploadingImg}>
                    {editProductId ? 'Сохранить' : 'Добавить товар'}
                  </button>
                  {editProductId && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditProductId(null);
                        setProductForm(EMPTY_PRODUCT);
                        setImgPreview('');
                      }}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Таблица товаров */}
            <div className={styles.tableWrap}>
              <h2 className={styles.tableTitle}>
                Все товары ({products.length})
              </h2>

              {products.length === 0 ? (
                <p className={styles.empty}>Товаров пока нет</p>
              ) : (
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>Фото</span>
                    <span>Товар</span>
                    <span>Категория</span>
                    <span>Цена</span>
                    <span>Остаток</span>
                    <span>Действия</span>
                  </div>

                  {products.map((p) => (
                    <div key={p.id} className={styles.tableRow}>
                      <span>
                        <img
                          src={p.imageUrl || 'https://picsum.photos/seed/ph/60/60'}
                          alt={p.name}
                          className={styles.tableImg}
                        />
                      </span>

                      <span className={styles.productNameBlock}>
                        <span className={styles.productName}>{p.name}</span>
                        <span className={styles.productDesc}>
                          {p.description || '—'}
                        </span>
                      </span>

                      <span className={styles.catCell}>
                        {p.category?.name || '—'}
                      </span>

                      <span className={styles.priceCell}>
                        {Number(p.price).toLocaleString('ru-RU')} ₽
                      </span>

                      <span className={`${styles.stockCell} ${p.stock <= 5 ? styles.lowStock : ''}`}>
                        {p.stock}
                      </span>

                      <span className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`btn btn-outline btn-sm`}
                          onClick={() => handleEditProduct(p)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          🗑️
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── КАТЕГОРИИ ── */}
        {tab === 'categories' && (
          <div className={styles.tabContent}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>➕ Добавить категорию</h2>

              <form className={styles.form} onSubmit={handleCategorySubmit}>
                <div className={styles.field}>
                  <label className={styles.label}>Название *</label>
                  <input
                    className={styles.input}
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ name: e.target.value })}
                    placeholder="Например: Ягоды"
                    required
                  />
                </div>

                {categoryMsg && (
                  <p className={`${styles.msg} ${
                    categoryMsg.includes('Ошибка') ? styles.msgError : styles.msgOk
                  }`}>
                    {categoryMsg}
                  </p>
                )}

                <button type="submit" className="btn btn-cherry">
                  Создать категорию
                </button>
              </form>
            </div>

            <div className={styles.tableWrap}>
              <h2 className={styles.tableTitle}>
                Все категории ({categories.length})
              </h2>

              {categories.length === 0 ? (
                <p className={styles.empty}>Категорий пока нет</p>
              ) : (
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.catHead}`}>
                    <span>Название</span>
                    <span>Slug</span>
                    <span>Товаров</span>
                    <span>Создано</span>
                    <span>Действия</span>
                  </div>

                  {categories.map((c) => {
                    const cnt = products.filter((p) => p.categoryId === c.id).length;
                    return (
                      <div key={c.id} className={`${styles.tableRow} ${styles.catRow}`}>
                        <span className={styles.productName}>{c.name}</span>
                        <span className={styles.catCell}>{c.slug}</span>
                        <span className={styles.stockCell}>{cnt}</span>
                        <span className={styles.dateCell}>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString('ru-RU')
                            : '—'}
                        </span>
                        <span className={styles.actionsCell}>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteCategory(c.id)}
                          >
                            🗑️
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── РЕКЛАМА ── */}
        {tab === 'modals' && (
          <div className={styles.tabContent}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>➕ Создать рекламный попап</h2>

              <form className={styles.form} onSubmit={handleModalSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Категория-триггер *</label>
                    <select
                      name="triggerCategoryId"
                      className={styles.input}
                      value={modalForm.triggerCategoryId}
                      onChange={(e) =>
                        setModalForm((p) => ({
                          ...p,
                          triggerCategoryId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">— Выберите категорию —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Рекламируемый товар *</label>
                    <select
                      name="productId"
                      className={styles.input}
                      value={modalForm.productId}
                      onChange={(e) =>
                        setModalForm((p) => ({
                          ...p,
                          productId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">— Выберите товар —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Заголовок *</label>
                  <input
                    name="title"
                    className={styles.input}
                    value={modalForm.title}
                    onChange={(e) =>
                      setModalForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Например: Дополните заказ десертом"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Описание</label>
                  <textarea
                    name="description"
                    className={`${styles.input} ${styles.textarea}`}
                    value={modalForm.description}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Текст рекламного окна"
                    rows={2}
                  />
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={Boolean(modalForm.isActive)}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        isActive: e.target.checked,
                      }))
                    }
                    className={styles.checkbox}
                  />
                  Попап активен
                </label>

                {modalMsg && (
                  <p className={`${styles.msg} ${
                    modalMsg.includes('Ошибка') ? styles.msgError : styles.msgOk
                  }`}>
                    {modalMsg}
                  </p>
                )}

                <button type="submit" className="btn btn-cherry">
                  Создать попап
                </button>
              </form>
            </div>

            <div className={styles.tableWrap}>
              <h2 className={styles.tableTitle}>
                Все попапы ({modals.length})
              </h2>

              {modals.length === 0 ? (
                <p className={styles.empty}>Попапов пока нет</p>
              ) : (
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.modalHead}`}>
                    <span>Заголовок</span>
                    <span>Категория</span>
                    <span>Товар</span>
                    <span>Статус</span>
                    <span>Действия</span>
                  </div>

                  {modals.map((m) => (
                    <div key={m.id} className={`${styles.tableRow} ${styles.modalRow}`}>
                      <span className={styles.productNameBlock}>
                        <span className={styles.productName}>{m.title}</span>
                        <span className={styles.productDesc}>
                          {m.description || '—'}
                        </span>
                      </span>

                      <span className={styles.catCell}>
                        {m.triggerCategory?.name || '—'}
                      </span>

                      <span className={styles.catCell}>
                        {m.product?.name || '—'}
                      </span>

                      <span>
                        {m.isActive ? (
                          <span className="badge badge-new">Active</span>
                        ) : (
                          <span className="badge badge-day">Off</span>
                        )}
                      </span>

                      <span className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteModal(m.id)}
                        >
                          🗑️
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}