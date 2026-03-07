const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const session = require('express-session');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'sandy-thrifts-secret-key', // Change this to a secure random string
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Admin session check middleware
function requireAdmin(req, res, next) {
  if (req.session.adminLoggedIn) {
    return next();
  }
  res.redirect('/admin');
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

// Email transporter configuration
// For Gmail: Use an App Password (https://myaccount.google.com/apppasswords)
// For other services: Update host, port, user, and pass
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Send confirmation email with estimated delivery date
async function sendOrderConfirmationEmail(order, estimatedDeliveryDate) {
  try {
    const itemsList = order.items.map(item => 
      `- ${item.name} x${item.quantity} @ $${item.price}`
    ).join('\n');
    
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: order.customerEmail,
      subject: 'Order Confirmation - Thank You!',
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Hi ${order.customerName || 'Valued Customer'},</p>
        <p>Your order has been confirmed and is being prepared for shipment.</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Items:</strong></p>
        <pre>${itemsList}</pre>
        
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
        <p><strong>Estimated Delivery Date:</strong> ${estimatedDeliveryDate}</p>
        
        <p>We'll send you a tracking number as soon as your order ships.</p>
        <p>Thank you for shopping with us!</p>
        <p>Best regards,<br>Sandy's Thrifts Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Send customer thank you email after order placed
async function sendCustomerOrderEmail(order) {
  try {
    if (!order.customerEmail) return { success: false, error: 'No customer email' };
    
    const itemsList = order.items.map(item => 
      `- ${item.name} (${item.qty}x) @ $${item.price}`
    ).join('<br>');
    
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2);

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: order.customerEmail,
      subject: `Order Placed - Order ID: ${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Received!</h2>
          <p>Hi ${order.customerName || 'Valued Customer'},</p>
          <p>Thank you for shopping at Sandy's Thrifts! We've received your order and will begin processing it right away.</p>
          
          <h3>Order Information:</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Email:</strong> ${order.customerEmail}</p>
          <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
          
          <h3>Items Ordered:</h3>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 4px;">
            ${itemsList}
          </div>
          
          <h3 style="border-top: 2px solid #e91e8c; padding-top: 15px;">
            <span>Total: $${totalAmount}</span>
          </h3>
          
          <p>You will receive a separate email confirmation from our admin team with tracking information once your order ships.</p>
          
          <p>If you have any questions about your order, please reply to this email or contact us.</p>
          
          <p>Thank you for your business!</p>
          <p>Best regards,<br><strong>Sandy's Thrifts Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Customer email sent' };
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error: error.message };
  }
}

app.get('/api/products', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  if (!products) return res.status(500).json({ error: 'Products not available' });
  // ensure currency field exists
  products = products.map(p => ({ currency: 'USD', ...p }));
  res.json(products);
});

app.post('/api/orders', (req, res) => {
  const { items, customer } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order' });
  }
  const orders = readJSON(ORDERS_FILE) || [];
  const order = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    items: items,
    customerName: customer?.name || '',
    customerEmail: customer?.email || '',
    shippingAddress: customer?.address || '',
    phone: customer?.phone || '',
    emailSent: false
  };
  orders.push(order);
  try {
    writeJSON(ORDERS_FILE, orders);
    // If user is logged in, add order to their account
    if (req.session.userId) {
      const users = readJSON(USERS_FILE) || [];
      const userIndex = users.findIndex(u => u.id === req.session.userId);
      if (userIndex !== -1) {
        users[userIndex].orders.push(order);
        writeJSON(USERS_FILE, users);
      }
    }
    // Send customer order confirmation email
    sendCustomerOrderEmail(order).catch(err => console.error('Failed to send customer email:', err));
    res.json({ ok: true, orderId: order.id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const settings = readJSON(SETTINGS_FILE) || {};
  if (username === (settings.adminUsername || 'admin') && password === (settings.adminPassword || 'admin')) {
    req.session.adminLoggedIn = true;
    res.redirect('/admin/dashboard');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.use('/admin/dashboard', requireAdmin);
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.use('/admin/products', requireAdmin);
app.get('/admin/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'));
});

// Order management routes
app.use('/admin/orders', requireAdmin);
app.get('/admin/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'orders.html'));
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const orders = readJSON(ORDERS_FILE) || [];
  res.json(orders);
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orders = readJSON(ORDERS_FILE) || [];
  const id = parseInt(req.params.id);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  
  orders[index] = { ...orders[index], ...req.body };
  writeJSON(ORDERS_FILE, orders);
  res.json({ ok: true, order: orders[index] });
});

app.post('/api/admin/orders/:id/send-email', requireAdmin, async (req, res) => {
  const orders = readJSON(ORDERS_FILE) || [];
  const id = parseInt(req.params.id);
  const order = orders.find(o => o.id === id);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!order.customerEmail) return res.status(400).json({ error: 'No email address on file' });

  // Calculate estimated delivery date (3-5 business days)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4); // 4 days from now
  const estimatedDeliveryDate = deliveryDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const result = await sendOrderConfirmationEmail(order, estimatedDeliveryDate);
  
  if (result.success) {
    // Mark order as email sent
    order.emailSent = true;
    order.emailSentAt = new Date().toISOString();
    const idx = orders.findIndex(o => o.id === id);
    orders[idx] = order;
    writeJSON(ORDERS_FILE, orders);
  }

  res.json(result);
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE) || [];
  res.json(products);
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE) || [];
  const newProduct = req.body;
  // default currency USD if not provided
  newProduct.currency = newProduct.currency || 'USD';
  newProduct.discount = parseInt(newProduct.discount) || 0; // discount percentage 0-100
  newProduct.id = Date.now().toString();
  products.push(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true, product: newProduct });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE) || [];
  const id = req.params.id;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  const updated = { ...products[index], ...req.body };
  // ensure currency field persists
  if (!updated.currency) updated.currency = 'USD';
  if (updated.discount) updated.discount = parseInt(updated.discount);
  products[index] = updated;
  writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true });
});;

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE) || [];
  const id = req.params.id;
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return res.status(404).json({ error: 'Product not found' });
  writeJSON(PRODUCTS_FILE, filtered);
  res.json({ ok: true });
});

// Settings management routes
app.use('/admin/settings', requireAdmin);
app.get('/admin/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'settings.html'));
});

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const settings = readJSON(SETTINGS_FILE) || {};
  // Don't send password to frontend for security
  const { adminPassword, ...safeSettings } = settings;
  res.json(safeSettings);
});

app.post('/api/admin/settings/update', requireAdmin, (req, res) => {
  const settings = readJSON(SETTINGS_FILE) || {};
  const updates = req.body;
  
  // Only allow updating these fields
  if (updates.storeName) settings.storeName = updates.storeName;
  if (updates.storeTagline) settings.storeTagline = updates.storeTagline;
  if (updates.contactEmail) settings.contactEmail = updates.contactEmail;
  if (updates.contactPhone) settings.contactPhone = updates.contactPhone;
  if (updates.contactAddress) settings.contactAddress = updates.contactAddress;
  if (updates.contactInstagram) settings.contactInstagram = updates.contactInstagram;
  if (updates.contactFacebook) settings.contactFacebook = updates.contactFacebook;
  if (updates.openTime) settings.openTime = updates.openTime;
  if (updates.closeTime) settings.closeTime = updates.closeTime;
  if (typeof updates.temporaryClosed !== 'undefined') settings.temporaryClosed = updates.temporaryClosed;
  
  writeJSON(SETTINGS_FILE, settings);
  const { adminPassword, ...safeSettings } = settings;
  res.json({ ok: true, settings: safeSettings });
});

app.post('/api/admin/settings/change-credentials', requireAdmin, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const settings = readJSON(SETTINGS_FILE) || {};
  
  if (currentPassword !== settings.adminPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  if (!newUsername || !newPassword) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  settings.adminUsername = newUsername;
  settings.adminPassword = newPassword;
  writeJSON(SETTINGS_FILE, settings);
  
  res.json({ ok: true, message: 'Credentials updated successfully' });
});

app.get('/api/store-info', (req, res) => {
  const settings = readJSON(SETTINGS_FILE) || {};
  res.json({
    storeName: settings.storeName,
    storeTagline: settings.storeTagline,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    contactInstagram: settings.contactInstagram,
    contactFacebook: settings.contactFacebook,
    openTime: settings.openTime,
    closeTime: settings.closeTime,
    temporaryClosed: settings.temporaryClosed
  });
});

// User authentication routes
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const users = readJSON(USERS_FILE) || [];
  if (users.find(u => u.email === email)) {
    return res.status(400).send('Email already registered');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name, email, password: hashedPassword, orders: [] };
  users.push(user);
  writeJSON(USERS_FILE, users);
  req.session.userId = user.id;
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE) || [];
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  req.session.userId = user.id;
  res.redirect('/');
});

app.post('/admin/logout', (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect('/admin');
});

app.get('/account', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/api/user', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const users = readJSON(USERS_FILE) || [];
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ name: user.name, email: user.email, orders: user.orders });
});

app.get('/api/session', (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

// Paystack Payment Integration
app.post('/pay', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
    
    const paystackResponse = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack expects amount in kobo (multiply by 100)
      metadata,
      callback_url: `${req.protocol}://${req.get('host')}/payment-success`,
      cancel_url: `${req.protocol}://${req.get('host')}/`
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      authorization_url: paystackResponse.data.data.authorization_url,
      reference: paystackResponse.data.data.reference
    });
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment initialization failed' });
  }
});

app.post('/paystack-webhook', (req, res) => {
  try {
    // Validate Paystack signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    
    if (hash !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    
    if (event.event === 'charge.success') {
      const { metadata, customer, amount } = event.data;
      
      // Extract order details from metadata
      const orderDetails = metadata;
      
      // Save order to system
      const orders = readJSON(ORDERS_FILE) || [];
      const order = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        status: 'paid',
        items: orderDetails.items,
        customerName: orderDetails.customerName,
        customerEmail: customer.email,
        shippingAddress: orderDetails.address || '',
        phone: orderDetails.phone || '',
        amount: amount / 100,
        paymentRef: event.data.reference,
        emailSent: false
      };
      orders.push(order);
      writeJSON(ORDERS_FILE, orders);
      
      // If user is logged in, add to their orders (though payment might be guest)
      // For now, assume guest
      
      // Send SMS notifications
      sendSMSNotification(customer.email, orderDetails, amount / 100);
      
      // Send Email receipt
      sendEmailReceipt(customer.email, orderDetails, amount / 100);
      
      console.log('Payment successful for:', orderDetails);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// SMS Notification using mNotify
async function sendSMSNotification(customerEmail, orderDetails, amount) {
  try {
    const merchantPhone = process.env.MERCHANT_PHONE; // Your phone number
    const customerPhone = orderDetails.phone || 'N/A'; // Assuming phone is in metadata
    
    const smsMessage = `New Order: ${orderDetails.productName} - ${orderDetails.size}. Total: GHS ${amount} paid by ${orderDetails.customerName}.`;
    
    // Send to merchant
    await axios.post('https://api.mnotify.com/api/sms/quick', {
      recipient: [merchantPhone],
      sender: 'SandyThrifts',
      message: smsMessage,
      is_schedule: false,
      schedule_date: ''
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MNOTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Send to customer
    const customerMessage = `Thank you for your order! ${orderDetails.productName} - ${orderDetails.size}. Total: GHS ${amount}. We'll process your order soon.`;
    await axios.post('https://api.mnotify.com/api/sms/quick', {
      recipient: [customerPhone],
      sender: 'SandyThrifts',
      message: customerMessage,
      is_schedule: false,
      schedule_date: ''
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MNOTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('SMS notifications sent');
  } catch (error) {
    console.error('SMS sending error:', error.response?.data || error.message);
  }
}

// Email Receipt using Resend
async function sendEmailReceipt(customerEmail, orderDetails, amount) {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e8c;">Payment Receipt - Sandy's Thrifts</h2>
        <p>Thank you for your purchase!</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3>Order Details:</h3>
          <p><strong>Product:</strong> ${orderDetails.productName}</p>
          <p><strong>Size:</strong> ${orderDetails.size}</p>
          <p><strong>Quantity:</strong> ${orderDetails.quantity}</p>
          <p><strong>Total Amount:</strong> GHS ${amount}</p>
          <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
        </div>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Sandy's Thrifts Team</p>
      </div>
    `;

    await axios.post('https://api.resend.com/emails', {
      from: 'orders@sandythrifts.com',
      to: [customerEmail],
      subject: 'Payment Receipt - Sandys Thrifts',
      html: emailHtml
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Email receipt sent');
  } catch (error) {
    console.error('Email sending error:', error.response?.data || error.message);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
