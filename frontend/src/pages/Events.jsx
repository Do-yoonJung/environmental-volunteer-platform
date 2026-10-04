import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import EventList from '../components/EventList';
import { useAuth } from '../context/AuthContext';

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get('/api/events', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setEvents(response.data);
      } catch (error) {
        alert('Failed to fetch events.');
      }
    };

    const fetchRegistrations = async () => {
      if (user.role !== 'volunteer') {
        return;
      }

      try {
        const response = await axiosInstance.get('/api/registrations/me', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setRegistrations(response.data);
      } catch (error) {
        alert('Failed to fetch registrations.');
      }
    };

    if (user) {
      fetchEvents();
      fetchRegistrations();
    }
  }, [user]);

  return (
    <div className="container mx-auto p-6 min-h-screen bg-[var(--porcelain)]">
      {events.length === 0 ? (
        <div className="bg-[var(--soft-cream)] p-8 rounded shadow-sm border border-[var(--pearl-leaf)] text-center">
          <h2 className="text-2xl font-bold text-[var(--carbon-block)] mb-3">
            No events yet
          </h2>

          {user?.role === 'coordinator' ? (
            <>
              <p className="text-[var(--onyx)] mb-6">
                You have not created any events yet.
              </p>

              <button
                onClick={() => navigate('/events/create')}
                className="bg-[var(--carbon-block)] text-[var(--porcelain)] px-5 py-2 rounded hover:opacity-90"
              >
                Create Your First Event
              </button>
            </>
          ) : (
            <p className="text-[var(--onyx)]">
              No events are currently available.
            </p>
          )}
        </div>
      ) : (
        <EventList
          events={events}
          setEvents={setEvents}
          registrations={registrations}
          setRegistrations={setRegistrations}
        />
      )}
    </div>
  );
};

export default Events;