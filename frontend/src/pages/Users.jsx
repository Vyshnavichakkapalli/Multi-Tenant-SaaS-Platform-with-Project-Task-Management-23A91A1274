import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const meRes = await api.get('/auth/me');
      const me = meRes.data.data;

      setTenantId(me.tenant.id);
      setCurrentUserId(me.id);
      setRole(me.role);

      const res = await api.get(`/tenants/${me.tenant.id}/users`);
      setUsers(res.data.data.users || []);
    } catch (err) {
      setError('Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#f7f8fa"
    >
      <Paper
        elevation={2}
        sx={{ p: 4, minWidth: 700, borderRadius: 2 }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h5"
            fontWeight={600}
            color="primary.dark"
          >
            Users
          </Typography>
          {role === 'tenant_admin' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowAdd(true)}
            >
              Add User
            </Button>
          )}
        </Box>
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            my={4}
          >
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        {showAdd && (
          <AddUserModal
            tenantId={tenantId}
            onClose={() => setShowAdd(false)}
            onCreated={fetchUsers}
          />
        )}
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onUpdated={fetchUsers}
          />
        )}
        {!loading && !error && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      selected={user.id === currentUserId}
                    >
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                          onClick={() => setEditUser(user)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default Users;