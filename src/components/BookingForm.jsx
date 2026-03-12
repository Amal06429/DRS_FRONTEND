import { useState, useEffect } from 'react';
import { formatTimeSlot, isSlotAvailable } from '../utils/timeUtils';
import { getDoctorAppointments } from '../api/api';

function BookingForm({ department, doctor, timing, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    phone_number: '',
    email: '',
    appointment_date: '',
    selected_slot: '',
    appointment_time: '',
  });
  
  const [appointmentsOnDate, setAppointmentsOnDate] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Fetch appointments when date or doctor changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (formData.appointment_date && doctor && (doctor.code || doctor.doctor_code)) {
        setLoadingAppointments(true);
        try {
          const doctorCode = doctor.code || doctor.doctor_code;
          const appointments = await getDoctorAppointments(doctorCode);
          
          // Filter appointments for the selected date (exclude rejected)
          const selectedDate = formData.appointment_date;
          const filteredAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
            return aptDate === selectedDate && apt.status !== 'rejected';
          });
          
          setAppointmentsOnDate(filteredAppointments);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setAppointmentsOnDate([]);
        } finally {
          setLoadingAppointments(false);
        }
      } else {
        setAppointmentsOnDate([]);
      }
    };
    
    fetchAppointments();
  }, [formData.appointment_date, doctor]);
  
  // Get available slots from doctor.timings (preferred) or timing prop (fallback)
  const availableSlots = (doctor.timings || timing || []).filter(isSlotAvailable);
  const hasSlots = availableSlots.length > 0;
  
  // Compute booked slots and times from appointments on selected date
  const bookedSlotNumbers = new Set(
    appointmentsOnDate
      .filter(apt => apt.slot_number)
      .map(apt => apt.slot_number.toString())
  );
  
  const bookedTimes = new Set(
    appointmentsOnDate
      .filter(apt => !apt.slot_number && apt.appointment_date)
      .map(apt => {
        const date = new Date(apt.appointment_date);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      })
  );
  
  // Create slot status map for display
  const slotStatusMap = {};
  availableSlots.forEach(slot => {
    const slotNum = slot.slno.toString();
    const appointment = appointmentsOnDate.find(apt => apt.slot_number?.toString() === slotNum);
    slotStatusMap[slotNum] = appointment ? {
      status: 'booked',
      patientName: appointment.patient_name
    } : {
      status: 'vacant'
    };
  });
  
  // Standard appointment times for doctors without slots
  const standardTimes = [
    { value: '09:00', label: '09:00 AM' },
    { value: '09:30', label: '09:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '14:30', label: '02:30 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '15:30', label: '03:30 PM' },
    { value: '16:00', label: '04:00 PM' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  // Get selected timing details
  const selectedTiming = availableSlots.find(
    slot => slot.slno.toString() === formData.selected_slot
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert date to ISO datetime format with time from selected slot or standard time
    let appointmentDateTime;
    if (selectedTiming && selectedTiming.t1) {
      // Use slot time
      const hours = Math.floor(selectedTiming.t1);
      const minutes = Math.round((selectedTiming.t1 - hours) * 60);
      appointmentDateTime = new Date(
        formData.appointment_date + `T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
      );
    } else if (formData.appointment_time) {
      // Use standard time selection
      appointmentDateTime = new Date(
        formData.appointment_date + `T${formData.appointment_time}:00`
      );
    } else {
      // Default to 10:00 AM
      appointmentDateTime = new Date(formData.appointment_date + 'T10:00:00');
    }
    
    const appointmentData = {
      patient_name: formData.patient_name,
      phone_number: formData.phone_number,
      email: formData.email,
      doctor_code: doctor.code || doctor.doctor_code,
      department_code: department.code || department.department_code,
      appointment_date: appointmentDateTime.toISOString(),
      slot_number: formData.selected_slot || null,
    };
    onSubmit(appointmentData);
  };

  return (
    <div className="booking-form-container">
      <h2>Book Appointment</h2>
      <div className="booking-info">
        {/* Doctor Photo */}
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

        {/* For doctors WITH slots - Split into Slot Number and Time fields */}
        {hasSlots && (
          <>
            <div className="form-group">
              <label htmlFor="selected_slot">Slot Number *</label>
              <select
                id="selected_slot"
                name="selected_slot"
                value={formData.selected_slot}
                onChange={handleChange}
                required
                disabled={loadingAppointments}
              >
                <option value="">-- Choose a slot --</option>
                {availableSlots.map((slot) => {
                  const slotNum = slot.slno.toString();
                  const isBooked = bookedSlotNumbers.has(slotNum);
                  const slotStatus = slotStatusMap[slotNum];
                  return (
                    <option 
                      key={slot.slno} 
                      value={slot.slno}
                      disabled={isBooked}
                    >
                      Slot {slot.slno} {isBooked ? `(Booked - ${slotStatus?.patientName})` : '(Available)'}
                    </option>
                  );
                })}
              </select>
              {loadingAppointments && (
                <small className="form-hint">Loading availability...</small>
              )}
            </div>
            
            {/* Slot Status Display */}
            {formData.appointment_date && availableSlots.length > 0 && (
              <div className="slot-status-display">
                <h4>Slot Availability Status</h4>
                <div className="slot-status-list">
                  {availableSlots.map((slot) => {
                    const slotNum = slot.slno.toString();
                    const slotStatus = slotStatusMap[slotNum];
                    const timeRange = formatTimeSlot(slot.t1, slot.t2);
                    
                    return (
                      <div 
                        key={slot.slno} 
                        className={`slot-status-item ${slotStatus?.status === 'booked' ? 'booked' : 'vacant'}`}
                      >
                        <span className="slot-number">Slot {slot.slno}</span>
                        <span className="slot-time">{timeRange}</span>
                        <span className="slot-status">
                          {slotStatus?.status === 'booked' ? (
                            <span className="status-booked">Booked ({slotStatus.patientName})</span>
                          ) : (
                            <span className="status-vacant">Vacant</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {selectedTiming && (
              <div className="form-group">
                <label htmlFor="slot_time">Appointment Time</label>
                <input
                  type="text"
                  id="slot_time"
                  value={formatTimeSlot(selectedTiming.t1, selectedTiming.t2)}
                  disabled
                  className="disabled-input"
                />
                <small className="form-hint">
                  Time is automatically set based on selected slot
                </small>
              </div>
            )}
          </>
        )}

        {/* For doctors WITHOUT slots - Standard time selection dropdown */}
        {!hasSlots && (
          <div className="form-group">
            <label htmlFor="appointment_time">Appointment Time *</label>
            <select
              id="appointment_time"
              name="appointment_time"
              value={formData.appointment_time}
              onChange={handleChange}
              required
              disabled={loadingAppointments}
            >
              <option value="">-- Choose a time --</option>
              {standardTimes.map((time) => {
                const isBooked = bookedTimes.has(time.value);
                const bookedAppointment = appointmentsOnDate.find(apt => {
                  if (!apt.appointment_date) return false;
                  const date = new Date(apt.appointment_date);
                  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  return timeStr === time.value;
                });
                return (
                  <option 
                    key={time.value} 
                    value={time.value}
                    disabled={isBooked}
                  >
                    {time.label} {isBooked ? `(Booked - ${bookedAppointment?.patient_name})` : '(Available)'}
                  </option>
                );
              })}
            </select>
            {loadingAppointments ? (
              <small className="form-hint">Loading availability...</small>
            ) : (
              <small className="form-hint">
                Select a preferred appointment time
              </small>
            )}
          </div>
        )}

        <div className="form-buttons">
          <button 
            type="submit" 
            className="btn-primary"
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
