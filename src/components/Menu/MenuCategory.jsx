import React from 'react';
import MenuItem from './MenuItem';

const MenuCategory = ({ title, icon, items, isAdmin, onEdit, onDelete }) => {
  if (items.length === 0){
    return null;
  }

  return (
    <div className="menu-category">
      <h4>
        <span>{icon}</span> {title}
      </h4>
      {items.map(item => (
        <MenuItem
          key={item.id}
          item={item}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default React.memo(MenuCategory);