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

  const saveAttendance = async (registration, status) => {
    try {
      const volunteerId = registration.volunteerId._id;

      let response;

      if (registration.attendanceStatus) {
        response = await axiosInstance.put(
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
      } else {
        response = await axiosInstance.post(
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
      }

      setRegistrations((currentRegistrations) =>
        currentRegistrations.map((currentRegistration) =>
          currentRegistration.volunteerId?._id === volunteerId
            ? {
                ...currentRegistration,
                attendanceStatus: response.data.status,
              }
            : currentRegistration
        )
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to save attendance.';

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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="border-b border-[var(--pearl-leaf)]">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">University</th>
                  <th className="text-left p-3">Attendance Status</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {registrations.map((registration) => (
                  <tr
                    key={registration._id}
                    className="border-b border-[var(--pearl-leaf)]"
                  >
                    <td className="p-3">
                      {registration.volunteerId?.name}
                    </td>

                    <td className="p-3">
                      {registration.volunteerId?.email}
                    </td>

                    <td className="p-3">
                      {registration.volunteerId?.university || '-'}
                    </td>

                    <td className="p-3">
                      {registration.attendanceStatus
                        ? registration.attendanceStatus === 'present'
                          ? 'Present'
                          : 'Absent'
                        : '-'}
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            saveAttendance(
                              registration,
                              'present'
                            )
                          }
                          disabled={
                            registration.attendanceStatus === 'present'
                          }
                          className="px-3 py-2 rounded border border-[var(--pearl-leaf)] disabled:opacity-50"
                        >
                          Present
                        </button>

                        <button
                          onClick={() =>
                            saveAttendance(
                              registration,
                              'absent'
                            )
                          }
                          disabled={
                            registration.attendanceStatus === 'absent'
                          }
                          className="px-3 py-2 rounded border border-[var(--pearl-leaf)] disabled:opacity-50"
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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