# Order Management System - Quick Start Guide

## What Was Added

A complete order management system that allows admins to:
1. **View all customer orders** with details (customer name, email, items, total)
2. **Confirm orders** (change status from pending to confirmed)
3. **Send thank-you emails** to customers with:
   - Order summary
   - Estimated delivery date (calculated as 4 days from order)
   - Professional thank-you message
4. **Track email status** (see which orders have had confirmation emails sent)
5. **Filter orders** by status (pending/confirmed) and email status

## Testing the Flow

### Step 1: Start the Server
```bash
npm install  # Install dependencies (nodemailer was added)
npm start
# Server will run at http://localhost:3000
```

### Step 2: Place a Test Order
1. Open http://localhost:3000 in your browser
2. Browse products and add items to cart
3. Click "Cart" button
4. Fill in checkout form:
   - Full name: John Doe
   - Email: test@example.com
   - Shipping address: 123 Main St, City, State 12345
5. Click "Place Order"
6. You should see "Order placed! ID: [number]"

### Step 3: Access Admin Panel
1. Go to http://localhost:3000/admin
2. You'll see a login prompt
3. Credentials: `admin` / `admin`
4. Click "Manage Orders" or go to http://localhost:3000/admin/orders

### Step 4: Review and Manage Orders
In the Orders Management page:
- See all orders in a table with status and email tracking
- Click "View" button on any order to see full details
- In the order modal:
  - Click "Confirm Order" to change status from pending to confirmed
  - Click "Send Confirmation Email" to send the thank-you email

### Step 5: Configure Email (Optional but Recommended)
To actually send emails, configure email credentials:

**For Testing Without Email Setup:**
- Leave default settings - the app will show success/error messages
- No real emails will be sent, but you can test the UI

**To Enable Real Email Sending:**

1. **Option A: Gmail (Easiest)**
   - Go to https://myaccount.google.com/apppasswords
   - Generate an App Password
   - Set these environment variables before starting:
     ```bash
     set EMAIL_USER=your-email@gmail.com
     set EMAIL_PASS=your16charpassword
     npm start
     ```

2. **Option B: Create .env file:**
   - Create a `.env` file in the project root
   - Add:
     ```
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     ```
   - Run `npm start`

3. **See EMAIL_SETUP.md for more providers** (Outlook, Yahoo, custom SMTP)

## Accessing Different Admin Pages

- Dashboard: http://localhost:3000/admin/dashboard
- Orders: http://localhost:3000/admin/orders  
- Products: http://localhost:3000/admin/products

## API Endpoints (For Reference)

### Orders API
- `GET /api/admin/orders` - Get all orders (requires auth)
- `GET /admin/orders` - View orders page (requires auth)
- `PUT /api/admin/orders/:id` - Update order (requires auth)
  ```json
  {"status": "confirmed"}
  ```
- `POST /api/admin/orders/:id/send-email` - Send confirmation email (requires auth)

### Products API
- `GET /api/products` - Get all products (public)
- `GET /api/admin/products` - Get products for admin (requires auth)
- `POST /api/admin/products` - Create product (requires auth)
- `PUT /api/admin/products/:id` - Update product (requires auth)
- `DELETE /api/admin/products/:id` - Delete product (requires auth)

### Orders Placement
- `POST /api/orders` - Create new order (public)
  ```json
  {
    "items": [
      {"id": "shirt-001", "qty": 2, "price": 19.99, "name": "Classic White Tee"}
    ],
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "address": "123 Main St"
    }
  }
  ```

## Order Data Structure

Orders are stored in `data/orders.json`:
```json
{
  "id": 1234567890,
  "createdAt": "2026-02-24T10:30:45.123Z",
  "status": "pending",
  "items": [
    {
      "id": "shirt-001",
      "qty": 1,
      "price": 19.99,
      "name": "Classic White Tee"
    }
  ],
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "shippingAddress": "123 Main St, City, State 12345",
  "phone": "",
  "emailSent": false
}
```

## Key Features

✅ **Order Review** - See all customer orders with quick summary
✅ **Order Confirmation** - Mark orders as confirmed with one click
✅ **Email Notifications** - Send professional thank-you emails
✅ **Estimated Delivery** - Automatically calculates 4-day delivery estimate
✅ **Email Tracking** - Know which orders have had emails sent
✅ **Filtering** - Filter by order status and email status
✅ **Responsive Design** - Works on desktop and mobile admin devices

## Troubleshooting

**"Server is not starting"**
- Make sure you ran `npm install` first
- Check that port 3000 is not in use
- Try: `npm start` or `& "C:\Program Files\nodejs\node.exe" server.js`

**"Orders not appearing"**
- Make sure orders are placed through the website first
- Check that `data/orders.json` exists
- Try placing a test order

**"Can't send emails"**
- See EMAIL_SETUP.md for configuration
- Check the console for error messages
- Verify email credentials are correct
- Try using Gmail with an App Password (easiest option)

**"Admin login not working"**
- Username: `admin` (lowercase)
- Password: `admin` (lowercase)
- If still issues, clear browser cache and try again

## Next Steps

1. Test placing orders and managing them
2. Change product currency when adding/editing (USD or GHS)
3. Configure store hours and status in Settings page
4. Configure email if desired (see EMAIL_SETUP.md)
5. Customize email template in server.js (line 56-81)
6. Deploy to Render.com or similar service
7. Use your real domain and email service for production

## Customization

To customize the thank-you email template, edit the HTML in `server.js` in the `sendOrderConfirmationEmail` function (around line 56-81).

To change the estimated delivery days, edit line 191 in `server.js`:
```javascript
deliveryDate.setDate(deliveryDate.getDate() + 4); // Change 4 to your desired days
```
