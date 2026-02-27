import React from 'react';
import Table from '../Tables/Table';
import TableLegend from '../Tables/TableLegend';

const RestaurantMap = ({ tables, onTableClick }) => (
  <div className="restaurant-map">
    <div className="map-header">
      <h2>La Belle Table</h2>
      <p>Выберите свободный столик</p>
    </div>
    
    <div className="floor-plan">
      <div className="room-outline"></div>
      
      <div className="windows">
        <div className="window"></div>
        <div className="window"></div>
        <div className="window"></div>
      </div>
      
      {tables.map(table => (
        <Table
          key={table.id}
          table={table}
          onClick={onTableClick}
        />
      ))}
      
      <div className="bar-counter"></div>
      <div className="entrance">Вход</div>
    </div>
    
    <TableLegend />
  </div>
);

export default React.memo(RestaurantMap);