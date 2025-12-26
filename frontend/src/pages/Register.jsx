import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';

const Register = () => {
  const [form, setForm] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminFullName: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.post('/auth/register-tenant', {
        tenantName: form.tenantName,
        subdomain: form.subdomain,
        adminEmail: form.adminEmail,
        adminPassword: form.password,
        adminFullName: form.adminFullName,
      });

      setSuccess('Registration successful. Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f7f8fa">
      <Paper elevation={2} sx={{ p: 3, minWidth: 340, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={600} mb={2} align="center" color="primary.dark">
          Register Tenant
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            name="tenantName"
            label="Organization Name"
            value={form.tenantName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <TextField
            name="subdomain"
            label="Subdomain"
            value={form.subdomain}
            onChange={handleChange}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <TextField
            name="adminEmail"
            label="Admin Email"
            type="email"
            value={form.adminEmail}
            onChange={handleChange}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <TextField
            name="adminFullName"
            label="Admin Full Name"
            value={form.adminFullName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <TextField
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, fontWeight: 500, borderRadius: 1 }}
          >
            Register
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;