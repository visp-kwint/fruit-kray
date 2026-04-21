import React, { useState } from 'react';
import Hero from '../../components/Hero/Hero';
import ProductSlider from '../../components/Slider/ProductSlider';
import AdModal from '../../components/AdModal/AdModal';
import { useCart } from '../../context/CartContext';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { items } = useCart();
  const [adCategory, setAdCategory] = useState(null);

  // Слушаем изменения корзины для показа рекламного попапа
  const lastItem = items[items.length - 1];
  const currentCategory = lastItem?.category;

  const handleAdClose = () => setAdCategory(null);

  return (
    <div className={styles.page}>
      {/* Hero блок */}
      <Hero />

      {/* Витрина */}
      <section className={`section ${styles.showcase}`}>
        <div className="container">
          <ProductSlider
            title="Популярные десерты"
            subtitle="Самое любимое у наших покупателей"
            params={{ is_popular: true, category: 'desserts', limit: 8 }}
          />

          <ProductSlider
            title="Новинки недели"
            subtitle="Только что появились в нашем ассортименте"
            params={{ is_new: true, limit: 8 }}
          />

          <ProductSlider
            title="Товар дня"
            subtitle="Специальное предложение — только сегодня"
            params={{ is_day_item: true, limit: 6 }}
            featured={true}
          />
        </div>
      </section>

      {/* Рекламный попап при добавлении в корзину */}
      {currentCategory && adCategory !== null && (
        <AdModal
          triggerCategory={adCategory}
          onClose={handleAdClose}
        />
      )}
    </div>
  );
}