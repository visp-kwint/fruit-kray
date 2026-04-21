import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { totalCount } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.inner} container`}>
        {/* Логотип */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}></span>
          <span className={styles.logoText}>Фрукт Край</span>
        </Link>

        {/* Навигация */}
        <nav className={styles.nav}>
          <Link
            to="/catalog"
            className={`${styles.navLink} ${isActive('/catalog') ? styles.active : ''}`}
          >
            Каталог
          </Link>

          {user && (
            <Link
              to="/cart"
              className={`${styles.navLink} ${isActive('/cart') ? styles.active : ''}`}
            >
              Корзина
              {totalCount > 0 && (
                <span className={styles.cartBadge}>{totalCount}</span>
              )}
            </Link>
          )}

          {user ? (
            <>
              <Link
                to="/profile"
                className={`${styles.navLink} ${isActive('/profile') ? styles.active : ''}`}
              >
                Кабинет
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`${styles.navLink} ${styles.adminLink} ${isActive('/admin') ? styles.active : ''}`}
                >
                  Админ
                </Link>
              )}
              <button className={styles.logoutBtn} onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`${styles.navLink} ${isActive('/login') ? styles.active : ''}`}
              >
                Войти
              </Link>
              <Link to="/register" className="btn btn-cherry btn-sm">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}