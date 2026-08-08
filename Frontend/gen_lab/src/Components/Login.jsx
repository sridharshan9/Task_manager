import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { loginUser as apiLogin, registerUser as apiRegister } from '../api';

function Login() {
  const navigate = useNavigate();
  const { user, loginUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'manager',
    password: '',
    retypePassword: '',
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const Submit = async (e) => {
    e.preventDefault();

    if (!isLogin && form.password !== form.retypePassword) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await apiLogin({ email: form.email, password: form.password });
        loginUser(res.user);
        alert(res.message || 'Login successful');
        navigate('/dashboard');
      } else {
        const res = await apiRegister({
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          password: form.password,
        });
        alert(res.message || 'Registration successful. Please log in.');
        setIsLogin(true);
        setForm({ email: '', full_name: '', role: 'manager', password: '', retypePassword: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow login-glow-a" />
      <div className="login-glow login-glow-b" />
      <div className="glass-card animate-fade-in">
        <div className="login-brand">
          <div className="login-logo">GT</div>
          <h2 className="title-gradient">{isLogin ? 'Login to Genlab Task Manager' : 'Create a Genlab Account'}</h2>
          <p className="subtitle">
            {isLogin ? 'Sign in to access your task dashboard' : 'Register to start managing tasks'}
          </p>
        </div>

        <form onSubmit={Submit} className="glass-form">
          <input
            className="glass-input"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />

          {!isLogin && (
            <>
              <input
                className="glass-input"
                type="text"
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
              />
              <select
                className="glass-input"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
              >
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </>
          )}

          <input
            className="glass-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />

          {!isLogin && (
            <input
              className="glass-input"
              type="password"
              placeholder="Retype Password"
              value={form.retypePassword}
              onChange={(e) => update('retypePassword', e.target.value)}
              required
            />
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button
          className="btn-secondary"
          onClick={() => {
            setIsLogin((prev) => !prev);
            setForm({ email: '', full_name: '', role: 'manager', password: '', retypePassword: '' });
          }}
        >
          {isLogin ? 'New to Genlab? Sign up here' : 'Already have an account? Log in'}
        </button>

        {isLogin && (
          <p className="login-hint">
            Super admin: superadmin@genlab.com / supergen@123
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
