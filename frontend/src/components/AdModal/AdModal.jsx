import React, { useEffect, useState } from 'react';
import { productsAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import styles from './AdModal.module.css';

export default function AdModal({ triggerProductId, onClose, onOpenProductDetails }) {
  const [modal, setModal] = useState(null);
  const [product, setProduct] = useState(null);
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!triggerProductId) return;

    const fetchModal = async () => {
      try {
        const { data } = await productsAPI.getAdModal(triggerProductId);
        setModal(data);
        if (data.product?.id) {
          const { data: prod } = await productsAPI.getById(data.product.id);
          setProduct(prod);
        }
        setVisible(true);
      } catch {
        // Попап не настроен — ничего не показываем
      }
    };

    fetchModal();
  }, [triggerProductId]);

  const handleAdd = () => {
    if (product) addItem(product);
    handleClose();
  };

  const handleDetails = () => {
    if (product) onOpenProductDetails?.(product);
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setModal(null);
      setProduct(null);
      onClose();
    }, 300);
  };

  if (!modal || !visible) return null;

  return (
    <div className={`${styles.overlay} ${!visible ? styles.hide : ''}`} onClick={handleClose}>
      <div
        className={`${styles.modal} ${!visible ? styles.slideOut : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div>
              <p className={styles.eyebrow}>Специально для вас</p>
              <h3 className={styles.title}>{modal.title}</h3>
            </div>
          </div>
          <button className={styles.close} onClick={handleClose}>×</button>
        </div>

        <p className={styles.desc}>{modal.description}</p>

        {product && (
          <div className={styles.productRow}>
            <img
              src={product.imageUrl || `https://picsum.photos/seed/${product.name}/80/80`}
              alt={product.name}
              className={styles.productImg}
            />
            <div className={styles.productInfo}>
              <p className={styles.productName}>{product.name}</p>
              <p className={styles.productPrice}>{product.price} ₽</p>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={`btn btn-cherry btn-sm ${styles.addBtn}`} onClick={handleAdd}>
            Добавить в корзину
          </button>
          <button className={`btn btn-outline btn-sm ${styles.detailsBtn}`} onClick={handleDetails}>
            Подробнее
          </button>
        </div>

        <button className={styles.dismiss} onClick={handleClose}>
          Не сейчас
        </button>
      </div>
    </div>
  );
}