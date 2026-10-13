import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EventFeedbackList = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/feedback/event/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          }
        );

        setEventTitle(response.data.event?.title || '');
        setFeedback(response.data.feedback || []);

      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to load event feedback.';

        alert(message);

        navigate('/events');

      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchFeedback();
    }
  }, [eventId, user, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <p className="text-[var(--onyx)]">
          Loading feedback...
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
              Event Feedback
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

        {feedback.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[var(--muted-text)]">
              No feedback available
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--pearl-leaf)]">
                  <th className="text-left p-3 text-[var(--carbon-block)]">
                    Volunteer
                  </th>

                  <th className="text-left p-3 text-[var(--carbon-block)]">
                    Email
                  </th>

                  <th className="text-left p-3 text-[var(--carbon-block)]">
                    Rating
                  </th>

                  <th className="text-left p-3 text-[var(--carbon-block)]">
                    Comment
                  </th>

                  <th className="text-left p-3 text-[var(--carbon-block)]">
                    Submitted
                  </th>
                </tr>
              </thead>

              <tbody>
                {feedback.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-[var(--pearl-leaf)]"
                  >
                    <td className="p-3 text-[var(--onyx)]">
                      {item.volunteerId?.name || 'Unknown'}
                    </td>

                    <td className="p-3 text-[var(--onyx)]">
                      {item.volunteerId?.email || '-'}
                    </td>

                    <td className="p-3 text-[var(--onyx)]">
                      {item.rating} / 5
                    </td>

                    <td className="p-3 text-[var(--onyx)]">
                      {item.comment || '-'}
                    </td>

                    <td className="p-3 text-[var(--muted-text)]">
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFeedbackList;