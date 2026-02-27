import React from 'react';

const AdminLoginModal = ({ password, setPassword, onLogin, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="admin-login-modal">
      <div className="admin-login-content">
        <h3>Вход для администратора</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <div className="admin-login-actions">
            <button type="submit">Войти</button>
            <button type="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(AdminLoginModal);