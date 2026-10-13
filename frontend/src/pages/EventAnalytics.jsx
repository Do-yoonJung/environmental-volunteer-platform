import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EventAnalytics = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/analytics/event/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          }
        );

        setEventTitle(response.data.event?.title || '');
        setAttendance(response.data.attendance || null);
        setFeedback(response.data.feedback || null);

      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to load event analytics.';

        alert(message);
        navigate('/events');

      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchAnalytics();
    }
  }, [eventId, user, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <p className="text-[var(--onyx)]">
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-[var(--soft-cream)] p-6 rounded shadow-sm border border-[var(--pearl-leaf)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--carbon-block)]">
              Event Summary Analytics
            </h1>

            {eventTitle && (
              <p className="text-[var(--muted-text)] mt-1">
                {eventTitle}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/events')}
            className="bg-[var(--beige)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
          >
            Back to Events
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-[var(--carbon-block)] mb-4">
            Attendance and Participation
          </h2>

          {attendance?.registered > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded border border-[var(--pearl-leaf)]">
                <p className="text-sm text-[var(--muted-text)]">
                  Registered
                </p>

                <p className="text-2xl font-bold text-[var(--carbon-block)]">
                  {attendance.registered}
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-[var(--pearl-leaf)]">
                <p className="text-sm text-[var(--muted-text)]">
                  Present
                </p>

                <p className="text-2xl font-bold text-[var(--carbon-block)]">
                  {attendance.present}
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-[var(--pearl-leaf)]">
                <p className="text-sm text-[var(--muted-text)]">
                  Absent
                </p>

                <p className="text-2xl font-bold text-[var(--carbon-block)]">
                  {attendance.absent}
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-[var(--pearl-leaf)]">
                <p className="text-sm text-[var(--muted-text)]">
                  Attendance Rate
                </p>

                <p className="text-2xl font-bold text-[var(--carbon-block)]">
                  {attendance.attendanceRate !== null
                    ? `${attendance.attendanceRate}%`
                    : '-'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[var(--muted-text)]">
              No attendance data available
            </p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--carbon-block)] mb-4">
            Feedback Summary
          </h2>

          {feedback?.hasFeedbackData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[var(--pearl-leaf)]">
                <p className="text-sm text-[var(--muted-text)]">
                  Feedback Submissions
                </p>

                <p className="text-2xl font-bold text-[var(--carbon-block)]">
                  {feedback.feedbackCount}
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-[var(--pearl-leaf)]">
                <p className="text-sm text-[var(--muted-text)]">
                  Average Rating
                </p>

                <p className="text-2xl font-bold text-[var(--carbon-block)]">
                  {feedback.averageRating !== null
                    ? `${feedback.averageRating} / 5`
                    : '-'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[var(--muted-text)]">
              No feedback data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics;