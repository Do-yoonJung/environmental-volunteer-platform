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

  const recordAttendance = async (volunteerId, status) => {
    try {
      const response = await axiosInstance.post(
        `/api/attendance/${eventId}/${volunteerId}`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setRegistrations((currentRegistrations) =>
        currentRegistrations.map((registration) =>
          registration.volunteerId?._id === volunteerId
            ? {
                ...registration,
                attendanceStatus: response.data.status,
              }
            : registration
        )
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to record attendance.';

      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading attendance...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 min-h-screen bg-[var(--porcelain)]">
      <div className="bg-[var(--soft-cream)] p-6 rounded shadow-sm border border-[var(--pearl-leaf)]">

        <h1 className="text-2xl font-bold text-[var(--carbon-block)] mb-6">
          Attendance Management
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
                  Attendance Status:{' '}
                  {registration.attendanceStatus
                    ? registration.attendanceStatus === 'present'
                      ? 'Present'
                      : 'Absent'
                    : '-'}
                </p>

                {!registration.attendanceStatus && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        recordAttendance(
                          registration.volunteerId._id,
                          'present'
                        )
                      }
                      className="px-3 py-2 rounded border border-[var(--pearl-leaf)] hover:opacity-80"
                    >
                      Present
                    </button>

                    <button
                      onClick={() =>
                        recordAttendance(
                          registration.volunteerId._id,
                          'absent'
                        )
                      }
                      className="px-3 py-2 rounded border border-[var(--pearl-leaf)] hover:opacity-80"
                    >
                      Absent
                    </button>
                  </div>
                )}
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