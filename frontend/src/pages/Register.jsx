import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'volunteer' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/auth/register', formData);
      alert('Registration successful. Please log in.');
      navigate('/login');
    } catch (error) {
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-[var(--soft-cream)] p-6 shadow-md rounded border border-[var(--pearl-leaf)]">
        <h1 className="text-2xl font-bold mb-4 text-center text-[var(--carbon-block)]">Register</h1>
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
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        />
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full mb-4 p-2 border border-[var(--pearl-leaf)] rounded bg-white text-[var(--onyx)]"
        >
          <option value="volunteer">Volunteer</option>
          <option value="coordinator">Coordinator</option>
        </select>
        <button type="submit" className="w-full bg-[var(--pearl-leaf)] text-[var(--onyx)] p-2 rounded hover:opacity-90">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
