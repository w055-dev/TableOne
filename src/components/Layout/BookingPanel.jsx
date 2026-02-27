import React from 'react';

const BookingPanel = ({ children }) => {
  return (
    <div className="booking-panel">
      {children}
    </div>
  );
};

export default React.memo(BookingPanel);