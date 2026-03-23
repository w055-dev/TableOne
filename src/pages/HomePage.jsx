import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = ({ isAuthenticated }) => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Добро пожаловать в наш ресторан</h1>
          <p>Изысканная индийская кухня в уютной атмосфере</p>
          {!isAuthenticated ? (
            <Link to="/login" className="hero-btn">
              Забронировать столик
            </Link>
          ) : (
            <Link to="/booking" className="hero-btn">
              Забронировать столик
            </Link>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2>Наши преимущества</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍛</div>
              <h3>Аутентичная кухня</h3>
              <p>Традиционные индийские рецепты от шеф-повара</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>Уютная атмосфера</h3>
              <p>Интерьер в индийском стиле для полного погружения</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🍳</div>
              <h3>Профессиональные повара</h3>
              <p>Блюда готовятся с душой и любовью</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Онлайн бронирование</h3>
              <p>Удобная система бронирования столиков</p>
            </div>
          </div>
        </div>
      </section>
      <section className="menu-cta-section">
        <div className="container">
          <div className="menu-cta-content">
            <h2>Откройте для себя наше меню</h2>
            <p>Традиционные индийские блюда, приготовленные с любовью и специями</p>
            <Link to="/menu" className="menu-cta-btn">
              Посмотреть меню →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;