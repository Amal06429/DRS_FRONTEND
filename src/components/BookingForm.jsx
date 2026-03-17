import { useState, useEffect } from 'react';
import { getDoctorSlots } from '../api/api';

function BookingForm({ department, doctor, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    phone_number: '',
    email: '',
    appointment_date: '',
    selected_slot: null,
  });
  
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dynamic slots when date changes or after booking
  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.appointment_date && doctor) {
        setLoadingSlots(true);
        try {
          const doctorCode = doctor.code || doctor.doctor_code;
          const slotsData = await getDoctorSlots(doctorCode, formData.appointment_date);
          setSlots(slotsData);
          console.log('Slots loaded:', slotsData); // Debug log
        } catch (error) {
          console.error('Error fetching slots:', error);
          setSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setSlots([]);
      }
    };
    
    fetchSlots();
  }, [formData.appointment_date, doctor, refreshKey]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSlotSelect = (slot) => {
    if (slot.status === 'Vacant') {
      setFormData({
        ...formData,
        selected_slot: slot,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.selected_slot) {
      alert('Please select a time slot');
      return;
    }

    // Combine date and time
    const appointmentDateTime = new Date(
      `${formData.appointment_date}T${formData.selected_slot.start_time}:00`
    );
    
    const appointmentData = {
      patient_name: formData.patient_name,
      phone_number: formData.phone_number,
      email: formData.email,
      doctor_code: doctor.code || doctor.doctor_code,
      department_code: department.code || department.department_code,
      appointment_date: appointmentDateTime.toISOString(),
      slot_number: formData.selected_slot.slot_number,
    };
    
    // Call parent submit handler
    await onSubmit(appointmentData);
    
    // Refresh slots to show the newly booked slot as "Booked"
    setRefreshKey(prev => prev + 1);
    
    // Clear selected slot
    setFormData({
      ...formData,
      selected_slot: null,
    });
  };

  // Group slots by slot_number
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_number]) {
      acc[slot.slot_number] = [];
    }
    acc[slot.slot_number].push(slot);
    return acc;
  }, {});

  return (
    <div className="booking-form-container">
      <h2>Book Appointment</h2>
      <div className="booking-info">
        <div className="doctor-booking-header">
          <div className="doctor-photo-wrapper">
            {doctor.photo_url ? (
              <img 
                src={doctor.photo_url} 
                alt={doctor.name || doctor.doctor_name}
                className="doctor-photo-booking"
              />
            ) : (
              <div className="doctor-photo-placeholder-booking">
                <span>{(doctor.name || doctor.doctor_name || '?').charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="doctor-details-booking">
            <p>
              <strong>Department:</strong> {department.name || department.department_name}
            </p>
            <p>
              <strong>Doctor:</strong> {doctor.name || doctor.doctor_name}
            </p>
            <p>
              <strong>Qualification:</strong> {doctor.qualification || 'N/A'}
            </p>
          </div>
        </div>
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

        {/* Dynamic Slot Selection */}
        {formData.appointment_date && (
          <div className="form-group">
            <label>Select Time Slot *</label>
            {loadingSlots ? (
              <p className="loading-text">Loading available slots...</p>
            ) : slots.length === 0 ? (
              <p className="no-slots-text">No slots available for this date</p>
            ) : (
              <div className="slots-container">
                {Object.entries(groupedSlots).map(([slotNumber, slotGroup]) => (
                  <div key={slotNumber} className="slot-group">
                    <h4>Session {slotNumber}</h4>
                    <div className="slot-grid">
                      {slotGroup.map((slot, index) => {
                        const isBooked = slot.status === 'Booked';
                        const isSelected = formData.selected_slot?.start_time === slot.start_time &&
                                          formData.selected_slot?.slot_number === slot.slot_number;
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            className={`slot-button ${
                              isBooked ? 'booked' : 'vacant'
                            } ${
                              isSelected ? 'selected' : ''
                            }`}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={isBooked}
                          >
                            <div className="slot-time">
                              {slot.start_time} - {slot.end_time}
                            </div>
                            <div className="slot-status-badge">
                              {slot.status}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {formData.selected_slot && (
          <div className="selected-slot-info">
            <p>
              <strong>Selected:</strong> Session {formData.selected_slot.slot_number} - {formData.selected_slot.start_time} to {formData.selected_slot.end_time}
            </p>
          </div>
        )}

        <div className="form-buttons">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={!formData.selected_slot}
          >
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
