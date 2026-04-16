const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Function to provision initial admin account
async function provisionInitialAdmin(adminEmail, defaultPassword = 'admin123') {
  const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) || {};

  if (settings.adminUsername && settings.adminPasswordHash) {
    console.log('Admin already provisioned');
    return { success: false, message: 'Admin already exists' };
  }

  // Generate unique username from email (before @)
  const username = adminEmail.split('@')[0] + '_admin';

  // Hash the password
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  settings.adminUsername = username;
  settings.adminEmail = adminEmail;
  settings.adminPasswordHash = hashedPassword;
  settings.createdAt = new Date().toISOString();

  // Remove old plain password if exists
  delete settings.adminPassword;

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

  console.log(`Initial admin provisioned:`);
  console.log(`Username: ${username}`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Default Password: ${defaultPassword}`);
  console.log('Please change the password after first login.');

  return { success: true, username, email: adminEmail, message: 'Admin provisioned successfully' };
}

// Run the provisioning
// Replace 'your-admin@gmail.com' with the actual Gmail address
const adminEmail = process.argv[2] || 'your-admin@gmail.com';
const defaultPassword = process.argv[3] || 'admin123';

provisionInitialAdmin(adminEmail, defaultPassword)
  .then(result => {
    if (result.success) {
      console.log('Provisioning completed successfully.');
    } else {
      console.log('Provisioning failed:', result.message);
    }
  })
  .catch(err => {
    console.error('Error provisioning admin:', err);
  });