const API_BASE_URL = 'http://localhost:8000/api';

// Fetch CSRF token from server
export const fetchCsrfToken = async () => {
  await fetch(`${API_BASE_URL}/csrf`, {
    credentials: 'include',
  });
};

// Helper function to get CSRF token from cookies
const getCsrfToken = () => {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    
    // Extract error message from various possible formats
    let errorMessage;
    
    // Check if error.error is an array (Django REST Framework validation errors)
    if (error.error && Array.isArray(error.error)) {
      errorMessage = error.error.join(', ');
    } 
    // Check if error.error is a string
    else if (error.error) {
      errorMessage = error.error;
    }
    // Check other common error formats
    else if (error.message) {
      errorMessage = error.message;
    }
    else if (error.detail) {
      errorMessage = error.detail;
    }
    // Fallback to JSON string
    else {
      errorMessage = JSON.stringify(error);
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
};

// Get all departments
export const getDepartments = async () => {
  const response = await fetch(`${API_BASE_URL}/departments`);
  const data = await handleResponse(response);
  return data.departments || [];
};

// Get doctors by department code
export const getDoctorsByDepartment = async (departmentCode) => {
  const response = await fetch(`${API_BASE_URL}/doctors/${departmentCode}`);
  const data = await handleResponse(response);
  return data.doctors || [];
};

// Get timing for a specific doctor
export const getDoctorTiming = async (doctorCode) => {
  const response = await fetch(`${API_BASE_URL}/timing/${doctorCode}`);
  const data = await handleResponse(response);
  return data.timings || [];
};

// Book an appointment
export const bookAppointment = async (appointmentData) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/book-appointment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(appointmentData),
  });
  return handleResponse(response);
};

// Admin login
export const adminLogin = async (credentials) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

// Get all appointments (Admin)
export const getAdminAppointments = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/appointments`, {
    credentials: 'include',
  });
  return handleResponse(response);
};

// Doctor login
export const doctorLogin = async (credentials) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/doctor/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

// Get appointments for a specific doctor
export const getDoctorAppointments = async (doctorCode) => {
  const response = await fetch(`${API_BASE_URL}/doctor/appointments/${doctorCode}`);
  return handleResponse(response);
};

// Get all doctors from HMS
export const getAllDoctors = async () => {
  const response = await fetch(`${API_BASE_URL}/doctors`);
  const data = await handleResponse(response);
  return data.doctors || [];
};

// Create doctor login credentials (Admin only)
export const createDoctorLogin = async (doctorData) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/admin/create-doctor-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(doctorData),
  });
  return handleResponse(response);
};

// Get doctor's own profile (for logged-in doctor)
export const getDoctorOwnProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    credentials: 'include',
  });
  return handleResponse(response);
};

// Update doctor's own profile bio (for logged-in doctor)
export const updateDoctorOwnProfile = async (bioData) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(bioData),
  });
  return handleResponse(response);
};

// Get all doctor credentials (Admin only)
export const getDoctorCredentials = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/doctor-credentials`, {
    credentials: 'include',
  });
  return handleResponse(response);
};

// Update appointment status (Admin only)
export const updateAppointmentStatus = async (appointmentId, status) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/admin/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
};

// Update doctor credentials (Admin only)
export const updateDoctorCredentials = async (doctorCode, credentialData) => {
  if (!getCsrfToken()) {
    await fetchCsrfToken();
  }
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/admin/doctor-credentials/${doctorCode}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(credentialData),
  });
  return handleResponse(response);
};

// Get dynamic slots for a doctor on a specific date
export const getDoctorSlots = async (doctorCode, date) => {
  const response = await fetch(`${API_BASE_URL}/slots/?doctor_code=${doctorCode}&date=${date}`);
  return handleResponse(response);
};
