import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDoctors, createDoctorLogin, uploadDoctorPhoto, getDoctorCredentials, getAdminAppointments, updateAppointmentStatus } from '../api/api';

function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [assignedCredentials, setAssignedCredentials] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const navigate = useNavigate();

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [credentialForm, setCredentialForm] = useState({
    email: '',
    password: '',
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedDoctorForPhoto, setSelectedDoctorForPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    loadDoctors();
    loadCredentials();
    loadAppointments();
  }, [navigate]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllDoctors();
      setDoctors(data);
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const data = await getDoctorCredentials();
      const formattedCredentials = data.map((cred, index) => ({
        id: cred.id || index + 1,
        doctor: `${cred.doctor_name} - DOC-${cred.doctor_code}`,
        doctorCode: cred.doctor_code,
        doctorName: cred.doctor_name,
        email: cred.email,
        department: cred.department,
      }));
      setAssignedCredentials(formattedCredentials);
    } catch (err) {
      console.error('Failed to load credentials:', err);
      // Don't show error to user as this is not critical on page load
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await getAdminAppointments();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await updateAppointmentStatus(appointmentId, newStatus);
      setSuccess('Appointment status updated successfully');
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Failed to update appointment status');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (e) => {
    const doctorCode = e.target.value;
    if (doctorCode) {
      const doctor = doctors.find(d => d.code === doctorCode);
      setSelectedDoctor(doctor);
      setCredentialForm({ email: '', password: '' });
      setError('');
      setSuccess('');
    } else {
      setSelectedDoctor(null);
    }
  };

  const handleCredentialChange = (e) => {
    setCredentialForm({
      ...credentialForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSetCredentials = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setError('Please select a doctor first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const doctorData = {
        doctor_code: selectedDoctor.code,
        email: credentialForm.email,
        password: credentialForm.password,
      };

      await createDoctorLogin(doctorData);
      
      // Reload credentials from backend
      await loadCredentials();

      setSuccess(`Login credentials created successfully for Dr. ${selectedDoctor.name}`);
      setSelectedDoctor(null);
      setCredentialForm({ email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Failed to create login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenPhotoModal = (doctor) => {
    setSelectedDoctorForPhoto(doctor);
    setShowPhotoModal(true);
    setPhotoFile(null);
    setPhotoPreview(doctor.profile_photo || null);
    setError('');
    setSuccess('');
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      setError('Please select a photo to upload');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const formData = new FormData();
      formData.append('profile_photo', photoFile);
      
      await uploadDoctorPhoto(selectedDoctorForPhoto.code, formData);
      setSuccess(`Profile photo uploaded successfully for ${selectedDoctorForPhoto.name}`);
      
      // Refresh doctors list to show updated photo
      await loadDoctors();
      
      setShowPhotoModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSelectedDoctorForPhoto(null);
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  if (loading && doctors.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard-modern">
      <div className="dashboard-header-modern">
        <div>
          <h1>Doctor Management</h1>
          <p className="subtitle">Manage credentials and profiles for medical staff</p>
        </div>
        <div className="active-badge">
          <span className="badge-icon">🔑</span>
          {assignedCredentials.length} Active Credentials
        </div>
      </div>

      {/* Tabs */}
      <div className="modern-tabs">
        <button
          className={`modern-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => { setActiveTab('appointments'); setError(''); setSuccess(''); }}
        >
          <span className="tab-icon">📅</span>
          Appointments
        </button>
        <button
          className={`modern-tab ${activeTab === 'credentials' ? 'active' : ''}`}
          onClick={() => { setActiveTab('credentials'); setError(''); setSuccess(''); }}
        >
          <span className="tab-icon">🔐</span>
          Login Credentials
        </button>
        <button
          className={`modern-tab ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => { setActiveTab('doctors'); setError(''); setSuccess(''); }}
        >
          <span className="tab-icon">👨‍⚕️</span>
          Doctors List
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="appointments-section">
          <div className="section-header">
            <span className="section-icon">📅</span>
            <div>
              <h2>Patient Appointments</h2>
              <p>View and manage all booking requests</p>
            </div>
            <button onClick={loadAppointments} className="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          <div className="registry-info">
            Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </div>

          {appointments.length > 0 ? (
            <div className="appointments-table-container">
              <table className="credentials-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>PATIENT NAME</th>
                    <th>CONTACT</th>
                    <th>DOCTOR</th>
                    <th>DEPARTMENT</th>
                    <th>DATE & TIME</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => (
                    <tr key={appointment.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="patient-cell">
                          <strong>{appointment.patient_name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          {appointment.phone_number && <div>📞 {appointment.phone_number}</div>}
                          {appointment.email && <div>✉️ {appointment.email}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="doctor-cell">
                          <div className="doctor-avatar-small">
                            {appointment.doctor_name ? appointment.doctor_name.charAt(0) : 'D'}
                          </div>
                          <span>{appointment.doctor_name || `DOC-${appointment.doctor_code}`}</span>
                        </div>
                      </td>
                      <td>{appointment.department_name || appointment.department_code}</td>
                      <td>
                        {new Date(appointment.appointment_date).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className={`status-badge status-${appointment.status}`}>
                          {appointment.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {appointment.status === 'pending' && (
                            <>
                              <button 
                                className="btn-action confirm"
                                onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                                disabled={loading}
                              >
                                ✓ Confirm
                              </button>
                              <button 
                                className="btn-action delete"
                                onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                disabled={loading}
                              >
                                ✗ Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button 
                              className="btn-action complete"
                              onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                              disabled={loading}
                            >
                              ✓ Complete
                            </button>
                          )}
                          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                            <span className="status-final">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No appointments found</h3>
              <p>No booking requests have been made yet</p>
            </div>
          )}
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <>
          {/* Assign Credentials Section */}
          <div className="credentials-assign-section">
        <div className="section-header">
          <span className="section-icon">ℹ️</span>
          <div>
            <h2>Assign Credentials</h2>
            <p>Select a doctor and set their login details</p>
          </div>
        </div>

        <div className="assign-form-container">
          <div className="doctor-selector">
            <label htmlFor="doctorSelect">Select Doctor</label>
            <select
              id="doctorSelect"
              onChange={handleDoctorSelect}
              value={selectedDoctor?.code || ''}
              className="doctor-dropdown"
            >
              <option value="">Choose a doctor...</option>
              {doctors
                .filter(doctor => !assignedCredentials.some(cred => cred.doctorCode === doctor.code))
                .map((doctor) => (
                  <option key={doctor.code} value={doctor.code}>
                    Dr. {doctor.name} - {doctor.qualification || 'Neurologist'}
                  </option>
                ))}
            </select>
          </div>

          {selectedDoctor && (
            <div className="selected-doctor-form">
              <div className="doctor-info-card">
                <div className="doctor-avatar">
                  {selectedDoctor.profile_photo ? (
                    <img src={selectedDoctor.profile_photo} alt={selectedDoctor.name} />
                  ) : (
                    <span>{selectedDoctor.name.charAt(0)}</span>
                  )}
                </div>
                <div className="doctor-details">
                  <h3>Dr. {selectedDoctor.name}</h3>
                  <p>{selectedDoctor.qualification || 'Neurologist'} · DOC-{selectedDoctor.code}</p>
                </div>
                <button onClick={handleSetCredentials} className="btn-set-credentials" disabled={!credentialForm.email || !credentialForm.password || loading}>
                  {loading ? 'Setting...' : '+ Set Credentials'}
                </button>
              </div>

              <form onSubmit={handleSetCredentials} className="credentials-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Login Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={credentialForm.email}
                      onChange={handleCredentialChange}
                      placeholder="doctor@hospital.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={credentialForm.password}
                      onChange={handleCredentialChange}
                      placeholder="Minimum 6 characters"
                      minLength="6"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Credentials Registry Section */}
      <div className="credentials-registry-section">
        <div className="section-header">
          <span className="section-icon">📋</span>
          <div>
            <h2>Credentials Registry</h2>
            <p>All assigned login records</p>
          </div>
        </div>

        <div className="registry-info">
          Showing {assignedCredentials.length} of {assignedCredentials.length} records
        </div>

        {assignedCredentials.length > 0 ? (
          <div className="credentials-table-container">
            <table className="credentials-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>DOCTOR</th>
                  <th>LOGIN EMAIL</th>
                  <th>PASSWORD</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assignedCredentials.map((credential) => (
                  <tr key={credential.id}>
                    <td>{credential.id}</td>
                    <td>
                      <div className="doctor-cell">
                        <div className="doctor-avatar-small">
                          {credential.doctorName.charAt(0)}
                        </div>
                        <span>{credential.doctor}</span>
                      </div>
                    </td>
                    <td>{credential.email}</td>
                    <td>
                      <span className="password-hidden">••••••••</span>
                    </td>
                    <td>
                      <button className="btn-action">Edit</button>
                      <button className="btn-action delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h3>No credentials assigned yet</h3>
            <p>Use the form above to add doctor login access</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Doctors List Tab */}
      {activeTab === 'doctors' && (
        <div className="doctors-list-section">
          <div className="section-header">
            <span className="section-icon">👨‍⚕️</span>
            <div>
              <h2>All Doctors</h2>
              <p>Manage doctor profiles and photos</p>
            </div>
            <button onClick={loadDoctors} className="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          {doctors && doctors.length > 0 ? (
            <div className="doctors-grid-modern">
              {doctors.map((doctor) => (
                <div key={doctor.code} className="doctor-card-modern">
                  <div className="doctor-card-photo-section">
                    {doctor.profile_photo ? (
                      <img 
                        src={doctor.profile_photo} 
                        alt={doctor.name}
                        className="doctor-card-image"
                      />
                    ) : (
                      <div className="doctor-card-placeholder">
                        <span>{doctor.name.charAt(0)}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => handleOpenPhotoModal(doctor)}
                      className="btn-upload-photo"
                    >
                      📷 Upload Photo
                    </button>
                  </div>
                  <div className="doctor-card-info">
                    <h3>Dr. {doctor.name}</h3>
                    <p className="doctor-qualification">{doctor.qualification || 'N/A'}</p>
                    <div className="doctor-meta">
                      <span className="meta-item">
                        <strong>Code:</strong> {doctor.code}
                      </span>
                      <span className="meta-item">
                        <strong>Dept:</strong> {doctor.department}
                      </span>
                      {doctor.rate && (
                        <span className="meta-item">
                          <strong>Rate:</strong> ₹{doctor.rate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👨‍⚕️</div>
              <h3>No doctors found</h3>
              <p>No doctors are currently available in the system</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && selectedDoctorForPhoto && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upload Profile Photo</h3>
            <p className="modal-subtitle">
              Doctor: {selectedDoctorForPhoto.name} ({selectedDoctorForPhoto.code})
            </p>
            
            <form onSubmit={handleUploadPhoto} className="photo-upload-form">
              <div className="photo-preview-container">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="photo-preview"
                  />
                ) : (
                  <div className="photo-preview-placeholder">
                    No photo selected
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="photo" className="file-input-label">
                  Choose Photo
                </label>
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="file-input"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={loading || !photoFile}>
                  {loading ? 'Uploading...' : 'Upload Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
