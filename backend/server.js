require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getSmtpConfig } = require('./utils/mailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Check SMTP configuration on startup
const smtpCfg = getSmtpConfig();

// Check SMTP connection on startup (async, don't block server start)
(async () => {
  const { verifySmtpConnection } = require('./utils/mailer');
  const smtpCheck = await verifySmtpConnection();
  if (!smtpCheck.ok && smtpCfg.enabled) {
    console.warn('\n⚠️  WARNING: SMTP connection test failed!');
    console.warn(`⚠️  ${smtpCheck.message}`);
    console.warn('⚠️  Email sending will fail. Check your SMTP configuration in backend/.env');
    console.warn('⚠️  If your App Password was removed, generate a new one at: https://myaccount.google.com/apppasswords\n');
  } else if (smtpCfg.enabled && smtpCheck.ok) {
    console.log('✅ SMTP connection verified successfully\n');
  }
})().catch(err => {
  console.warn('⚠️  Could not verify SMTP connection on startup:', err.message);
});
if (smtpCfg.hasPlaceholders) {
  console.warn('\n⚠️  WARNING: SMTP configuration contains placeholder values!');
  console.warn('⚠️  Email sending will fail until you configure actual SMTP credentials.');
  console.warn('⚠️  Update backend/.env with your SMTP settings:');
  console.warn('⚠️    SMTP_HOST=smtp.gmail.com (or your SMTP server)');
  console.warn('⚠️    SMTP_PORT=587');
  console.warn('⚠️    SMTP_USER=your_sender_email@gmail.com (ONE sender account for all users)');
  console.warn('⚠️    SMTP_PASS=your_app_password');
  console.warn('⚠️    SMTP_FROM="System Name <your_sender_email@gmail.com>"');
  console.warn('⚠️  Note: Recipient emails are automatically determined from user sessions.');
  console.warn('⚠️  Verification codes will still be logged to terminal for testing.\n');
} else if (!smtpCfg.enabled) {
  console.log('\nℹ️  SMTP not configured. Verification codes will be logged to terminal only.');
  console.log('ℹ️  To enable email sending, configure SMTP in backend/.env');
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

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const forgotPasswordRoutes = require('./routes/forgotPassword');
const profilePasswordRoutes = require('./routes/profilePassword');
const loginVerificationRoutes = require('./routes/loginVerification');
const healthRoutes = require('./routes/health');
const securityAlertRoutes = require('./routes/securityAlert');
const accountsRoutes = require('./routes/accounts');
const hardwareRoutes = require('./routes/hardware');
const collectorBinsRoutes = require('./routes/collectorBins');
const adminWasteRoutes = require('./routes/adminWaste');

// Use routes
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/profile', profilePasswordRoutes);
app.use('/api/login', loginVerificationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/security', securityAlertRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/collector-bins', collectorBinsRoutes);
app.use('/api/admin/waste-categories', adminWasteRoutes);

try { const { initHardware } = require('./utils/hardwareStore'); initHardware(); } catch (e) { }

// Start server
app.listen(PORT, () => {
  console.log(`Backend login server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Hardware: http://localhost:${PORT}/api/hardware/status`);
  console.log(`Collector bins: http://localhost:${PORT}/api/collector-bins`);
});

module.exports = app;
