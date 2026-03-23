import React from 'react';
import MenuSheet from '../components/MenuSheet';

const OrderPage = ({ bookingInfo, quantities, onQuantityChange, onPay, onBack, menuItems }) => {
  return (
    <div className="order-page">
      <MenuSheet 
        bookingInfo={bookingInfo}
        quantities={quantities}
        menuItems={menuItems}
        onQuantityChange={onQuantityChange}
        onPay={onPay}
        onBack={onBack}
      />
    </div>
  );
};

export default OrderPage;