import React from 'react';
import MenuEditor from './MenuEditor';
import TableManager from './TableManager';

const AdminPanel = ({ 
  menuItems,
  editingItem,
  setEditingItem,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  tables,
  onTableToggle
}) => {
  return (
    <div className="admin-section">
      <h3>Панель администратора</h3>
      
      <div className="admin-panel">
        <h4>Управление меню</h4>
        <MenuEditor
          items={menuItems}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          onAdd={onAddMenuItem}
          onSave={onUpdateMenuItem}
          onDelete={onDeleteMenuItem}
        />

        <h4>Управление столиками</h4>
        <TableManager
          tables={tables}
          onTableToggle={onTableToggle}
        />
      </div>
    </div>
  );
};

export default React.memo(AdminPanel);