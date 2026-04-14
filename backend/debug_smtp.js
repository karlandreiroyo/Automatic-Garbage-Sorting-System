require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM;

console.log('SMTP_HOST:', host);
console.log('SMTP_USER:', user);
console.log('SMTP_PASS starts with:', pass ? pass.substring(0, 10) + '...' : 'undefined');
console.log('SMTP_FROM:', from);

const passLooksLikePlaceholder = pass && (
  pass.toLowerCase().includes('your_app_password') ||
  pass.toLowerCase().includes('your_password') ||
  pass.toLowerCase().includes('your_smtp_pass')
) && !pass.startsWith('xkeysib-') && !pass.startsWith('xsmtpsib-');

console.log('passLooksLikePlaceholder:', passLooksLikePlaceholder);

const checks = [
  !host,
  !user,
  !pass,
  !from,
  host && host.toLowerCase().includes('your_smtp'),
  host && host.toLowerCase().includes('your_smtp_host'),
  host && host.toLowerCase().includes('smtp.example.com'),
  user && user.toLowerCase().includes('your_email'),
  user && user.toLowerCase().includes('your_smtp_user'),
  user && user.toLowerCase().includes('@example.com'),
  passLooksLikePlaceholder,
  from && from.toLowerCase().includes('your_email'),
  from && from.toLowerCase().includes('example.com')
];

console.log('Individual check results:', checks);
console.log('hasPlaceholders:', checks.some(x => x));