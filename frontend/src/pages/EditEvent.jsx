import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EditEvent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axiosInstance.get('/api/events', {
          headers: {
            Authorization: `Bearer ${user.token}`
          },
        });

        const event = response.data.find(
          (event) => event._id === id
        );

        if (!event) {
          alert('Event not found.');
          navigate('/events');
          return;
        }

        setFormData({
          title: event.title,
          description: event.description || '',
          deadline: event.deadline
            ? event.deadline.substring(0, 10)
            : ''
        });

      } catch (error) {
        alert('Failed to load event.');
        navigate('/events');
      }
    };

    fetchEvent();
  }, [id, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.put(
        `/api/events/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          },
        }
      );

      navigate('/events');

    } catch (error) {
      alert('Failed to update event.');
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-[var(--porcelain)]">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--soft-cream)] p-6 shadow-md rounded border border-[var(--pearl-leaf)]"
      >
        <h1 className="text-2xl font-bold mb-4 text-[var(--carbon-block)]">
          Edit Event
        </h1>

        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />

        <input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />

        <input
          type="date"
          value={formData.deadline}
          onChange={(e) =>
            setFormData({ ...formData, deadline: e.target.value })
          }
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />

        <button
          type="submit"
          className="w-full bg-[var(--carbon-block)] text-[var(--porcelain)] p-2 rounded hover:bg-[var(--onyx)]"
        >
          Update Event
        </button>
      </form>
    </div>
  );
};

export default EditEvent;