import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ProductCard from '../ProductCard/ProductCard';
import { productsAPI } from '../../api';
import styles from './ProductSlider.module.css';

const SLIDER_SETTINGS = {
  dots: false,
  infinite: true,
  speed: 600,
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 3 } },
    { breakpoint: 900,  settings: { slidesToShow: 2 } },
    { breakpoint: 600,  settings: { slidesToShow: 1 } },
  ],
};

export default function ProductSlider({ title, subtitle, params, featured = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await productsAPI.getAll(params);
        setProducts(data.products || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className={styles.sliderSection}>
      <div className={styles.sliderHeader}>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>

      {loading ? (
        <div className={styles.skeletonRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${styles.skeletonCard} skeleton`} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className={styles.empty}>Товаров пока нет</p>
      ) : (
        <div className={styles.sliderWrap}>
          <Slider {...SLIDER_SETTINGS}>
            {products.map((p) => (
              <div key={p.id} className={styles.slide}>
                <ProductCard product={p} featured={featured && p.is_day_item} />
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
}