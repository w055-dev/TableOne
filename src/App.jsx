import React, { useState } from 'react';
import './styles/App.css';
import { menuItems } from './data/menuItems';
import { initialOrders } from './data/orders';
import { initialTables } from './data/tables';
import FloorPlan from './components/FloorPlan';
import BookingSidebar from './components/BookingSidebar';
import MenuPage from './components/MenuPage';
import AdminPanel from './components/AdminPanel';
import Modal from './components/Modal';

function App() {
  const [currentPage, setCurrentPage] = useState('tables');
  const [selectedTable, setSelectedTable] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [orders, setOrders] = useState(initialOrders);
  const [tables, setTables] = useState(initialTables);
  const [adminAuth, setAdminAuth] = useState({ password: '', error: '' });
  const [showModal, setShowModal] = useState(false);

  const handleTableClick = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table.status === 'booked') return;
    setSelectedTable(table);
  };

  const handleBook = (timeSlot) => {
    if (selectedTable.slots.includes(timeSlot)) {
      alert('Это время уже забронировано!');
      return;
  }
    setBookingInfo({ tableId: selectedTable.id, timeSlot });
    setCurrentPage('menu');
  };

  const handleQuantityChange = (itemIndex, delta) => {
    setQuantities(prev => {
      const newQty = (prev[itemIndex] || 0) + delta;
      if (newQty <= 0) {
        const { [itemIndex]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemIndex]: newQty };
    });
  };

  const handlePay = () => {
    setShowModal(true);
  };

  const handleConfirmOrder = () => {
    const newOrder = {
      id: `ord-${Date.now()}`,
      tableId: bookingInfo.tableId,
      timeSlot: bookingInfo.timeSlot,
      sortMinutes: parseInt(bookingInfo.timeSlot.split(':')[0]) * 60,
      dishes: Object.entries(quantities).map(([idx, qty]) => ({
        name: menuItems[parseInt(idx)].name,
        total: qty,
        remaining: qty
      })),
      completed: false
    };
    
    setTables(prevTables => prevTables.map(table => {
      if (table.id === bookingInfo.tableId) {
        const newSlots = [...table.slots, bookingInfo.timeSlot];
        let newStatus = 'partial';
        return {
          ...table,
          slots: newSlots,
          status: newStatus
        };
      }
      return table;
    }));

    setOrders(prev => [...prev, newOrder]);
    setShowModal(false);
    setQuantities({});
    setCurrentPage('tables');
    alert('Заказ подтверждён! Спасибо.');
  };

  const handleAdminLogin = (password) => {
    if (password === '1') {
      setAdminAuth({ password: '', error: '' });
      setCurrentPage('admin');
    } else {
      setAdminAuth(prev => ({ ...prev, error: 'Неверный пароль' }));
    }
  };

  const handleServed = (orderId, dishIdx) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const newDishes = [...order.dishes];
      if (newDishes[dishIdx].remaining > 0) {
        newDishes[dishIdx].remaining--;
      }
      
      const allServed = newDishes.every(d => d.remaining === 0);
      
      return {
        ...order,
        dishes: newDishes,
        completed: allServed
      };
    }));
  };

  return (
    <>
      {currentPage === 'tables' && (
        <div id="page-tables" className="page active">
          <div className="page-header">
            <h1>Выбор столика</h1>
            <p>Нажмите на стол, чтобы забронировать</p>
          </div>
          <div className="tables-layout">
            <FloorPlan 
              tables={tables}
              selectedTable={selectedTable}
              onTableClick={handleTableClick}
            />
            <BookingSidebar 
              selectedTable={selectedTable}
              onBook={handleBook}
              onAdminLogin={handleAdminLogin}
              adminError={adminAuth.error}
            />
          </div>
        </div>
      )}

      {currentPage === 'menu' && (
        <MenuPage 
          bookingInfo={bookingInfo}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
          onPay={handlePay}
          onBack={() => setCurrentPage('tables')}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPanel 
          orders={orders}
          onServed={handleServed}
          onBack={() => setCurrentPage('tables')}
        />
      )}

      <Modal 
        isOpen={showModal}
        bookingInfo={bookingInfo}
        quantities={quantities}
        onConfirm={handleConfirmOrder}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}

export default App;