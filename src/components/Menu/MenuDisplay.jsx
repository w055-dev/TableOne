import React from 'react';
import MenuCategory from './MenuCategory';
import { MENU_CATEGORIES } from '../../constants';

const MenuDisplay = ({ itemsByCategory }) => {
  return (
    <div className="menu-section">
      <h3>Французское меню</h3>
      <div className="menu-categories">
        {Object.entries(MENU_CATEGORIES).map(([category, { label, icon }]) => (
          <MenuCategory
            key={category}
            title={label}
            icon={icon}
            items={itemsByCategory[category] || []}
            isAdmin={false}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(MenuDisplay);