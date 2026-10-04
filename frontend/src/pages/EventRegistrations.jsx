import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EventRegistrations = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/registrations/event/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setRegistrations(response.data);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to load registrations.';

        alert(message);
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [eventId, user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading registrations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 min-h-screen bg-[var(--porcelain)]">
      <div className="bg-[var(--soft-cream)] p-6 rounded shadow-sm border border-[var(--pearl-leaf)]">

        <h1 className="text-2xl font-bold text-[var(--carbon-block)] mb-6">
          Registered Volunteers
        </h1>

        {registrations.length === 0 ? (
          <p className="text-[var(--onyx)]">
            No volunteers are currently registered for this event.
          </p>
        ) : (
          <div>
            {registrations.map((registration) => (
              <div
                key={registration._id}
                className="bg-white p-4 mb-3 rounded border border-[var(--pearl-leaf)]"
              >
                <p className="font-bold text-[var(--carbon-block)]">
                  {registration.volunteerId?.name}
                </p>

                <p className="text-[var(--onyx)]">
                  {registration.volunteerId?.email}
                </p>

                {registration.volunteerId?.university && (
                  <p className="text-sm text-[var(--muted-text)]">
                    University: {registration.volunteerId.university}
                  </p>
                )}

                <p className="text-sm text-[var(--muted-text)] mt-2">
                  Status: {registration.status}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/events')}
          className="mt-6 bg-[var(--carbon-block)] text-[var(--porcelain)] px-4 py-2 rounded hover:opacity-90"
        >
          Back to Events
        </button>

      </div>
    </div>
  );
};

export default EventRegistrations;