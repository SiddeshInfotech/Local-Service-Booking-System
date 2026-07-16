# Frontend Architecture & Component Documentation

The frontend of the Local Service Booking System is a Single Page Application (SPA) built using React, Vite, and TailwindCSS. It consists of a customer-facing site and a secure administration control panel.

---

## Directory Organization

```
src/
├── assets/             # Branding icons, images, and illustrations
├── components/         # Reusable inputs, cards, layouts, and navbars
│   ├── InputField.jsx  # Reusable floating label input form element
│   ├── Navbar.jsx      # Global client site header with profile links
│   └── Footer.jsx      # Global footer containing system links
├── pages/              # Primary route views
│   ├── admin/          # Admin Control Panel Views
│   │   ├── AdminDashboard.jsx     # Live operational indicators
│   │   ├── AdminLayout.jsx        # Sidebar scaffolding & alert checker
│   │   ├── AdminLogin.jsx         # Secure Admin authentication portal
│   │   ├── AdminReports.jsx       # Chart graphs and commercial summaries
│   │   ├── ManageBookings.jsx     # Booking log inspector and cancels
│   │   ├── ManageCategories.jsx   # Category CRUD management
│   │   ├── ManageCustomers.jsx    # Customer directory & block controls
│   │   ├── ManageProviders.jsx    # Provider directory and suspension logs
│   │   ├── ManageServices.jsx     # Service items setup and modifications
│   │   ├── ProviderApproval.jsx   # Document approvals queue
│   │   └── ViewReviews.jsx        # Customer reviews moderation panel
│   ├── CustomerLogin.jsx          # Client signin page
│   ├── CustomerRegister.jsx       # Client signup form
│   ├── ForgotPassword.jsx         # Recovery link request form
│   ├── LandingPage.jsx            # Product landing page with hero
│   └── ServicesPage.jsx           # Dynamic catalog and scheduling checkout
├── App.jsx             # React entry routes and layout configurations
├── api.js              # Centralized token authentication helpers
└── index.css           # Global CSS variables and fonts
```

---

## Routing & Layouts (`src/App.jsx`)

The routing is implemented using `react-router-dom` version 6.

### 1. Public & Customer Routes
* Shared Header (`Navbar`) and Footer (`Footer`) are loaded automatically on all standard client paths:
  * `/` (Landing Page)
  * `/services` (Service grid directory and booking form modal)
  * `/about`, `/contact`, `/terms` (Info pages)
  * `/customer/login`, `/customer/register`, `/customer/forgot-password`
  * `/provider/login`, `/provider/register`

### 2. Standalone Admin Login
* `/admin/login` renders a standalone form without sidebars or client layouts.

### 3. Nested Admin Panel Routes
* Paths prefixed with `/admin/*` are wrapped in the secure [AdminLayout](file:///d:/Local-Service-Booking-System/src/pages/admin/AdminLayout.jsx) containing a collapsible navigation sidebar.
  * `/admin/dashboard` (Stats cards & registration logs)
  * `/admin/customers` (Customers list table, block/unblock, edit)
  * `/admin/providers` (Providers list table, block/unblock)
  * `/admin/provider-approval` (Approvals queue tab filters, doc details modal)
  * `/admin/categories` (Category list CRUD modal)
  * `/admin/services` (Service list CRUD modal)
  * `/admin/bookings` (Active bookings table, cancels)
  * `/admin/reviews` (Review list, deletion moderation)
  * `/admin/reports` (Diagnostics chart graphs)

---

## API Integration & Token Storage (`src/api.js`)

All network requests interact with the backend server URL (`http://127.0.0.1:5000`) using centralized helper functions defined in `src/api.js`.

### 1. Token Helpers
* **`getToken()`**: Retrieves the active token from `localStorage` depending on user role (`access_token` or `admin_token`).
* **`clearAuth()`**: Wipes out all stored credentials (tokens, roles, user profiles) from `localStorage` on logout.
* **`getRole()`**: Returns the active session role (`customer`, `provider`, or `admin`).

### 2. Fetch Interceptor (`apiFetch()`)
Wrap around standard `fetch()` which automatically:
* Appends `http://127.0.0.1:5000` to path strings.
* Attaches the `Authorization: Bearer <token>` header if a token exists.
* Catches `401 Unauthorized` responses and silently requests a new session token via `/api/customer/refresh-token` or `/api/provider/refresh-token` using the stored refresh token. Retries the original call on success.
* Clears authentication and logs out on token refresh failure.
