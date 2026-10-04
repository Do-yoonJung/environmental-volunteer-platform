import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CoordinatorRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'coordinator') {
    return <Navigate to="/events" replace />;
  }

  return children;
};

export default CoordinatorRoute;