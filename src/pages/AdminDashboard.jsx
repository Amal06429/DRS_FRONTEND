import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDoctors, createDoctorLogin, getDoctorCredentials, getAdminAppointments, updateAppointmentStatus, updateDoctorCredentials } from '../api/api';

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    loadInitialData();
  }, [navigate]);

  const loadInitialData = async () => {
    await loadDoctors();
    await loadCredentials();
    await loadAppointments();
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllDoctors();
      setDoctors(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const data = await getDoctorCredentials();
      const formattedCredentials = data.map((cred, index) => {
        return {
          id: cred.id || index + 1,
          doctor: `${cred.doctor_name} - DOC-${cred.doctor_code}`,
          doctorCode: cred.doctor_code,
          doctorName: cred.doctor_name,
          email: cred.email,
          department: cred.department,
        };
      });
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

  const handleOpenEditModal = (credential) => {
    setEditingCredential(credential);
    setEditForm({
      email: credential.email,
      password: '',
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleEditFormChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!editingCredential) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updateData = {};
      if (editForm.email !== editingCredential.email) {
        updateData.email = editForm.email;
      }
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      if (Object.keys(updateData).length === 0) {
        setError('No changes detected');
        setLoading(false);
        return;
      }

      await updateDoctorCredentials(editingCredential.doctorCode, updateData);
      setSuccess(`Credentials updated successfully for ${editingCredential.doctorName}`);

      // Reload credentials
      await loadCredentials();

      setShowEditModal(false);
      setEditingCredential(null);
      setEditForm({ email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Failed to update credentials');
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
                                onClick={() => handleStatusUpdate(appointment.id, 'accepted')}
                                disabled={loading}
                              >
                                ✓ Accept
                              </button>
                              <button 
                                className="btn-action delete"
                                onClick={() => handleStatusUpdate(appointment.id, 'rejected')}
                                disabled={loading}
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {(appointment.status === 'accepted' || appointment.status === 'rejected') && (
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
                  {selectedDoctor.photo_url ? (
                    <img src={selectedDoctor.photo_url} alt={selectedDoctor.name} />
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
                          <span>{credential.doctorName.charAt(0)}</span>
                        </div>
                        <span>{credential.doctor}</span>
                      </div>
                    </td>
                    <td>{credential.email}</td>
                    <td>
                      <span className="password-hidden">••••••••</span>
                    </td>
                    <td>
                      <button 
                        className="btn-action"
                        onClick={() => handleOpenEditModal(credential)}
                      >
                        ✏️ Edit
                      </button>
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

      {/* Edit Credentials Modal */}
      {showEditModal && editingCredential && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Credentials</h3>
            <p className="modal-subtitle">
              Doctor: {editingCredential.doctorName} ({editingCredential.doctorCode})
            </p>
            
            <form onSubmit={handleUpdateCredentials} className="edit-credentials-form">
              <div className="form-group">
                <label htmlFor="edit-email">Email *</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  placeholder="doctor@hospital.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-password">New Password</label>
                <input
                  type="password"
                  id="edit-password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditFormChange}
                  placeholder="Leave blank to keep current password"
                  minLength="6"
                />
                <small className="form-hint">Leave blank if you don't want to change the password</small>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
