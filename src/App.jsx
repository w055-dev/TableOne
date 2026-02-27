import React, { useState } from 'react';
import './styles/App.css';
import { menuItems } from './data/menuItems';
import { initialOrders } from './data/orders';
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
  const [adminAuth, setAdminAuth] = useState({ password: '', error: '' });
  const [showModal, setShowModal] = useState(false);

  // Данные столиков
  const tables = [
    { id: 1, status: 'free', slots: [] },
    { id: 2, status: 'partial', slots: ['с 10:00 до 11:00', 'с 11:00 до 14:00'] },
    { id: 3, status: 'free', slots: [] },
    { id: 4, status: 'booked', slots: ['с 09:00 до 23:00'] },
    { id: 5, status: 'free', slots: [] },
    { id: 6, status: 'free', slots: [] },
    { id: 7, status: 'partial', slots: ['с 18:00 до 20:00'] },
    { id: 8, status: 'free', slots: [] },
    { id: 9, status: 'booked', slots: ['с 12:00 до 22:00'] },
    { id: 10, status: 'free', slots: [] },
    { id: 11, status: 'free', slots: [] },
    { id: 12, status: 'partial', slots: ['с 19:00 до 21:00'] },
    { id: 13, status: 'free', slots: [] },
    { id: 14, status: 'free', slots: [] },
    { id: 15, status: 'booked', slots: ['с 10:00 до 14:00', 'с 15:00 до 18:00'] },
    { id: 16, status: 'free', slots: [] },
    { id: 17, status: 'free', slots: [] },
  ];

  const handleTableClick = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table.status === 'booked') return;
    setSelectedTable(table);
  };

  const handleBook = (timeSlot) => {
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