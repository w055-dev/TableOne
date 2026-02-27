import React from 'react';

const Table = React.memo(({ table, onClick }) => {
  const handleClick = () => {
    if (table.available) {
      onClick(table.id);
    }
  };

  const getTableStyle = () => {
    let width, height;
    if (table.seats <= 2) {
      width = '40px';
      height = '40px';
    } else if (table.seats <= 4) {
      width = '60px';
      height = '40px';
    } else if (table.seats <= 6) {
      width = '80px';
      height = '50px';
    } else {
      width = '100px';
      height = '60px';
    }
    return {
      width,
      height,
      borderRadius: '8px',
      background: table.available ? '#4caf50' : '#f44336'
    };
  };

  const style = getTableStyle();

  return (
    <div
      className={`table ${table.available ? 'available' : 'occupied'}`}
      style={{ 
        left: `${table.x}%`, 
        top: `${table.y}%`,
        ...style,
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        transition: 'all 0.2s',
        opacity: table.available ? 1 : 0.7
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Столик ${table.id}, ${table.available ? 'свободен' : 'занят'}, ${table.seats} мест`}
    >
      <span className="table-number" style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
        {table.id}
      </span>
      <span style={{ color: 'white', fontSize: '10px', marginTop: '2px' }}>
        {table.seats} мест
      </span>
    </div>
  );
});

export default Table;