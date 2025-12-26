import { useAuth } from '../context/AuthContext';
import { Box, Typography, Paper, Button } from '@mui/material';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f7f8fa">
            <Paper elevation={2} sx={{ p: 4, minWidth: 350, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight={600} mb={2} align="center" color="primary.dark">
                    Dashboard
                </Typography>
                <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={500}>
                        Welcome, <strong>{user?.fullName}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Role: {user?.role}
                    </Typography>
                    {user?.tenant && (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                Tenant: {user.tenant.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Plan: {user.tenant.subscriptionPlan}
                            </Typography>
                        </>
                    )}
                </Box>
                <Button
                    href="/projects"
                    variant="outlined"
                    color="primary"
                    sx={{ mb: 2, width: '100%' }}
                >
                    Go to Projects
                </Button>
                <Button
                    onClick={logout}
                    variant="contained"
                    color="secondary"
                    fullWidth
                >
                    Logout
                </Button>
            </Paper>
        </Box>
    );
};

export default Dashboard;