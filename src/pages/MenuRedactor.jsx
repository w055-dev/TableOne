import React, { useState } from 'react';

const MenuRedactor = ({ menuItems, onUpdateMenu, onCreateDish, onDeleteDish }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [newDish, setNewDish] = useState({
    name: '',
    price: '',
    category: 'Закуски',
    weight: '',
    description: '',
    recipe: ''
  });

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleSave = () => {
    if (editingItem) {
      onUpdateMenu(editingItem.id, editingItem);
      setEditingItem(null);
    }
  };

  const handleCreate = () => {
    if (newDish.name && newDish.price &&newDish.weight) {
      onCreateDish(newDish);
      setNewDish({
        name: '',
        price: '',
        category: 'Закуски',
        weight: '',
        description: '',
        recipe: ''
      });
    } else {
      alert('Заполните название,цену и вес блюда');
    }
  };
  const handleDelete = (itemId) => {
    onDeleteDish(itemId);
  }

  return (
    <div className="menu-redactor">
      <div className="admin-header">
        <button className="btn-back" onClick={() => window.location.href = '/'}>
          На главную
        </button>
        <h1>Редактор меню</h1>
      </div>
      <div className="add-dish-form">
        <h2>Добавить новое блюдо</h2>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Название"
            value={newDish.name}
            onChange={(e) => setNewDish({...newDish, name: e.target.value})}
          />
          <input
            type="number"
            placeholder="Цена"
            value={newDish.price}
            onChange={(e) => setNewDish({...newDish, price: e.target.value})}
          />
          <select
            value={newDish.category}
            onChange={(e) => setNewDish({...newDish, category: e.target.value})}
          >
            <option>Закуски</option>
            <option>Пицца</option>
            <option>Паста</option>
            <option>Ризотто</option>
            <option>Напитки</option>
            <option>Десерты</option>
          </select>
          <input
            type="text"
            placeholder="Вес (например: 200г)"
            value={newDish.weight}
            onChange={(e) => setNewDish({...newDish, weight: e.target.value})}
          />
          <input
            type="text"
            placeholder="Описание"
            value={newDish.description}
            onChange={(e) => setNewDish({...newDish, description: e.target.value})}
          />
          <textarea
            placeholder="Рецепт"
            value={newDish.recipe}
            onChange={(e) => setNewDish({...newDish, recipe: e.target.value})}
          />
          <button className="btn" onClick={handleCreate}>Добавить</button>
        </div>
      </div>
      
      <div className="dishes-list">
        <h2>Существующие блюда</h2>
        <div className="dishes-grid">
          {menuItems.map(item => (
            <div key={item.id} className="dish-card">
              {editingItem?.id === item.id ? (
                <>
                  <input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                  />
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  >
                    <option>Закуски</option>
                    <option>Пицца</option>
                    <option>Паста</option>
                    <option>Ризотто</option>
                    <option>Напитки</option>
                    <option>Десерты</option>
                  </select>
                  <div className="edit-actions">
                    <button onClick={handleSave}>Сохранить</button>
                    <button onClick={() => setEditingItem(null)}>Отмена</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{item.name}</h3>
                  <p>Цена: {item.price} ₽</p>
                  <p>Категория: {item.category}</p>
                  <p>Вес: {item.weight}</p>
                  <div className="dish-actions">
                    <button onClick={() => handleEdit(item)}>Редактировать</button>
                    <button onClick={() => handleDelete(item.id)}>Удалить</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuRedactor;