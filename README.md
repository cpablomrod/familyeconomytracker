# 🎯 Bull's Eye Economic Target

A modern, full-stack family expense tracking application built with Next.js, TypeScript, and MongoDB. Track your daily expenses, manage your family's finances, and hit your money targets!

## ✨ Features

### 👨‍👩‍👧‍👦 Family Management
- Multi-member family accounts with age and gender-specific icons
- Secure authentication with bcrypt password hashing
- Gender-aware family member visualization (👦👧👨👩👴👵)

### 💰 Financial Tracking
- **Income Streams**: Track multiple sources of income
- **Fixed Payments**: Manage recurring monthly payments
- **Properties**: Monitor property values and mortgage payments
- **Loans**: Keep track of loan payments and end dates
- **Daily Expenses**: Add expenses by date with detailed categorization

### 📊 Financial Health Dashboard
- Interactive circular chart showing income vs expenses
- Monthly and yearly view toggle
- Real-time balance calculations
- Visual alerts for overspending
- Profile completion tracking

### 📅 Interactive Calendar
- Month-by-month expense tracking
- Day-wise expense entry
- Visual indicators for days with expenses
- Prevents future date expense entry
- Quick expense overview by day

### 🏷️ Expense Categories with Subcategories
- **Food**: Meat, Fish, Chicken, Rice, Pasta, and more
- **Gasoline**: Diesel, Gasoline
- **Utilities**: Kitchen, Bathroom, Housing
- **Restaurants**: Breakfast, Lunch, Dinner, Snacks
- **Clothing**: Kids, Adults, Baby
- **Travelling**: Trips and transport
- **Leisure**: Entertainment and hobbies
- **Appliances**: Home appliances
- **Home Renovations**: Repair and improvement

### 📄 Monthly Reports
- Generate comprehensive PDF reports
- Includes financial health circle chart
- Category-wise expense breakdown
- Detailed transaction listing
- Professional formatting with tables
- Downloadable PDF with custom filename

### 🎨 Modern UI/UX
- Beautiful gradient backgrounds (indigo → purple → pink)
- Glass-morphism effects with backdrop blur
- Responsive design for all devices
- Poppins font for modern typography
- Smooth animations and transitions
- Emoji icons for visual appeal

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcryptjs for password hashing
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Font**: Google Fonts (Poppins)

## 📦 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd family-expense-tracker-next
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `MONGODB_URI` environment variable
4. Deploy!

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database access (username/password)
4. Whitelist your IP or allow access from anywhere (0.0.0.0/0)
5. Get your connection string and add it to environment variables

## 📱 Usage

### Creating a Family Account
1. Click "Add Family" on the landing page
2. Enter family name and email
3. Specify number of family members
4. Enter ages (comma-separated): `35, 32, 8, 5`
5. Enter genders (comma-separated): `m, f, boy, girl`
6. Set a secure password
7. Submit to create your account

### Managing Your Profile
1. Click "Complete Profile" in the header
2. Add income streams (salary, freelance, etc.)
3. Add fixed monthly payments (rent, subscriptions, etc.)
4. Add properties with values and mortgage payments
5. Add loans with monthly amounts and end dates
6. Save your profile

### Adding Daily Expenses
1. Navigate through the calendar using Previous/Next buttons
2. Click on any past or today's date
3. Fill in the expense details:
   - Amount in Euros (€)
   - Select category
   - Select subcategory (appears based on category)
   - Add description
4. Click "Add Expense"
5. View all expenses for that day below the form

### Generating Reports
1. Click "📊 Generate Report" button
2. Select month and year
3. Review the summary and transactions
4. Click "📊 Download PDF Report"
5. PDF will be downloaded with filename: `BullsEye_Report_[Month]_[Year].pdf`

## 🏗️ Project Structure

```
family-expense-tracker-next/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── signup/route.ts
│   │   ├── expenses/route.ts
│   │   └── profile/route.ts
│   ├── dashboard/page.tsx
│   ├── profile/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AuthPage.tsx
│   ├── Dashboard.tsx
│   └── ProfilePage.tsx
├── lib/
│   ├── mongodb.ts
│   └── profileCompletion.ts
├── models/
│   ├── Expense.ts
│   └── Family.ts
├── public/
│   └── logo.png
└── README.md
```

## 🔒 Security Features

- Password hashing with bcryptjs
- Client-side form validation
- Server-side input validation
- MongoDB injection prevention
- Secure session management with localStorage
- Environment variable protection for sensitive data

## 🌍 Currency

The application uses **Euros (€)** as the default currency.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting
- MongoDB for the database
- Tailwind CSS for styling utilities
- Google Fonts for Poppins typography

---

**Hit your money targets with Bull's Eye Economic Target! 🎯**
