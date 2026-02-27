import React from 'react';

const PanelHeader = ({ showMenu, isAdmin, onMenuToggle, onAdminClick, onLogout }) => {
  return (
    <div className="panel-header">
      <h2>Бронирование</h2>
      <div className="header-buttons">
        <button 
          className="menu-button" 
          onClick={onMenuToggle}
        >
          {showMenu ? 'Назад к бронированию' : 'Меню'}
        </button>
        
        {!isAdmin && !showMenu && (
          <button 
            className="admin-button" 
            onClick={onAdminClick}
          >
            Админ
          </button>
        )}
        
        {isAdmin && (
          <button 
            className="logout-button" 
            onClick={onLogout}
          >
            Выйти из админки
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(PanelHeader);