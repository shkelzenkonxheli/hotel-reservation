# 🏨 Hotel Reservation & Management System

A full-stack hotel and apartment reservation & management platform built with **Next.js**, **PostgreSQL**, **Prisma**, and **Stripe**.

The system supports **online bookings with payments** and provides an **admin/worker dashboard** for managing rooms, reservations, cleaning status, users, and activity logs.

---

## 🚀 Features

### 💳 Booking & Payments

- Secure online payments via **Stripe Checkout**
- Real-time room availability validation
- Automatic reservation creation after successful payment
- Reservation status lifecycle:
  - `pending`
  - `confirmed`
  - `completed`
  - `cancelled`

---

### 🏨 Room Management

- Dynamic room statuses:
  - 🟢 `available`
  - 🔴 `booked`
  - 🟡 `needs_cleaning`
- Filter & search rooms by:
  - Type
  - Status
- Mark rooms as **cleaned** from the dashboard
- Activity logging for room updates

---

### 📅 Reservation Management (Admin / Worker)

- Create, edit, and delete reservations
- Change reservation status
- Mobile-friendly **card view**
- Desktop **table view**
- Favorite / pin reservations
- Print reservation receipts (admin & staff only)

---

### 👤 User Management (Admin)

- Create users
- Change user roles:
  - `admin`
  - `worker`
  - `client`
- Prevent duplicate users by email
- Admins cannot be deleted

---

### 🧾 Activity Logs (Audit Trail)

- Automatic logging for:
  - Reservation create / update / delete
  - Status changes
  - Room updates (cleaning, delete, etc.)
- Bulk select & bulk delete logs
- Filter logs by action
- Color-coded actions:
  - CREATE (green)
  - UPDATE (orange)
  - DELETE (red)
  - CLEAN (custom color)

---

## 🔐 Roles & Permissions

| Role       | Access                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| **Admin**  | Full dashboard access (Overview, Rooms, Reservations, Users, Activity Logs) |
| **Worker** | Rooms & Reservations only                                                   |
| **Client** | Can book rooms, no dashboard access                                         |

---

## 🧩 Tech Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Frontend | Next.js 14 (App Router), React  |
| UI       | Material UI (MUI), TailwindCSS  |
| Backend  | Next.js API Routes              |
| Database | PostgreSQL + Prisma ORM         |
| Payments | Stripe                          |
| Auth     | NextAuth / Cookie-based session |
| Charts   | Recharts (Dashboard stats)      |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/shkelzenkonxheli/hotel-reservation.git
cd hotel-reservation
```
