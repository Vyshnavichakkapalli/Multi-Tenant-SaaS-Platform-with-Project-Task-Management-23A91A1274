import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tenantSubdomain, setTenantSubdomain] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const isSuperAdmin = email.trim().toLowerCase() === 'superadmin@system.com';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }
        if (!isSuperAdmin && !tenantSubdomain) {
            setError('Tenant subdomain is required');
            return;
        }
        try {
            await login(email, password, isSuperAdmin ? undefined : tenantSubdomain);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f7f8fa">
            <Paper elevation={2} sx={{ p: 3, minWidth: 320, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight={600} mb={2} align="center" color="primary.dark">
                    Login
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                        required
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                        required
                    />
                    <TextField
                        label={isSuperAdmin ? 'Not required for Super Admin' : 'Tenant Subdomain'}
                        value={tenantSubdomain}
                        onChange={(e) => setTenantSubdomain(e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                        disabled={isSuperAdmin}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2, fontWeight: 500, borderRadius: 1 }}
                    >
                        Login
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default Login;
