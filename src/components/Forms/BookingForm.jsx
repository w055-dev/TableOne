import React from 'react';
import { PARTY_SIZES } from '../../constants';
import FormInput from './FormInput';

const BookingForm = ({ formData, onChange, onSubmit, availablePartySizes = PARTY_SIZES, selectedTable }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <FormInput
        label="Имя"
        name="name"
        value={formData.name}
        onChange={onChange}
        required
      />

      <FormInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        required
      />

      <FormInput
        label="Телефон"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={onChange}
        required
      />

      <div className="form-row">
        <FormInput
          label="Дата"
          name="date"
          type="date"
          value={formData.date}
          onChange={onChange}
          required
        />

        <FormInput
          label="Время"
          name="time"
          type="time"
          value={formData.time}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Количество гостей</label>
        <select
          name="partySize"
          value={formData.partySize}
          onChange={onChange}
        >
          {availablePartySizes.map(num => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'гость' : 'гостей'}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="submit-btn">
        Забронировать столик
      </button>
    </form>
  );
};

export default React.memo(BookingForm);