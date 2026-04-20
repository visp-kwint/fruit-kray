import React from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <img
          src="/assets/hero-frukt-kray.png"
          alt="Фрукт Край — Ваша садовая семья"
          className={styles.heroImage}
        />

        <p className={styles.heroSubtitle}>
          Фрукты, овощи и десерты — прямо к вашей двери
        </p>

        <div className={styles.heroActions}>
          <a href="/catalog" className="btn btn-cherry btn-lg">
            Перейти в каталог
          </a>
          <a href="/register" className="btn btn-outline btn-lg">
            Присоединиться
          </a>
        </div>
      </div>
    </section>
  );
}