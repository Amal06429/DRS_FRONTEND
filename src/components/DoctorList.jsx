import { formatTimeSlot, isSlotAvailable } from '../utils/timeUtils';

function DoctorList({ doctors, onSelectDoctor, loading, onBack }) {
  if (loading) {
    return <div className="loading">Loading doctors...</div>;
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="no-data">
        <p>No doctors available for this department</p>
        <button onClick={onBack} className="btn-secondary">
          Back to Departments
        </button>
      </div>
    );
  }

  return (
    <div className="doctor-list">
      <div className="list-header">
        <h2>Select a Doctor</h2>
        <button onClick={onBack} className="btn-secondary">
          Back to Departments
        </button>
      </div>
      <div className="doctor-grid">
        {doctors.map((doctor) => {
          const availableSlots = doctor.timings?.filter(isSlotAvailable) || [];
          
          return (
            <div
              key={doctor.code || doctor.doctor_code}
              className="doctor-card"
              onClick={() => onSelectDoctor(doctor)}
            >
              <div className="doctor-card-photo">
                {doctor.profile_photo ? (
                  <img 
                    src={doctor.profile_photo} 
                    alt={doctor.name || doctor.doctor_name}
                    className="doctor-card-img"
                  />
                ) : (
                  <div className="doctor-card-placeholder">
                    <span>{(doctor.name || doctor.doctor_name || '?').charAt(0)}</span>
                  </div>
                )}
              </div>
              <h3>{doctor.name || doctor.doctor_name}</h3>
              <p className="qualification">
                {doctor.qualification || 'Qualification not specified'}
              </p>
              <p className="doctor-code">Code: {doctor.code || doctor.doctor_code}</p>
              
              {/* Display available time slots */}
              {doctor.timings && doctor.timings.length > 0 && (
                <div className="doctor-timings">
                  <strong>Available Slots:</strong>
                  {availableSlots.length > 0 ? (
                    <ul className="timing-list">
                      {availableSlots.map((timing) => (
                        <li key={timing.slno}>
                          Slot {timing.slno}: {formatTimeSlot(timing.t1, timing.t2)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="manual-booking">Standard time selection</p>
                  )}
                </div>
              )}
              
              {(!doctor.timings || doctor.timings.length === 0) && (
                <div className="doctor-timings">
                  <p className="manual-booking">Standard time selection</p>
                </div>
              )}
              
              <button className="btn-primary">Select Doctor</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DoctorList;
