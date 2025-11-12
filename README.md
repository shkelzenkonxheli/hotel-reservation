# 🏨 Hotel Reservation System

A full-stack hotel and apartment reservation platform built with **Next.js**, **PostgreSQL**, and **Stripe**.  
This system allows customers to book rooms online securely and provides admins with a powerful dashboard to manage rooms, reservations, and cleaning status.

---

## 🚀 Features

### 💳 Booking & Payments

- Secure online payments using **Stripe Checkout**
- Real-time room availability check
- Automatic reservation confirmation after payment

### 🏠 Room Management

- Dynamic room statuses:
  - 🟩 `available`
  - 🟥 `booked`
  - 🟨 `needs_cleaning`
- Filter and search by room type, status, or date
- Option to mark rooms as cleaned directly in the dashboard

### 👤 User System

- Authentication using cookies (via `/api/me`)
- Each user can see their own reservations
- Admin access for managing all rooms and reservations

---

## 🧩 Tech Stack

| Layer                | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| **Frontend**         | Next.js 14 (App Router), React, Material UI (MUI), TailwindCSS |
| **Backend**          | Next.js API Routes                                             |
| **Database**         | PostgreSQL with Prisma ORM                                     |
| **Payments**         | Stripe                                                         |
| **State Management** | React Context API                                              |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/shkelzenkonxheli/hotel-reservation.git
cd hotel-reservation
2️⃣ Install dependencies
npm install

3️⃣ Setup environment variables

Create a .env file in the project root:

DATABASE_URL="postgresql://user:password@localhost:5432/hotel"
STRIPE_SECRET_KEY="sk_test_*************************"
STRIPE_WEBHOOK_SECRET="whsec_*************************"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"


⚠️ Never commit this file to GitHub.
It's already ignored in .gitignore.

4️⃣ Run database migrations
npx prisma migrate dev

5️⃣ Start the development server
npm run dev

6️⃣ Listen to Stripe webhooks (optional, for local testing)
stripe listen --forward-to localhost:3000/api/stripe-webhook

```
