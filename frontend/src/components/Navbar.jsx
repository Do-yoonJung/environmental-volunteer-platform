import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[var(--carbon-block)] text-[var(--porcelain)] p-4 flex justify-between items-center shadow-sm">
      <Link to={user ? "/events" : "/login"} className="text-2xl font-bold tracking-tight">EVP Event Management</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/events" className="hover:text-[var(--beige)]">
              Events
            </Link>

            {user.role === 'coordinator' && (
              <Link to="/events/create" className="hover:text-[var(--beige)]">
                Create Event
              </Link>
            )}

            <Link to="/profile" className="hover:text-[var(--beige)]">
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="bg-[var(--beige)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-[var(--beige)]">
              Login
            </Link>

            <Link
              to="/register"
              className="bg-[var(--pearl-leaf)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
