# StayEase - Modern PG & Room Booking Platform

![StayEase Banner](https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop) *(Replace with your actual project screenshot)*

StayEase is a full-stack web application designed to streamline the process of finding, viewing, and booking PG accommodations and rented rooms. It features a modern, responsive UI, secure payment integration, and a comprehensive admin panel for room management.

## 🚀 Features

### For Users
* **Browse & Filter:** Search for rooms by type, price, and amenities.
* **Authentication:** Secure OTP-based sign-up, login, and password reset.
* **Online Booking:** Seamless checkout process via **Stripe** payment gateway.
* **Dashboard:** Manage current bookings, view status, and express interest in sold-out rooms.
* **Email Notifications:** Automated email confirmations and OTPs via Nodemailer.

### For Admins
* **Room Management:** Add, edit, and delete room listings.
* **Image Uploads:** Upload high-quality room images securely to **Cloudinary**.
* **Booking Overview:** Track all pending and confirmed user bookings.

## 🛠️ Tech Stack

* **Frontend:** HTML5, Tailwind CSS (via CDN), Vanilla JavaScript, Lucide Icons.
* **Backend:** Node.js, Express.js, TypeScript.
* **Database:** PostgreSQL.
* **Payments:** Stripe API.
* **Media Storage:** Cloudinary.
* **Deployment:** Render.

## 📦 Local Installation & Setup

Follow these steps to run the project locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/en/) installed.
* A [PostgreSQL](https://www.postgresql.org/) database (local or cloud like Neon/Supabase).
* Accounts for Stripe, Cloudinary, and a Gmail address for sending emails.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/StayEase-PG---Modern-Room-Booking.git
cd StayEase-PG---Modern-Room-Booking
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add the following keys. Refer to `.env.example` for details.

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Email Configuration (Nodemailer)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application URL
APP_URL=http://localhost:3000
```

### 4. Run the Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`, and the database tables will be automatically initialized and seeded with sample data if empty.

## 🌐 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rooms` | Fetch all available rooms |
| `POST` | `/api/signup` | Register a new user |
| `POST` | `/api/login` | Authenticate user |
| `POST` | `/api/book` | Create a new room booking |
| `POST` | `/api/create-checkout-session`| Initialize Stripe payment session |
| `POST` | `/api/admin/rooms` | (Admin) Add a new room |
| `DELETE` | `/api/admin/rooms/:id` | (Admin) Delete a room |

## 🚀 Deployment

This project is configured for easy deployment on **Render**. 
1. Connect your GitHub repository to Render as a "Web Service".
2. Set the Build Command: `npm install && npm run build`
3. Set the Start Command: `node server.ts`
4. Add all environment variables in the Render dashboard.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is licensed under the MIT License.
