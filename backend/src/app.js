require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:6000',
  'http://frontend:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const tenantRoutes = require('./routes/tenant.routes');
app.use('/api/tenants', tenantRoutes);

const userRoutes = require('./routes/user.routes');
app.use('/api', userRoutes);

const projectRoutes = require('./routes/project.routes');
app.use('/api', projectRoutes);

const taskRoutes = require('./routes/task.routes');
app.use('/api', taskRoutes);

module.exports = app;