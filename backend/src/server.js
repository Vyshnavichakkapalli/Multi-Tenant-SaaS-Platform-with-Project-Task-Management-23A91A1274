const app = require('./app');
const healthRoutes = require('./routes/health.routes');

app.use('/api', healthRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
