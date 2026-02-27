import React from 'react';

const MenuItem = React.memo(({ item, isAdmin, onEdit, onDelete }) => (
  <div className="menu-item">
    <div className="menu-item-header">
      <span className="item-name">{item.name}</span>
      <span className="item-price">{item.price} €</span>
    </div>
    <p className="item-description">{item.description}</p>
    {isAdmin && (
      <div className="item-actions">
        <button 
          onClick={() => onEdit(item)}
          className="icon-btn edit-btn"
          aria-label="Редактировать"
        >
          Редактировать
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="icon-btn delete-btn"
          aria-label="Удалить"
        >
          Удалить
        </button>
      </div>
    )}
  </div>
));

export default MenuItem;