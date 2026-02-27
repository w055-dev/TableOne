import React from 'react';

const TableManager = ({ tables, onTableToggle }) => {
  return (
    <div className="table-management">
      {tables.map(table => (
        <div key={table.id} className="table-control">
          <span>
            Стол {table.id} 
            <span style={{ 
              marginLeft: '8px',
              color: table.available ? '#4caf50' : '#f44336',
              fontSize: '12px'
            }}>
              ({table.available ? 'свободен' : 'занят'})
            </span>
          </span>
          <button
            className={table.available ? 'set-occupied' : 'set-available'}
            onClick={() => onTableToggle(table.id)}
          >
            {table.available ? 'Забронировать' : 'Освободить'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default React.memo(TableManager);