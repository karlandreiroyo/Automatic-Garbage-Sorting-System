const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getSmtpConfig } = require('./utils/mailer');

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const bridgeClients = new Set();
app.locals.bridgeClients = bridgeClients;
app.locals.sendBridgeCommand = (command) => {
  const payload = JSON.stringify({ target: 'arduino', data: command });
  let sent = false;
  for (const client of bridgeClients) {
    if (client.readyState === 1) {
      client.send(payload);
      sent = true;
    }
  }
  return sent;
};

// Dynamic CORS: allow FRONTEND_URL and/or CORS_ORIGIN (comma-separated) for Railway/deploy; always allow localhost in dev
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL || '';
const corsOriginList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
if (frontendUrl) corsOriginList.push(frontendUrl);

// Allow Railway app URL by default so API works at https://brave-adaptation-production.up.railway.app
const railwayOrigin = 'https://brave-adaptation-production.up.railway.app';
if (!corsOriginList.includes(railwayOrigin)) corsOriginList.push(railwayOrigin);
const railwayOrigin2 = 'https://brave-adaptation-production.up.railway.app';
if (!corsOriginList.includes(railwayOrigin2)) corsOriginList.push(railwayOrigin2);

// Railway frontend origins (with and without .production. in host)
const frontendOrigins = [
  'https://automatic-garbage-sorting-system-production.up.railway.app',
  'https://automatic-garbage-sorting-system.production.up.railway.app',
];
frontendOrigins.forEach((origin) => {
  if (!corsOriginList.includes(origin)) corsOriginList.push(origin);
});

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
app.use(cookieParser());
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
      console.warn('⚠️  Brevo: use SMTP_USER = Brevo login email, SMTP_PASS = API key from Brevo → SMTP & API → API Keys\n');
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
const rememberMeRoutes = require('./routes/shared/rememberMe');
const healthRoutes = require('./routes/shared/health');
const securityAlertRoutes = require('./routes/shared/securityAlert');
const accountsRoutes = require('./routes/superadmin/accounts');
const adminRoutes = require('./routes/admin');
const hardwareRoutes = require('./routes/hardware');
const collectorBinsRoutes = require('./routes/collector/collectorBins');
// Device/sensor API (Raspberry Pi, Python) – disabled; backend only serves frontend + Arduino serial
// const deviceRoutes = require('./routes/collector/device');

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
app.use('/api/remember-me', rememberMeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/security', securityAlertRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/collector-bins', collectorBinsRoutes);
// app.use('/api/device', deviceRoutes);  // Raspberry Pi / Python – disabled

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

// Arduino: only open serial when ARDUINO_LOCAL=true (localhost with Arduino attached).
// On Railway: do NOT set ARDUINO_LOCAL or ARDUINO_PORT — use the Arduino bridge on your PC instead.
try {
  const wantArduino = process.env.ARDUINO_PORT && process.env.ARDUINO_LOCAL === 'true';
  if (wantArduino) {
    const { initHardware } = require('./utils/hardwareStore');
    initHardware();
  }
} catch (e) {
  // ignore if serialport not installed
}

// Start server
const backendBase = process.env.BACKEND_URL || process.env.API_URL || 'https://brave-adaptation-production.up.railway.app';
const bridgeWss = new WebSocketServer({ server, path: '/bridge' });
bridgeWss.on('connection', (ws) => {
  bridgeClients.add(ws);
  console.log(`Bridge connected via WebSocket. Active bridges: ${bridgeClients.size}`);
  ws.on('message', (raw) => {
    try {
      const payload = JSON.parse(String(raw));
      if (payload?.source === 'arduino') {
        console.log(`[bridge] Arduino data: ${payload.data}`);
      }
    } catch (err) {
      console.warn('[bridge] Invalid message:', err.message);
    }
  });
  ws.on('close', () => {
    bridgeClients.delete(ws);
    console.log(`Bridge disconnected. Active bridges: ${bridgeClients.size}`);
  });
  ws.on('error', (err) => {
    console.warn('[bridge] WebSocket error:', err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API base: ${backendBase}`);
  console.log(`Health: ${backendBase}/api/health`);
  console.log(`Hardware: ${backendBase}/api/hardware/status`);
  console.log(`Collector bins: ${backendBase}/api/collector-bins`);
  console.log(`Bridge WS: ${backendBase.replace(/^http/i, 'ws')}/bridge`);
});

module.exports = app;
