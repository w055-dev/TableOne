import { useState, useCallback, useMemo } from 'react';

export const useMenu = (initialItems) => {
  const [items, setItems] = useState(initialItems);
  const [editingItem, setEditingItem] = useState(null);

  const addItem = useCallback(() => {
    const newItem = {
      id: Math.max(...items.map(i => i.id), 0) + 1,
      name: 'Новое блюдо',
      price: 0,
      description: '',
      category: 'main',
    };
    setItems(prev => [...prev, newItem]);
    setEditingItem(newItem);
  }, [items]);

  const updateItem = useCallback((updatedItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditingItem(null);
  }, []);

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const itemsByCategory = useMemo(() => ({
    starter: items.filter(item => item.category === 'starter'),
    main: items.filter(item => item.category === 'main'),
    dessert: items.filter(item => item.category === 'dessert')
  }), [items]);

  return {
    items,
    editingItem,
    setEditingItem,
    addItem,
    updateItem,
    deleteItem,
    itemsByCategory
  };
};