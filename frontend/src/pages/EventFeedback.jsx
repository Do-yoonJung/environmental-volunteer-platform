import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EventFeedback = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [feedbackId, setFeedbackId] =
    useState(null);

  const [rating, setRating] =
    useState('');

  const [comment, setComment] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isEditing = Boolean(feedbackId);

  useEffect(() => {
    const loadExistingFeedback = async () => {
      try {
        const response =
          await axiosInstance.get(
            `/api/feedback/my/${eventId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${user.token}`
              }
            }
          );

        const feedback = response.data;

        setFeedbackId(feedback._id);

        setRating(
          String(feedback.rating)
        );

        setComment(
          feedback.comment || ''
        );

      } catch (error) {
        if (
          error.response?.status !== 404
        ) {
          const message =
            error.response?.data?.message ||
            'Failed to load feedback.';

          alert(message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      loadExistingFeedback();
    }
  }, [eventId, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      alert(
        'Please select a rating.'
      );

      return;
    }

    try {
      setIsSubmitting(true);

      let response;

      if (isEditing) {
        response =
          await axiosInstance.put(
            `/api/feedback/${feedbackId}`,
            {
              rating:
                Number(rating),
              comment
            },
            {
              headers: {
                Authorization:
                  `Bearer ${user.token}`
              }
            }
          );
      } else {
        response =
          await axiosInstance.post(
            `/api/feedback/${eventId}`,
            {
              rating:
                Number(rating),
              comment
            },
            {
              headers: {
                Authorization:
                  `Bearer ${user.token}`
              }
            }
          );
      }

      alert(
        response.data?.message ||
        (
          isEditing
            ? 'Feedback updated successfully.'
            : 'Feedback submitted successfully.'
        )
      );

      navigate('/events');

    } catch (error) {
      const message =
        error.response?.data?.message ||
        (
          isEditing
            ? 'Failed to update feedback.'
            : 'Failed to submit feedback.'
        );

      alert(message);

    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <p className="text-[var(--onyx)]">
          Loading feedback...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-8 bg-[var(--soft-cream)] p-6 rounded shadow-sm border border-[var(--pearl-leaf)]">
      <h1 className="text-2xl font-bold text-[var(--carbon-block)] mb-2">
        {isEditing
          ? 'Edit Event Feedback'
          : 'Event Feedback'}
      </h1>

      {isEditing && (
        <p className="text-sm text-[var(--muted-text)] mb-6">
          You have already submitted feedback for this event.
          You can update your rating or comment below.
        </p>
      )}

      {!isEditing && (
        <p className="text-sm text-[var(--muted-text)] mb-6">
          Share your experience with the event coordinator.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="rating"
            className="block mb-2 font-medium text-[var(--onyx)]"
          >
            Rating
          </label>

          <select
            id="rating"
            value={rating}
            onChange={(event) =>
              setRating(
                event.target.value
              )
            }
            className="w-full border border-[var(--pearl-leaf)] rounded px-3 py-2 bg-white text-[var(--onyx)]"
            required
          >
            <option value="">
              Select a rating
            </option>

            <option value="1">
              1 - Very Poor
            </option>

            <option value="2">
              2 - Poor
            </option>

            <option value="3">
              3 - Average
            </option>

            <option value="4">
              4 - Good
            </option>

            <option value="5">
              5 - Excellent
            </option>
          </select>
        </div>

        <div className="mb-5">
          <label
            htmlFor="comment"
            className="block mb-2 font-medium text-[var(--onyx)]"
          >
            Comment
          </label>

          <textarea
            id="comment"
            value={comment}
            onChange={(event) =>
              setComment(
                event.target.value
              )
            }
            rows="5"
            placeholder="Share your experience..."
            className="w-full border border-[var(--pearl-leaf)] rounded px-3 py-2 bg-white text-[var(--onyx)]"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--carbon-block)] text-[var(--porcelain)] px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting
              ? (
                isEditing
                  ? 'Updating...'
                  : 'Submitting...'
              )
              : (
                isEditing
                  ? 'Update Feedback'
                  : 'Submit Feedback'
              )}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/events')
            }
            className="bg-[var(--beige)] text-[var(--onyx)] px-4 py-2 rounded hover:opacity-90"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventFeedback;