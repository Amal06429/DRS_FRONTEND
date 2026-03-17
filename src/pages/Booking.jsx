import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BookingForm from '../components/BookingForm';
import DepartmentList from '../components/DepartmentList';
import DoctorList from '../components/DoctorList';
import { getDepartments, getDoctorsByDepartment, bookAppointment } from '../api/api';

function Booking() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // If department and doctor passed via state (from Home), preload them
  useEffect(() => {
    const state = location.state || {};
    if (state.department) setSelectedDepartment(state.department);
    if (state.doctor) setSelectedDoctor(state.doctor);
  }, [location.state]);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadDoctors(selectedDepartment.code || selectedDepartment.department_code);
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async (departmentCode) => {
    try {
      setLoading(true);
      setError('');
      const data = await getDoctorsByDepartment(departmentCode);
      setDoctors(data);
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDepartment = (department) => {
    setSelectedDepartment(department);
    setSelectedDoctor(null);
    setDoctors([]);
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setDoctors([]);
    setSelectedDoctor(null);
    setError('');
  };

  const handleSubmit = async (appointmentData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await bookAppointment(appointmentData);
      
      setSuccess('Appointment booked successfully! Waiting for admin approval.');
      
      // Wait 3 seconds before redirecting
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="booking-page">
      {loading && <div className="loading">Processing...</div>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!selectedDepartment ? (
        <DepartmentList
          departments={departments}
          onSelectDepartment={handleSelectDepartment}
          loading={loading}
        />
      ) : !selectedDoctor ? (
        <DoctorList
          doctors={doctors}
          onSelectDoctor={handleSelectDoctor}
          loading={loading}
          onBack={handleBackToDepartments}
        />
      ) : (
        <>{!success && (
          <BookingForm
            department={selectedDepartment}
            doctor={selectedDoctor}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}</>
      )}
    </div>
  );
}

export default Booking;
