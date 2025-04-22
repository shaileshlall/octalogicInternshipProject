import React, { useState, useEffect } from "react";
import axios from "axios";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./rentalForm.css";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    wheels: null,
    type: "",
    model: "",
    dateRange: [{ startDate: null, endDate: null, key: "selection" }],
  });
  const [error, setError] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    axios
      .get("https://octalogic-test-frontend.vercel.app/api/v1/vehicleTypes")
      .then((res) => {
        setVehicleTypes(res.data.data); // Adjust based on actual response structure
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!formData.model) return;
    axios
      .get(
        `https://octalogic-test-frontend.vercel.app/api/v1/bookings/${formData.model}`
      )
      .then((res) => {
        const dates = res.data.bookings || [];
        setBookedDates(
          dates.map((d) => ({
            startDate: new Date(d.startDate),
            endDate: new Date(d.endDate),
          }))
        );
      })
      .catch(console.error);
  }, [formData.model]);

  function handleNext() {
    let valid = false;
    switch (step) {
      case 1:
        valid = formData.firstName.trim() && formData.lastName.trim();
        break;
      case 2:
        valid = formData.wheels !== null;
        break;
      case 3:
        valid = !!formData.type;
        break;
      case 4:
        valid = !!formData.model;
        break;
      case 5:
        valid =
          formData.dateRange[0].startDate && formData.dateRange[0].endDate;
        break;
      default:
        valid = false;
    }
    if (!valid) {
      setError("Please answer the question before proceeding.");
      return;
    }
    setError("");
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  }

  function handleSubmit() {
    const payload = {
      ...formData,
      startDate: formData.dateRange[0].startDate,
      endDate: formData.dateRange[0].endDate,
    };

    axios
      .post(
        `https://octalogic-test-frontend.vercel.app/api/v1/bookings/${formData.model}`,
        payload
      )
      .then(() => {
        alert("Booking successful!");
        // optionally reset form or navigate
      })
      .catch((err) => alert(err.response?.data?.message || err.message));
  }

  const filteredVehicleTypes = vehicleTypes.filter(
    (type) => type.wheels === formData.wheels
  );

  const selectedVehicleType = vehicleTypes.find(
    (type) => type.id === formData.type
  );
  const modelOptions = selectedVehicleType ? selectedVehicleType.vehicles : [];

  return (
    <div className="form-container">
      <form>
        {step === 1 && (
          <div>
            <label className="block mb-2 font-semibold">
              What is your name?
            </label>
            <div className="input-container flex gap-2">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="flex-1 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="flex-1 p-2 border rounded"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block mb-2 font-semibold">Number of wheels</label>
            <label className="block">
              <input
                type="radio"
                name="wheels"
                value={2}
                checked={formData.wheels === 2}
                onChange={() =>
                  setFormData({ ...formData, wheels: 2, type: "", model: "" })
                }
                className="mr-2"
              />
              2 Wheeler
            </label>
            <label className="block">
              <input
                type="radio"
                name="wheels"
                value={4}
                checked={formData.wheels === 4}
                onChange={() =>
                  setFormData({ ...formData, wheels: 4, type: "", model: "" })
                }
                className="mr-2"
              />
              4 Wheeler
            </label>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block mb-2 font-semibold">Type of vehicle</label>
            {filteredVehicleTypes.map((opt) => (
              <label key={opt.id} className="block">
                <input
                  type="radio"
                  name="type"
                  value={opt.id}
                  checked={formData.type === opt.id}
                  onChange={() =>
                    setFormData({ ...formData, type: opt.id, model: "" })
                  }
                  className="mr-2"
                />
                {opt.type}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="block mb-2 font-semibold">Specific Model</label>
            {modelOptions.map((opt) => (
              <label key={opt.id} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="model"
                  value={opt.id}
                  checked={formData.model === opt.id}
                  onChange={() => setFormData({ ...formData, model: opt.id })}
                  className="mr-2"
                />
                {opt.image && (
                  <img
                    src={opt.image}
                    alt={opt.name}
                    className="w-12 h-12 object-cover rounded mr-2"
                  />
                )}
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
              onChange={(item) =>
                setFormData({ ...formData, dateRange: [item.selection] })
              }
              moveRangeOnFirstSelection={false}
              ranges={formData.dateRange}
              minDate={new Date()}
              disabledDates={bookedDates.flatMap((d) => {
                const dates = [];
                let curr = new Date(d.startDate);
                while (curr <= d.endDate) {
                  dates.push(new Date(curr));
                  curr.setDate(curr.getDate() + 1);
                }
                return dates;
              })}
            />
          </div>
        )}

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <button
          type="button"
          onClick={handleNext}
          className="input-btn mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {step < 5 ? "Next" : "Submit"}
        </button>
      </form>
    </div>
  );
}


 
