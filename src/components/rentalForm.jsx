import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    wheels: '',
    type: '',
    model: '',
    dateRange: [
      { startDate: null, endDate: null, key: 'selection' }
    ]
  });
  const [error, setError] = useState('');

  const [wheelsOptions, setWheelsOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    // Fetch wheels options
    fetch('/api/wheels')
      .then(res => res.json())
      .then(data => setWheelsOptions(data))
      .catch(console.error);

    // Fetch vehicle types
    fetch('/api/vehicle-types')
      .then(res => res.json())
      .then(data => setTypeOptions(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Fetch models when type changes
    if (!formData.type) return;
    fetch(`/api/models?type=${formData.type}`)
      .then(res => res.json())
      .then(data => setModelOptions(data))
      .catch(console.error);
  }, [formData.type]);

  useEffect(() => {
    // Fetch booked dates when model changes
    if (!formData.model) return;
    fetch(`/api/booked-dates?model=${formData.model}`)
      .then(res => res.json())
      .then(dates => setBookedDates(dates.map(d => new Date(d))))
      .catch(console.error);
  }, [formData.model]);

  function handleNext() {
    // Validation: ensure current step answer exists
    let valid = false;
    switch (step) {
      case 1:
        valid = formData.firstName.trim() && formData.lastName.trim();
        break;
      case 2:
        valid = !!formData.wheels;
        break;
      case 3:
        valid = !!formData.type;
        break;
      case 4:
        valid = !!formData.model;
        break;
      case 5:
        valid = formData.dateRange[0].startDate && formData.dateRange[0].endDate;
        break;
      default:
        valid = false;
    }
    if (!valid) {
      setError('Please answer the question before proceeding.');
      return;
    }
    setError('');
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  }

  function handleSubmit() {
    // Send data to backend
    const payload = {
      ...formData,
      startDate: formData.dateRange[0].startDate,
      endDate: formData.dateRange[0].endDate,
    };
    fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error('Booking failed');
        return res.json();
      })
      .then(data => {
        alert('Booking successful!');
        // Reset or navigate
      })
      .catch(err => alert(err.message));
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <form>
        {step === 1 && (
          <div>
            <label className="block mb-2 font-semibold">What is your name?</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="flex-1 p-2 border rounded"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block mb-2 font-semibold">Number of wheels</label>
            {wheelsOptions.map(opt => (
              <label key={opt} className="block">
                <input
                  type="radio"
                  name="wheels"
                  value={opt}
                  checked={formData.wheels === opt}
                  onChange={() => setFormData({ ...formData, wheels: opt })}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block mb-2 font-semibold">Type of vehicle</label>
            {typeOptions.map(opt => (
              <label key={opt} className="block">
                <input
                  type="radio"
                  name="type"
                  value={opt}
                  checked={formData.type === opt}
                  onChange={() => setFormData({ ...formData, type: opt, model: '' })}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="block mb-2 font-semibold">Specific Model</label>
            {modelOptions.map(opt => (
              <label key={opt.id} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="model"
                  value={opt.id}
                  checked={formData.model === opt.id}
                  onChange={() => setFormData({ ...formData, model: opt.id })}
                  className="mr-2"
                />
                <img src={opt.image} alt={opt.name} className="w-12 h-12 object-cover rounded mr-2" />
                {opt.name}
              </label>
            ))}
          </div>
        )}

        {step === 5 && (
          <div>
            <label className="block mb-2 font-semibold">Select Date Range</label>
            <DateRange
              editableDateInputs={true}
              onChange={item => setFormData({ ...formData, dateRange: [item.selection] })}
              moveRangeOnFirstSelection={false}
              ranges={formData.dateRange}
              minDate={new Date()}
              disabledDates={bookedDates}
            />
          </div>
        )}

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <button
          type="button"
          onClick={handleNext}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {step < 5 ? 'Next' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
