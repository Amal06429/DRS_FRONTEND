import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorAppointments, getDoctorOwnProfile, updateDoctorOwnProfile } from '../api/api';

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const doctorCode = sessionStorage.getItem('doctorCode');
    if (!doctorCode) {
      navigate('/doctor/login');
      return;
    }
    loadProfile();
    loadAppointments();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const data = await getDoctorOwnProfile();
      setProfile(data.doctor);
      setPhotoPreview(data.doctor.profile_photo);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const doctorCode = sessionStorage.getItem('doctorCode');
      const data = await getDoctorAppointments(doctorCode);
      setAppointments(data);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
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
      
      await updateDoctorOwnProfile(formData);
      setSuccess('Profile photo updated successfully');
      
      // Reload profile
      await loadProfile();
      
      setShowPhotoUpload(false);
      setPhotoFile(null);
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return <div className="loading">Loading profile...</div>;
  }

  const doctorCode = sessionStorage.getItem('doctorCode');

  return (
    <div className="dashboard-page">
      <h1>Doctor Dashboard</h1>
      
      {/* Doctor Profile Section */}
      {profile && (
        <div className="doctor-profile-section">
          <div className="profile-card">
            <div className="profile-photo-container">
              {profile.profile_photo ? (
                <img 
                  src={profile.profile_photo} 
                  alt={profile.name}
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-placeholder">No Photo</div>
              )}
              <button 
                onClick={() => setShowPhotoUpload(!showPhotoUpload)} 
                className="btn-small btn-secondary"
              >
                {showPhotoUpload ? 'Cancel' : 'Update Photo'}
              </button>
            </div>
            <div className="profile-info">
              <h2>{profile.name}</h2>
              <p><strong>Doctor Code:</strong> {profile.code}</p>
              <p><strong>Department:</strong> {profile.department}</p>
              <p><strong>Qualification:</strong> {profile.qualification || 'N/A'}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>
          </div>

          {showPhotoUpload && (
            <div className="photo-upload-section">
              <form onSubmit={handleUploadPhoto} className="photo-upload-form">
                <div className="photo-preview-container-small">
                  {photoPreview && photoFile ? (
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="photo-preview-small"
                    />
                  ) : (
                    <p>Select a new photo</p>
                  )}
                </div>

                <div className="form-group">
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="file-input"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading || !photoFile}>
                  {loading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="dashboard-header">
        <h2>My Appointments</h2>
        <button onClick={loadAppointments} className="btn-secondary">
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {appointments && appointments.length > 0 ? (
        <div className="table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Department</th>
                <th>Appointment Date</th>
                <th>Status</th>
                <th>Booked On</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment, index) => (
                <tr key={appointment.id || index}>
                  <td>{appointment.id || index + 1}</td>
                  <td>{appointment.patient_name}</td>
                  <td>{appointment.phone_number || 'N/A'}</td>
                  <td>{appointment.email || 'N/A'}</td>
                  <td>{appointment.department_name || appointment.department_code}</td>
                  <td>{new Date(appointment.appointment_date).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>{new Date(appointment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">No appointments found</div>
      )}
    </div>
  );
}

export default DoctorDashboard;
