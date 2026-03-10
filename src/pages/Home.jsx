import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDepartments, getDoctorsByDepartment } from '../api/api';

function Home() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
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

  const handleDepartmentChange = async (e) => {
    const departmentCode = e.target.value;
    setSelectedDepartmentCode(departmentCode);
    
    if (!departmentCode) {
      setDoctors([]);
      setSelectedDepartment(null);
      return;
    }

    const dept = departments.find(d => (d.code || d.department_code) === departmentCode);
    setSelectedDepartment(dept);

    try {
      setLoadingDoctors(true);
      setError('');
      const data = await getDoctorsByDepartment(departmentCode);
      setDoctors(data);
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
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

  const filteredDoctors = doctors.filter(doctor => {
    if (!searchQuery) return true;
    const name = (doctor.name || doctor.doctor_name || '').toLowerCase();
    const qualification = (doctor.qualification || '').toLowerCase();
    const code = (doctor.code || doctor.doctor_code || '').toString();
    return name.includes(searchQuery.toLowerCase()) || 
           qualification.includes(searchQuery.toLowerCase()) ||
           code.includes(searchQuery);
  });

  return (
    <div className="home-page-modern">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Our Medical Center</h1>
            <p className="hero-subtitle">Quality Healthcare Services with Expert Doctors</p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{departments.length}+</div>
                <div className="stat-label">Departments</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Specialist Doctors</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Emergency Care</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <h2 className="search-title">Find Your Doctor</h2>
          <p className="search-description">Select a department to view available doctors and book your appointment</p>
          
          <div className="search-form">
            <div className="form-control-group">
              <label htmlFor="department-select" className="control-label">
                <span className="label-icon">🏥</span>
                Select Department
              </label>
              <select
                id="department-select"
                className="department-dropdown"
                value={selectedDepartmentCode}
                onChange={handleDepartmentChange}
                disabled={loading}
              >
                <option value="">-- Choose a Department --</option>
                {departments.map((dept) => (
                  <option 
                    key={dept.code || dept.department_code} 
                    value={dept.code || dept.department_code}
                  >
                    {dept.name || dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDepartmentCode && (
              <div className="form-control-group">
                <label htmlFor="doctor-search" className="control-label">
                  <span className="label-icon">🔍</span>
                  Search Doctor
                </label>
                <input
                  id="doctor-search"
                  type="text"
                  className="doctor-search-input"
                  placeholder="Search by name, qualification, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Doctors List */}
      {selectedDepartmentCode && (
        <div className="doctors-section-modern">
          <div className="doctors-header">
            <h2 className="section-title">
              {selectedDepartment ? `${selectedDepartment.name || selectedDepartment.department_name} - Doctors` : 'Available Doctors'}
            </h2>
            {doctors.length > 0 && (
              <p className="doctors-count">{filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found</p>
            )}
          </div>

          {loadingDoctors ? (
            <div className="loading-doctors">
              <div className="spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="doctors-grid-modern">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.code || doctor.doctor_code}
                  className="doctor-card-modern"
                >
                  <div className="doctor-photo">
                    {doctor.profile_photo ? (
                      <img 
                        src={doctor.profile_photo} 
                        alt={doctor.name || doctor.doctor_name}
                        className="doctor-img"
                      />
                    ) : (
                      <div className="doctor-placeholder">
                        <span className="doctor-initial">
                          {(doctor.name || doctor.doctor_name || 'D').charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="doctor-info">
                    <h3 className="doctor-name">Dr. {doctor.name || doctor.doctor_name}</h3>
                    <p className="doctor-qualification">
                      {doctor.qualification || 'Medical Specialist'}
                    </p>
                    <p className="doctor-code-badge">
                      <span className="badge-icon">🆔</span> 
                      Code: {doctor.code || doctor.doctor_code}
                    </p>
                    
                    {doctor.bio && (
                      <p className="doctor-bio">{doctor.bio}</p>
                    )}

                    <button 
                      className="btn-book-appointment"
                      onClick={() => handleSelectDoctor(doctor)}
                    >
                      <span className="btn-icon">📅</span>
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-doctors-found">
              <div className="no-doctors-icon">👨‍⚕️</div>
              <h3>No Doctors Found</h3>
              <p>
                {searchQuery 
                  ? `No doctors match your search "${searchQuery}"`
                  : 'No doctors available in this department at the moment'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Call to Action */}
      {!selectedDepartmentCode && !loading && (
        <div className="cta-section">
          <div className="cta-content">
            <h2>Need Help Choosing?</h2>
            <p>Our support team is available 24/7 to help you find the right doctor</p>
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={() => navigate('/booking')}>
                Book Now
              </button>
              <a href="tel:+1234567890" className="btn-cta-secondary">
                📞 Call Us: +123 456 7890
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
