import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DepartmentList from '../components/DepartmentList';
import DoctorList from '../components/DoctorList';
import { getDepartments, getDoctorsByDepartment } from '../api/api';

function Home() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, []);

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

  const handleSelectDepartment = async (department) => {
    try {
      setLoading(true);
      setError('');
      setSelectedDepartment(department);
      const departmentCode = department.code || department.department_code;
      const data = await getDoctorsByDepartment(departmentCode);
      setDoctors(data);
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    navigate('/booking', {
      state: {
        department: selectedDepartment,
        doctor: doctor,
      },
    });
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setDoctors([]);
    setError('');
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Hospital Appointment Booking</h1>
        <p>Book your appointment with the best doctors</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!selectedDepartment ? (
        <DepartmentList
          departments={departments}
          onSelectDepartment={handleSelectDepartment}
          loading={loading}
        />
      ) : (
        <DoctorList
          doctors={doctors}
          onSelectDoctor={handleSelectDoctor}
          loading={loading}
          onBack={handleBackToDepartments}
        />
      )}
    </div>
  );
}

export default Home;
