const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// Simple parser for .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const resendApiKey = env.RESEND_API_KEY;
const fromEmail = 'crm@thestorybuilder.in'; // Use the custom verified domain

console.log("Using API Key:", resendApiKey ? resendApiKey.substring(0, 10) + "..." : "undefined");
console.log("Using From Email:", fromEmail);

const resend = new Resend(resendApiKey);

async function test() {
  try {
    const response = await resend.emails.send({
      from: `Agency OS Onboarding <${fromEmail}>`,
      to: 'kiran@thestorybuilder.in', // Different recipient email
      subject: 'Resend Custom Domain Test',
      html: '<strong>Resend test message from crm@thestorybuilder.in</strong>'
    });
    console.log("Full Resend Response:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Exception thrown:", error);
  }
}

test();
