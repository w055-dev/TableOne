import React, { useState, useCallback, useMemo } from 'react';
import { INITIAL_TABLES, INITIAL_MENU, INITIAL_BOOKING_FORM, PARTY_SIZES } from './constants';
import { useMenu } from './hooks/useMenu';
import { useTables } from './hooks/useTables';
import { useAuth } from './hooks/useAuth';
import RestaurantMap from './components/Layout/RestaurantMap';
import BookingPanel from './components/Layout/BookingPanel';
import PanelHeader from './components/Layout/PanelHeader';
import BookingForm from './components/Forms/BookingForm';
import MenuDisplay from './components/Menu/MenuDisplay';
import AdminPanel from './components/Admin/AdminPanel';
import AdminLoginModal from './components/Admin/AdminLoginModal';
import './App.css';

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [bookingForm, setBookingForm] = useState(INITIAL_BOOKING_FORM);

  const { tables, toggleTableAvailability, getTableById } = useTables(INITIAL_TABLES);
  const { 
    items: menuItems, 
    editingItem,
    setEditingItem,
    addItem: addMenuItem,
    updateItem: updateMenuItem,
    deleteItem: deleteMenuItem,
    itemsByCategory
  } = useMenu(INITIAL_MENU);

  const {
    isAdmin,
    showLogin,
    password,
    setPassword,
    login,
    logout,
    openLogin,
    closeLogin
  } = useAuth();

  const selectedTableData = useMemo(() => 
    selectedTable ? getTableById(selectedTable) : null
  , [selectedTable, getTableById]);

  const availablePartySizes = useMemo(() => {
    if (!selectedTableData) return PARTY_SIZES;
    return PARTY_SIZES.filter(size => size <= selectedTableData.seats);
  }, [selectedTableData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTableClick = useCallback((tableId) => {
    const table = getTableById(tableId);
    setSelectedTable(tableId);
    
    if (parseInt(bookingForm.partySize) > table.seats) {
      setBookingForm(prev => ({ ...prev, partySize: table.seats.toString() }));
    }
  }, [getTableById, bookingForm.partySize]);

  const handleBookingSubmit = useCallback((formData) => {
    if (!selectedTable) {
      alert('Сначала выберите столик на карте!');
      return;
    }

    const table = tables.find(t => t.id === selectedTable);
    if (!table?.available) {
      alert('Этот столик уже занят. Выберите другой.');
      setSelectedTable(null);
      return;
    }

    if (parseInt(formData.partySize) > table.seats) {
      alert(`Ошибка: столик №${selectedTable} вмещает только ${table.seats} человек.`);
      return;
    }

    toggleTableAvailability(selectedTable);
    alert(`Спасибо, ${formData.name}! Столик ${selectedTable} (${table.seats} мест) забронирован на ${formData.date} в ${formData.time} для ${formData.partySize} человек.`);
    setBookingForm(INITIAL_BOOKING_FORM);
    setSelectedTable(null);
  }, [selectedTable, tables, toggleTableAvailability]);

  const handleAdminLogin = useCallback(() => {
    if (login()) {
      setShowMenu(false);
    } else {
      alert('Неверный пароль');
    }
  }, [login]);

  const handleMenuToggle = useCallback(() => {
    setShowMenu(prev => !prev);
  }, []);

  return (
    <div className="app">
      <RestaurantMap 
        tables={tables} 
        onTableClick={handleTableClick} 
      />
      
      <BookingPanel>
        <PanelHeader 
          showMenu={showMenu}
          isAdmin={isAdmin}
          onMenuToggle={handleMenuToggle}
          onAdminClick={openLogin}
          onLogout={logout}
        />

        {showLogin && !isAdmin && (
          <AdminLoginModal
            password={password}
            setPassword={setPassword}
            onLogin={handleAdminLogin}
            onClose={closeLogin}
          />
        )}

        {showMenu && !isAdmin && (
          <MenuDisplay itemsByCategory={itemsByCategory} />
        )}

        {isAdmin && (
          <AdminPanel
            menuItems={menuItems}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            onAddMenuItem={addMenuItem}
            onUpdateMenuItem={updateMenuItem}
            onDeleteMenuItem={deleteMenuItem}
            tables={tables}
            onTableToggle={toggleTableAvailability}
          />
        )}

        {!showMenu && !isAdmin && !showLogin && (
          <>
            {selectedTableData && (
              <div style={{ 
                background: '#e8f5e9', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px',
                border: '2px solid #4caf50'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>✅ Столик №{selectedTableData.id}</strong>
                    <br />
                  </div>
                  <button
                    onClick={() => setSelectedTable(null)}
                    style={{
                      padding: '5px 10px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Отменить выбор
                  </button>
                </div>
              </div>
            )}
            <BookingForm 
              formData={bookingForm}
              onChange={handleInputChange}
              onSubmit={handleBookingSubmit}
              availablePartySizes={availablePartySizes}
              selectedTable={selectedTableData}
            />
          </>
        )}
      </BookingPanel>
    </div>
  );
}

export default App;