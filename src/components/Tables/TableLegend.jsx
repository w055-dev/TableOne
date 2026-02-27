import React from 'react';

const TableLegend = () => (
  <div className="map-legend">
    <div className="legend-item">
      <span className="dot available"></span> Свободно
    </div>
    <div className="legend-item">
      <span className="dot occupied"></span> Занято
    </div>
  </div>
);

export default TableLegend;