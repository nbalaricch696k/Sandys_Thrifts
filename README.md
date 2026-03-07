# Sandy's Thrifts

A modern e-commerce platform for Sandy's Thrifts offering a curated selection of quality clothing with a professional storefront and complete order management system. Orders are securely stored and integrated with email notifications.

Requirements
- Node.js 16+

Quick start
```bash
npm install
npm start
# then open http://localhost:3000
```

Development
- Use `npm run dev` if you want automatic restarts (requires `nodemon`).

Features
- Product catalog with responsive grid layout and promotional pricing
- Shopping cart with size/color selection
- Products with individual currency (USD or GHS) and discount support
- Customer checkout with order details
- Admin panel with basic login (admin/admin)
- Product management (add/edit/delete) including currency
- **Order management**: Review orders, confirm shipments, send thank-you emails
- Email notifications with estimated delivery dates

Admin Panel Features
1. **Dashboard** (`/admin`)
   - Overview of store management options
   
2. **Product Management** (`/admin/products`)
   - Add new products
   - Edit existing products
   - Delete products
   
3. **Order Management** (`/admin/orders`) - NEW!
   - View all customer orders
   - See customer details and order items
   - Confirm orders
   - Send thank-you emails with estimated delivery dates
   - Track which orders have had confirmation emails sent
   - Filter orders by status and email status   - **Configure store details** including name, tagline, contact info
   - **Set store hours** (open/close times and temporary closed flag)
   - **Store status banner** appears at top of site indicating open/closed or temporarily closed
   - **Change admin login credentials**
   - **Choose currency per product (USD or GHS)**
Admin Credentials (Basic Auth)
- Username: `admin`
- Password: `admin`

Email Configuration
To enable customer confirmation emails:
1. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed setup instructions
2. Default config uses Gmail (requires App Password)
3. Supports any SMTP service
4. Environment variables: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SECURE`

Files
- [server.js](server.js) - Express server and API
- [data/products.json](data/products.json) - sample products
- [data/orders.json](data/orders.json) - saved orders
- [public/index.html](public/index.html) - frontend
- [public/app.js](public/app.js) - frontend logic
- [public/admin/dashboard.html](public/admin/dashboard.html) - admin dashboard
- [public/admin/products.html](public/admin/products.html) - product management
- [public/admin/orders.html](public/admin/orders.html) - order management (NEW)
- [EMAIL_SETUP.md](EMAIL_SETUP.md) - email configuration guide

Data Structure
- Orders are stored in `data/orders.json` with structure:
  ```json
  {
    "id": 1234567890,
    "createdAt": "2026-02-24T...",
    "status": "pending|confirmed",
    "items": [...],
    "customerName": "...",
    "customerEmail": "...",
    "shippingAddress": "...",
    "emailSent": true|false,
    "emailSentAt": "2026-02-24T..." 
  }
  ```

Presentation notes
- Enhanced UI: hero section, improved typography, responsive product grid, and product detail modal
- Polished cart and checkout modal with local storage persistence
- Small SVG assets: `public/logo.svg`, `public/favicon.svg`
- Admin panel with product management
- **NEW:** Complete order management system with email notifications
- Secure order management with customer and admin notification system

Next steps (optional)
- Add Stripe checkout and webhooks
- Optimize image loading with local assets  
- Secure admin with sessions or JWT instead of basic auth
- Add order tracking page for customers
- Send shipping notifications with tracking numbers

Run
```bash
npm install
npm start
# open http://localhost:3000
```
