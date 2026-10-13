import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EventList = ({
  events,
  setEvents,
  registrations,
  setRegistrations
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async (eventId) => {
    try {
      await axiosInstance.delete(
        `/api/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      setEvents(
        events.filter(
          (event) => event._id !== eventId
        )
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to delete event.';

      alert(message);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      const response =
        await axiosInstance.post(
          `/api/registrations/${eventId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          }
        );

      setRegistrations(
        (previousRegistrations) => [
          ...previousRegistrations.filter(
            (registration) =>
              registration.eventId !== eventId
          ),
          response.data
        ]
      );

      alert(
        'Successfully registered for the event.'
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to register for event.';

      alert(message);
    }
  };

  const handleCancelRegistration = async (
    eventId
  ) => {
    try {
      const response =
        await axiosInstance.put(
          `/api/registrations/${eventId}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          }
        );

      setRegistrations(
        (previousRegistrations) =>
          previousRegistrations.map(
            (registration) =>
              registration.eventId === eventId
                ? response.data.registration
                : registration
          )
      );

      alert(
        'Registration cancelled successfully.'
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to cancel registration.';

      alert(message);
    }
  };

  return (
    <div>
      {events.map((event) => {
        const isRegistered =
          registrations?.some(
            (registration) =>
              registration.eventId ===
                event._id &&
              registration.status ===
                'registered'
          );

        return (
          <div
            key={event._id}
            className="bg-[var(--soft-cream)] p-4 mb-4 rounded shadow-sm border border-[var(--pearl-leaf)]"
          >
            <h2 className="font-bold text-[var(--carbon-block)]">
              {event.title}
            </h2>

            <p className="text-[var(--onyx)]">
              {event.description}
            </p>

            <p className="text-sm text-[var(--muted-text)]">
              Deadline:{' '}
              {event.deadline
                ? new Date(
                    event.deadline
                  ).toLocaleDateString()
                : 'No deadline'}
            </p>

            {user?.role === 'coordinator' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    navigate(
                      `/events/${event._id}/registrations`
                    )
                  }
                  className="bg-[var(--pearl-leaf)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
                >
                  Manage Attendance
                </button>

                <button
                  onClick={() =>
                    navigate(
                      `/events/${event._id}/feedback-list`
                    )
                  }
                  className="bg-[var(--pearl-leaf)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
                >
                  View Feedback
                </button>

                <button
                  onClick={() =>
                    navigate(
                      `/events/${event._id}/analytics`
                    )
                  }
                  className="bg-[var(--pearl-leaf)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
                >
                  View Analytics
                </button>

                <button
                  onClick={() =>
                    navigate(
                      `/events/${event._id}/edit`
                    )
                  }
                  className="bg-[var(--beige)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(event._id)
                  }
                  className="bg-[var(--carbon-block)] text-[var(--porcelain)] px-4 py-2 rounded hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            )}

            {user?.role === 'volunteer' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {isRegistered ? (
                  <>
                    <button
                      onClick={() =>
                        handleCancelRegistration(
                          event._id
                        )
                      }
                      className="bg-[var(--beige)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
                    >
                      Cancel Registration
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/events/${event._id}/feedback`
                        )
                      }
                      className="bg-[var(--pearl-leaf)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
                    >
                      Leave Feedback
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      handleRegister(event._id)
                    }
                    className="bg-[var(--carbon-block)] text-[var(--porcelain)] px-4 py-2 rounded hover:opacity-90"
                  >
                    Register
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EventList;