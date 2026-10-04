import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Profile = () => {
  const { user } = useAuth(); // Access user token from context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch profile data from the backend
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFormData({
          name: response.data.name,
          email: response.data.email,
          university: response.data.university || '',
          address: response.data.address || '',
        });
      } catch (error) {
        alert('Failed to fetch profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put('/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-[var(--soft-cream)] p-6 shadow-md rounded border border-[var(--pearl-leaf)]">
        <h1 className="text-2xl font-bold mb-4 text-center text-[var(--carbon-block)]">Your Profile</h1>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />
        <input
          type="text"
          placeholder="University"
          value={formData.university}
          onChange={(e) => setFormData({ ...formData, university: e.target.value })}
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />
        <button type="submit" className="w-full bg-[var(--carbon-block)] text-[var(--porcelain)] p-2 rounded hover:bg-[var(--onyx)]">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
