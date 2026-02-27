import React from 'react';
import { menuItems } from '../data/menuItems';

const MenuPage = ({ 
  bookingInfo, 
  quantities, 
  onQuantityChange, 
  onPay, 
  onBack 
}) => {
  const calculateTotal = () => {
    return Object.entries(quantities).reduce((sum, [idx, qty]) => 
      sum + menuItems[parseInt(idx)].price * qty, 0
    );
  };

  return (
    <div id="page-menu" className="page active">
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div className="menu-header">
          <button className="btn-back" onClick={onBack}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Назад
          </button>
          <h1>Меню</h1>
          <div style={{width:'100px'}}></div>
        </div>

        {bookingInfo && (
          <div className="booking-info">
            <div>Столик: <span>№{bookingInfo.tableId}</span></div>
            <div>Время: <span>{bookingInfo.timeSlot}</span></div>
          </div>
        )}

        <div className="menu-columns">
          {[0, 1].map(col => (
            <div key={col} className="menu-col">
              {menuItems.slice(col * 10, (col + 1) * 10).map((item, idx) => {
                const globalIdx = col * 10 + idx;
                const qty = quantities[globalIdx] || 0;
                return (
                  <div key={globalIdx} className="menu-item">
                    <span className="menu-item-name">{item.name}</span>
                    <div className="menu-item-right">
                      <span className="menu-price">{item.price} ₽</span>
                      {qty === 0 ? (
                        <button className="qty-btn" onClick={() => onQuantityChange(globalIdx, 1)}>+</button>
                      ) : (
                        <>
                          <button className="qty-btn" onClick={() => onQuantityChange(globalIdx, -1)}>−</button>
                          <span className="qty-num">{qty}</span>
                          <button className="qty-btn" onClick={() => onQuantityChange(globalIdx, 1)}>+</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {calculateTotal() > 0 && (
          <button className="btn-pay" onClick={onPay}>
            Оплатить ({calculateTotal()} ₽)
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuPage;