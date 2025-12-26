import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import api from '../services/api';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';

const ProjectDetails = () => {
  const { projectId } = useParams(); // ✅ make sure route is /projects/:projectId
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);

      setProject(projectRes.data.data);
      setTasks(tasksRes.data.data.tasks || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /* ---------------- LOADING / ERROR GUARDS ---------------- */

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!project) {
    return null; // safety fallback
  }

  /* ---------------- MAIN RENDER ---------------- */
  console.log('ArrowBackIcon type:', typeof ArrowBackIcon);

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#f7f8fa"
    >
      <Paper elevation={2} sx={{ p: 4, minWidth: 500, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            href={`/projects`}
            sx={{ mb: 2 }}
          >
            Back to Projects
          </Button>
          <Button
            variant="outlined"
            color="error"
            sx={{ mb: 2, ml: 2 }}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Project
          </Button>
        </Box>
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Project</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button
              onClick={async () => {
                setDeleting(true);
                try {
                  await api.delete(`/projects/${projectId}`);
                  setDeleteDialogOpen(false);
                  navigate('/projects');
                } catch (err) {
                  alert('Failed to delete project');
                } finally {
                  setDeleting(false);
                }
              }}
              color="error"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        <Typography variant="h5" fontWeight={600} mb={1} color="primary.dark">
          {project.name}
        </Typography>

        <Chip
          label={project.status}
          color={project.status === 'active' ? 'success' : 'warning'}
          size="small"
          sx={{ mb: 1 }}
        />

        {project.description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {project.description}
          </Typography>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" fontWeight={500}>
            Tasks
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowCreateTask(true)}
          >
            Add Task
          </Button>
        </Stack>

        {showCreateTask && (
          <CreateTaskModal
            projectId={projectId}
            onClose={() => setShowCreateTask(false)}
            onCreated={fetchData}
          />
        )}

        {tasks.length === 0 ? (
          <Typography color="text.secondary">No tasks found</Typography>
        ) : (
          <List>
            {tasks.map((task) => (
              <ListItem
                key={task.id}
                divider
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      aria-label="change-status"
                      onClick={async () => {
                        try {
                          const nextStatus =
                            task.status === 'todo'
                              ? 'in_progress'
                              : task.status === 'in_progress'
                              ? 'completed'
                              : 'todo';
                          await api.patch(`/tasks/${task.id}/status`, {
                            status: nextStatus,
                          });
                          fetchData();
                        } catch (err) {
                          alert('Failed to update task status');
                        }
                      }}
                    >
                      {/* <AutorenewIcon /> */}
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => setEditTask(task)}
                    >
                      {/* <EditIcon /> */}
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={<span style={{ fontWeight: 500 }}>{task.title}</span>}
                  secondary={<span style={{ color: '#888' }}>{task.status}</span>}
                />
              </ListItem>
            ))}
          </List>
        )}

        {editTask && (
          <EditTaskModal
            task={editTask}
            onClose={() => setEditTask(null)}
            onUpdated={fetchData}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ProjectDetails;
