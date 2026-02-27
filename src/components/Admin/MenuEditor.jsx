import React, { useState } from 'react';
import { MENU_CATEGORIES } from '../../constants';

const MenuEditor = ({ items, editingItem, onEdit, onSave, onDelete, onAdd, setEditingItem }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddClick = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      price: '',
      description: '',
      category: 'main',
    };
    setEditingItem(newItem);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleSave = () => {
    if (!editingItem.name.trim()) {
      alert('Введите название блюда');
      return;
    }
    if (!editingItem.price) {
      alert('Введите цену');
      return;
    }
    if (!editingItem.description.trim()) {
      alert('Введите описание');
      return;
    }

    onSave(editingItem);
    setShowAddForm(false);
  };

  if (editingItem) {
    return (
      <div className="edit-form" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '15px' }}>
          {showAddForm ? ' Добавление нового блюда' : 'Редактирование блюда'}
        </h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Название блюда:
          </label>
          <input
            type="text"
            value={editingItem.name}
            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
            placeholder="Название блюда"
            style={{ width: '100%', padding: '8px' }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Цена (в евро):
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              value={editingItem.price}
              onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
              placeholder="0"
              min="0"
              step="0.5"
              style={{ width: '100px', padding: '8px', marginRight: '10px' }}
            />
            <span>€</span>
          </div>
          <small style={{ color: '#666' }}>Введите цену (например: 24, 15.5, 32.90)</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Категория:
          </label>
          <select
            value={editingItem.category}
            onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
            style={{ width: '100%', padding: '8px' }}
          >
            {Object.entries(MENU_CATEGORIES).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Описание:
          </label>
          <textarea
            value={editingItem.description}
            onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
            placeholder="Опишите блюдо..."
            rows={3}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div className="edit-actions" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="save-btn" 
            onClick={handleSave}
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: '#4CAF50', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Сохранить
          </button>
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: '#f44336', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button 
        className="add-item-btn" 
        onClick={handleAddClick}
        style={{ 
          padding: '10px 20px', 
          background: '#4CAF50', 
          color: 'white', 
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        Добавить новое блюдо
      </button>
      
      <div className="menu-editor">
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Меню пусто. Нажмите "Добавить новое блюдо"
          </p>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className="menu-edit-item"
              style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #ddd'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ margin: 0 }}>{item.name}</h4>
                    <span style={{ 
                      background: '#4CAF50', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {item.price} €
                    </span>
                    <span style={{ 
                      background: '#f0f0f0', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {MENU_CATEGORIES[item.category]?.label || item.category}
                    </span>
                  </div>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                    {item.description}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => {
                      setEditingItem(item);
                      setShowAddForm(false);
                    }} 
                    style={{ 
                      background: '#2196F3', 
                      color: 'white', 
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Удалить "${item.name}"?`)) {
                        onDelete(item.id);
                      }
                    }} 
                    style={{ 
                      background: '#f44336', 
                      color: 'white', 
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(MenuEditor);