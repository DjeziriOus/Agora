// Gmail OAuth2 test — node test-email.mjs
import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type:         'OAuth2',
    user:         process.env.EMAIL_FROM,
    clientId:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

console.log('Testing Gmail OAuth2...');
console.log('From:', process.env.EMAIL_FROM);
console.log('Refresh token starts with:', process.env.GOOGLE_REFRESH_TOKEN?.slice(0, 10) + '...');

try {
  const info = await transporter.sendMail({
    from:    `"Agora Test" <${process.env.EMAIL_FROM}>`,
    to:      process.env.EMAIL_FROM,
    subject: 'Agora Email Test',
    text:    'Gmail OAuth2 is working!',
  });
  console.log('\n✅ Email sent! Check the inbox of', process.env.EMAIL_FROM);
  console.log('Message ID:', info.messageId);
} catch (err) {
  console.error('\n❌ Failed:', err.message);
  if (err.response) console.error('Server response:', err.response);
}
