# KrishPay™ - UPI Payment Gateway System

A complete full-stack Next.js 14 application with Supabase backend for processing UPI payments with manual verification.

## Features

- **Payment Processing**: Accept UPI payments via QR code
- **Manual Verification**: Admin dashboard for payment verification
- **File Upload**: Screenshot upload to Supabase storage
- **Authentication**: Secure admin access with Supabase Auth
- **Responsive Design**: Works on all devices

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your keys
3. Update `.env.local` with your Supabase credentials

### 2. Database Setup

1. Go to Supabase Dashboard > SQL Editor
2. Run the migration script from `supabase/migrations/20250718151357_azure_beacon.sql`

### 3. Authentication Setup

1. Go to Supabase Dashboard > Authentication > Settings
2. Disable email confirmation for now
3. Create an admin user:
   - Email: `krrishyogi18@gmail.com`
   - Password: `Drishti@05`

### 4. Storage Setup

1. Go to Supabase Dashboard > Storage
2. The migration creates a `screenshots` bucket automatically
3. Ensure it's set to public access

### 5. Environment Variables

Create `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 6. UPI QR Code

Replace `/public/upi-qr.png` with your actual UPI QR code image.

## Usage

### For Users
1. Visit `/payment`
2. Scan the QR code and make payment
3. Enter UTR number and upload screenshot
4. Submit for verification

### For Admins
1. Visit `/admin`
2. Login with admin credentials
3. Review payment submissions
4. Verify or reject payments

## Deployment

This project is ready for deployment on Vercel:

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## API Endpoints

- `POST /api/submit-payment` - Submit payment for verification
- `POST /api/verify-payment` - Update payment status (admin only)

## File Structure

```
app/
├── page.tsx                 # Homepage
├── payment/
│   └── page.tsx            # Payment submission form
├── admin/
│   └── page.tsx            # Admin dashboard
└── api/
    ├── submit-payment/
    │   └── route.js        # Payment submission API
    └── verify-payment/
        └── route.js        # Payment verification API

lib/
└── supabase.js             # Supabase client configuration

supabase/
└── migrations/
    └── 20250718151357_azure_beacon.sql  # Database schema
```

## Security Features

- Row Level Security (RLS) enabled
- Authenticated admin access
- File upload size limits
- Input validation
- CSRF protection

## Support

For issues or questions, please check the documentation or create an issue.