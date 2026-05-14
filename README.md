# KUSMS Leo Club Management System

A professional, scalable management system for Leo Club of KUSMS with QR-based verification and Live CV generation.

## Features

- **Admin Dashboard**: Activity entry with member tagging, member management
- **Public Archive**: Month-wise activity viewing with anchor links
- **Live CV**: QR-based member verification showing complete participation history
- **QR Certificates**: Generate PDF certificates with QR codes
- **Mobile Responsive**: Works on all devices

## Quick Start

### 1. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Register a web app and copy config values
5. Add `.env.local` with your config (see `.env.example`)

### 2. Add Admin User

1. In Firebase Console → Authentication → Add User
2. Email: admin@kusmsleoclub.com (or your email)
3. Password: Create a strong password
4. Update `.env.local` with these credentials

### 3. Install & Run

```bash
npm install
npm run dev
