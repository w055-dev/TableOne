import React from 'react';

const AdminPanel = ({ orders, onServed, onBack }) => {
  const getSortedOrders = () => {
    const active = orders.filter(o => !o.completed)
      .sort((a, b) => a.sortMinutes - b.sortMinutes);
    const completed = orders.filter(o => o.completed)
      .sort((a, b) => a.sortMinutes - b.sortMinutes);
    return [...active, ...completed];
  };

  const isReadyToServe = (dish) => {
    return dish.status === 'ready' && dish.remaining > 0;
  };

  return (
    <div id="page-admin" className="page active">
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div className="admin-header">
          <button className="btn-back" onClick={onBack}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Назад
          </button>
          <h1>Панель официанта</h1>
          <div style={{width:'100px'}}></div>
        </div>
        <div className="orders-grid">
          {getSortedOrders().map(order => (
            <div key={order.id} className={`order-card ${order.completed ? 'completed' : ''}`}>
              <div className="order-card-header">
                <span className="order-table-num">Стол №{order.tableId}</span>
                <span className="order-time">{order.timeSlot}</span>
              </div>
              <div className="order-dishes">
                {order.dishes.map((dish, di) => {
                  const isReady = isReadyToServe(dish);
                  const isServed = dish.remaining === 0;
                  
                  return (
                    <div key={di} className={`dish-row ${isServed ? 'served' : ''} ${isReady ? 'ready-to-serve' : ''}`}>
                      <span className="dish-name-qty">{dish.name} × {dish.total}</span>
                      <span className="dish-status-badge">
                        {isServed ? '✓ Подано' : 
                         isReady ? '✓✓ Готов к подаче' : 
                         dish.status === 'cooking' ? ' Готовится' : ' Ожидает'}
                      </span>
                      <button 
                        className={`btn-served ${isReady ? 'active' : ''}`} 
                        disabled={!isReady}
                        onClick={() => onServed(order.id, di)}
                      >
                        Подано
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;