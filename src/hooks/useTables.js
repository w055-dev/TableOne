import { useState, useCallback } from 'react';

export const useTables = (initialTables) => {
  const [tables, setTables] = useState(initialTables);

  const toggleTableAvailability = useCallback((tableId) => {
    setTables(prev => prev.map(table =>
      table.id === tableId 
        ? { ...table, available: !table.available }
        : table
    ));
  }, []);

  const getTableById = useCallback((tableId) => {
    return tables.find(t => t.id === tableId);
  }, [tables]);

  return {
    tables,
    setTables,
    toggleTableAvailability,
    getTableById
  };
};