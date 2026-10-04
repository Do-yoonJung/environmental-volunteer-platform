import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/auth/login', formData);
      login(response.data);
      navigate('/events');
    } catch (error) {
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-[var(--soft-cream)] p-6 shadow-md rounded border border-[var(--pearl-leaf)]">
        <h1 className="text-2xl font-bold mb-4 text-center text-[var(--carbon-block)]">Login</h1>
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
        <button type="submit" className="w-full bg-[var(--carbon-block)] text-[var(--porcelain)] p-2 rounded hover:bg-[var(--onyx)]">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
