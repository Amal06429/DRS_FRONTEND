import { useState } from 'react';

function BookingForm({ department, doctor, timing, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    phone_number: '',
    email: '',
    appointment_date: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert date to ISO datetime format with time
    const appointmentDateTime = new Date(formData.appointment_date + 'T10:00:00');
    
    const appointmentData = {
      patient_name: formData.patient_name,
      phone_number: formData.phone_number,
      email: formData.email,
      doctor_code: doctor.code || doctor.doctor_code,
      department_code: department.code || department.department_code,
      appointment_date: appointmentDateTime.toISOString(),
    };
    onSubmit(appointmentData);
  };

  return (
    <div className="booking-form-container">
      <h2>Book Appointment</h2>
      <div className="booking-info">
        <p>
          <strong>Department:</strong> {department.name || department.department_name}
        </p>
        <p>
          <strong>Doctor:</strong> {doctor.name || doctor.doctor_name}
        </p>
        <p>
          <strong>Qualification:</strong> {doctor.qualification || 'N/A'}
        </p>
        {timing && timing.available_days && (
          <p>
            <strong>Available Days:</strong> {timing.available_days}
          </p>
        )}
        {timing && timing.time_slot && (
          <p>
            <strong>Time Slot:</strong> {timing.time_slot}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="patient_name">Patient Name *</label>
          <input
            type="text"
            id="patient_name"
            name="patient_name"
            value={formData.patient_name}
            onChange={handleChange}
            required
            placeholder="Enter patient name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone_number">Phone Number *</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            placeholder="Enter phone number"
            pattern="[0-9]{10}"
            title="Please enter a 10-digit phone number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address (optional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="appointment_date">Appointment Date *</label>
          <input
            type="date"
            id="appointment_date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            Book Appointment
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
