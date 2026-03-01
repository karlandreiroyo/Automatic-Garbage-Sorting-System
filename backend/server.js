require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getSmtpConfig } = require('./utils/mailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Dynamic CORS: allow FRONTEND_URL and/or CORS_ORIGIN (comma-separated) for Railway/deploy; always allow localhost in dev
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL || '';
const corsOriginList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
if (frontendUrl) corsOriginList.push(frontendUrl);
// Allow Railway app URL by default so API works at https://automatic-garbage-sorting-system-production.up.railway.app
const railwayOrigin = 'https://automatic-garbage-sorting-system-production.up.railway.app';
if (!corsOriginList.includes(railwayOrigin)) corsOriginList.push(railwayOrigin);
const localOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://127.0.0.1:5173', 
  'http://127.0.0.1:3000',
  'http://192.168.0.108:5173',
  'http://192.168.0.108:3000'
];
const allowedOrigins = isProduction ? corsOriginList : [...new Set([...corsOriginList, ...localOrigins])];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // When Supabase not configured, allow all so frontend gets JSON error instead of CORS/HTML
    if (!process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY === 'your_service_role_key_here') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
const smtpCfg = getSmtpConfig();

// Check SMTP connection on startup (async, don't block server start)
(async () => {
  const { verifySmtpConnection } = require('./utils/mailer');
  const smtpCheck = await verifySmtpConnection();
  if (!smtpCheck.ok && smtpCfg.enabled) {
    console.warn('\n⚠️  WARNING: SMTP connection test failed!');
    console.warn(`⚠️  ${smtpCheck.message}`);
    console.warn('⚠️  Email sending may still work when sending. Check SMTP in Railway Variables or backend/.env');
    const host = (smtpCfg.host || '').toLowerCase();
    if (host.includes('brevo.com')) {
      console.warn('⚠️  Brevo: use SMTP_USER = Brevo login email, SMTP_PASS = API key from Brevo → SMTP & API → API Keys\n');
    } else {
      console.warn('⚠️  Gmail: use an App Password from https://myaccount.google.com/apppasswords\n');
    }
  } else if (smtpCfg.enabled && smtpCheck.ok) {
    console.log('✅ SMTP connection verified successfully\n');
  }
})().catch(err => {
  console.warn('⚠️  Could not verify SMTP connection on startup:', err.message);
});
if (smtpCfg.hasPlaceholders) {
  console.warn('\n⚠️  WARNING: SMTP configuration contains placeholder values!');
  console.warn('⚠️  Email sending will fail until you set real credentials in Railway Variables (or backend/.env).');
  console.warn('⚠️  For Railway/Brave use Brevo: SMTP_HOST=smtp-relay.brevo.com, SMTP_PORT=587, SMTP_USER=your Brevo email, SMTP_PASS=your Brevo API key (xkeysib-...), SMTP_FROM="App Name <verified@email.com>"');
  console.warn('⚠️  Recipient emails are determined from user sessions. Verification codes are also logged to terminal.\n');
} else if (!smtpCfg.enabled) {
  console.log('\nℹ️  SMTP not configured. Verification codes will be logged to terminal only.');
  console.log('ℹ️  To enable email sending (e.g. when using Brave for email verification), configure SMTP in backend/.env');
  console.log('ℹ️  One sender account will send emails to all users dynamically.\n');
} else if (smtpCfg.enabled) {
  // Validate configuration
  if (!smtpCfg.userEmailValid) {
    console.warn('\n⚠️  WARNING: SMTP_USER is not a valid email address!');
    console.warn(`⚠️  Current value: ${smtpCfg.user}`);
    console.warn('⚠️  Email sending will fail. Please fix SMTP_USER in backend/.env\n');
  }
  if (smtpCfg.validationErrors && smtpCfg.validationErrors.length > 0) {
    console.warn('\n⚠️  WARNING: SMTP configuration issues detected:');
    smtpCfg.validationErrors.forEach(err => console.warn(`⚠️    - ${err}`));
    console.warn('');
  }
}

// Import routes
const forgotPasswordRoutes = require('./routes/shared/forgotPassword');
const profilePasswordRoutes = require('./routes/shared/profilePassword');
const loginVerificationRoutes = require('./routes/shared/loginVerification');
const healthRoutes = require('./routes/shared/health');
const securityAlertRoutes = require('./routes/shared/securityAlert');
const accountsRoutes = require('./routes/superadmin/accounts');
const hardwareRoutes = require('./routes/hardware');
const collectorBinsRoutes = require('./routes/collectorBins');

// Test only
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend is running 🚀'
  });
});

// Use routes
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/profile', profilePasswordRoutes);
app.use('/api/login', loginVerificationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/security', securityAlertRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/collector-bins', collectorBinsRoutes);

// 404 for unknown API routes — return JSON so frontend never gets HTML
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Always return JSON for API errors (avoids HTML error pages that break frontend)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.setHeader('Content-Type', 'application/json');
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

// Arduino serial: only init when ARDUINO_PORT is set and not in production (no COM ports on Railway/cloud)
try {
  if (process.env.ARDUINO_PORT && process.env.NODE_ENV !== 'production') {
    const { initHardware } = require('./utils/hardwareStore');
    initHardware();
  }
} catch (e) {
  // ignore if serialport not installed
}

// Start server
const backendBase = process.env.BACKEND_URL || process.env.API_URL || 'https://brave-adaptation-production.up.railway.app';
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API base: ${backendBase}`);
  console.log(`Health: ${backendBase}/api/health`);
  console.log(`Hardware: ${backendBase}/api/hardware/status`);
  console.log(`Collector bins: ${backendBase}/api/collector-bins`);
});

module.exports = app;
