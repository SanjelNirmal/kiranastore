KIRANA E-Store 🛒

KIRANA E-Store is a hyper-local, single-vendor e-commerce web application designed to digitize neighborhood stores in Nepal. It allows users to browse products, manage carts, make secure payments via eSewa, and provides store owners with an admin dashboard to manage inventory and orders.

Table of Contents

Features

Technologies Used

System Architecture

Installation

Usage

Testing

Future Enhancements

License

Features

User authentication and role-based access (Customer/Admin)

Dynamic product catalog with search and filters

Persistent shopping cart

Checkout with eSewa integration (QR & API payment)

Order history and status tracking

Admin dashboard: Add/update/delete products, view orders

Responsive UI using Tailwind CSS

Technologies Used
Layer	Technology
Frontend	React 18, TypeScript, Tailwind CSS
Backend	Supabase (Auth + PostgreSQL DB)
Payment	eSewa Payment Gateway
Version Control	Git & GitHub
Testing	Unit & System Testing (E2E)
System Architecture

The system follows a 3-tier architecture:

Presentation Layer (Frontend)

Built with React

Handles all user interactions

Application Layer (API)

Supabase client library (supabase-js)

Handles authentication, business logic, and database queries

Data Layer (Database)

PostgreSQL database hosted on Supabase

Stores users, products, orders, and cart information

(Optional: Insert architecture diagram here)

Installation

Prerequisites:

Node.js v18+

npm or yarn

Git

Steps:

# Clone the repository
git clone https://github.com/<your-username>/kirana-e-store.git

# Navigate to project folder
cd kirana-e-store

# Install dependencies
npm install

# Start the development server
npm run dev

Supabase Setup:

Create a free Supabase account: https://supabase.com

Create a project and add tables (Users, Products, Orders, Order_Items)

Copy `.env.example` to `.env` and fill in your credentials:

```
cp .env.example .env
```

Required environment variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_GEMINI_API_KEY=<your-google-translation-api-key>  # Optional – falls back to offline dictionary
```

> **Note:** Never commit `.env` to version control. It is listed in `.gitignore`.
Usage

Open the application in your browser: http://localhost:5173

Sign up as a Customer or Admin

Browse products, add to cart, and checkout using eSewa

Admin can manage products, view orders, and update order status

Testing

Unit Tests: Functions like calculateCartTotal are tested for correctness

System Testing (E2E): User registration, login, cart, and checkout flow

Test cases include both successful and failure scenarios (e.g., failed payment redirect)

Future Enhancements

Multi-vendor support

Mobile app using React Native

AI-based product recommendations

Advanced analytics for sales and customer behavior

PWA offline support

License

This project is licensed under the MIT License.
