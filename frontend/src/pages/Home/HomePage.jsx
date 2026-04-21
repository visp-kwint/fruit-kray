import React, { useState } from 'react';
import Hero from '../../components/Hero/Hero';
import ProductSlider from '../../components/Slider/ProductSlider';
import ProductDetailsModal from '../../components/ProductDetailsModal/ProductDetailsModal';
import AdModal from '../../components/AdModal/AdModal';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [adModalProductId, setAdModalProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAddToCart = (product) => {
    setAdModalProductId(product.id);
  };

  return (
    <div className={styles.page}>
      <Hero />

      <section className={`section ${styles.showcase}`}>
        <div className="container">
          <ProductSlider
            title="Популярные десерты"
            subtitle="Самое любимое у наших покупателей"
            params={{ is_popular: true, category: 'desserts', limit: 8 }}
            onAddToCart={handleAddToCart}
          />

          <ProductSlider
            title="Новинки недели"
            subtitle="Только что появились в нашем ассортименте"
            params={{ is_new: true, limit: 8 }}
            onAddToCart={handleAddToCart}
          />

          <ProductSlider
            title="Товар дня"
            subtitle="Специальное предложение — только сегодня"
            params={{ is_day_item: true, limit: 6 }}
            featured={true}
            onAddToCart={handleAddToCart}
          />
        </div>
      </section>

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <AdModal
        triggerProductId={adModalProductId}
        onClose={() => setAdModalProductId(null)}
        onOpenProductDetails={setSelectedProduct}
      />
    </div>
  );
}