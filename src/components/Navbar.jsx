import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const doctorCode = sessionStorage.getItem('doctorCode');
  const isAdmin = sessionStorage.getItem('isAdmin');

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* <Link to="/" className="navbar-brand">
          Hospital Appointment System
        </Link> */}
        <div className="navbar-links">
          {/* <Link to="/">Home</Link>
          <Link to="/booking">Book Appointment</Link> */}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard">Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
          {doctorCode && (
            <>
              <Link to="/doctor/dashboard">Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
