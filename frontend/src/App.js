import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Navbar from './components/Navbar';
import CoordinatorRoute from './components/CoordinatorRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EventRegistrations from './pages/EventRegistrations';
import EventFeedback from './pages/EventFeedback';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/events/create"
          element={
            <CoordinatorRoute>
              <CreateEvent />
            </CoordinatorRoute>
          }
        />

        <Route
          path="/events/:id/edit"
          element={
            <CoordinatorRoute>
              <EditEvent />
            </CoordinatorRoute>
          }
        />

        <Route
          path="/events/:eventId/registrations"
          element={
            <CoordinatorRoute>
              <EventRegistrations />
            </CoordinatorRoute>
          }
        />

        <Route
          path="/events/:eventId/feedback"
          element={<EventFeedback />}
        />
      </Routes>
    </Router>
  );
}

export default App;