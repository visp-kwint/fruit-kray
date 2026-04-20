import React, { useEffect, useState } from 'react';
import { productsAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import styles from './AdModal.module.css';

export default function AdModal({ triggerCategory, onClose }) {
  const [modal, setModal] = useState(null);
  const [product, setProduct] = useState(null);
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!triggerCategory) return;

    const fetchModal = async () => {
      try {
        const { data } = await productsAPI.getAdModal(triggerCategory);
        setModal(data);

        // Загружаем предлагаемый товар
        if (data.product_id) {
          const { data: prod } = await productsAPI.getById(data.product_id);
          setProduct(prod);
        }

        setVisible(true);
      } catch {
        // Попап не настроен — ничего не показываем
      }
    };

    fetchModal();
  }, [triggerCategory]);

  const handleAdd = () => {
    if (product) {
      addItem(product);
    }
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!modal || !visible) return null;

  return (
    <div className={`${styles.overlay} ${!visible ? styles.hide : ''}`} onClick={handleClose}>
      <div
        className={`${styles.modal} ${!visible ? styles.slideOut : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>🎁</span>
            <div>
              <p className={styles.eyebrow}>Специально для вас</p>
              <h3 className={styles.title}>{modal.title}</h3>
            </div>
          </div>
          <button className={styles.close} onClick={handleClose}>×</button>
        </div>

        {/* Описание */}
        <p className={styles.desc}>{modal.description}</p>

        {/* Товар */}
        {product && (
          <div className={styles.productRow}>
            <img
              src={product.image_url || `https://picsum.photos/seed/${product.name}/80/80`}
              alt={product.name}
              className={styles.productImg}
            />
            <div className={styles.productInfo}>
              <p className={styles.productName}>{product.name}</p>
              <p className={styles.productPrice}>{product.price} ₽</p>
            </div>
            <button className={`btn btn-cherry btn-sm ${styles.addBtn}`} onClick={handleAdd}>
              Добавить
            </button>
          </div>
        )}

        {/* Отклонить */}
        <button className={styles.dismiss} onClick={handleClose}>
          Не сейчас
        </button>
      </div>
    </div>
  );
}