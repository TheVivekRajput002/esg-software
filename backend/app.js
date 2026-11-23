const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const esgRoutes = require('./routes/esgRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const targetRoutes = require('./routes/targetRoutes');
const validationRoutes = require('./routes/validationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const reportingRoutes = require('./routes/reportingRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');
const reportingPeriodRoutes = require('./routes/reportingPeriodRoutes');

const app = express();

// Security and middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: '*', // Allows local development on various ports
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), version: '1.1' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/esg', esgRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/targets', targetRoutes);
app.use('/api/v1/validation', validationRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/reports', reportingRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/reporting-periods', reportingPeriodRoutes);

// Serve static frontend
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
