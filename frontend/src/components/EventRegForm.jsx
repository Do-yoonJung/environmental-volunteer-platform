import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const EventRegForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post('/api/events', formData, {
        headers: {
          Authorization: `Bearer ${user.token}`
        },
      });

      navigate('/events');
    } catch (error) {
      alert('Failed to create event.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--soft-cream)] p-6 shadow-md rounded mb-6 border border-[var(--pearl-leaf)]"
    >
      <h1 className="text-2xl font-bold mb-4 text-[var(--carbon-block)]">
        Add Event
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
        Add Event
      </button>
    </form>
  );
};

export default EventRegForm;