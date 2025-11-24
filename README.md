# ShopIci

[![Frontend](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Supabase-purple)](https://supabase.com/)

**ShopIci** is a modern peer-to-peer sales platform, allowing users to create accounts, post items, browse listings, and interact with sellers. Built with React, Tailwind CSS, daisyUI, and Supabase for a smooth, responsive experience.

---

## Features

- **User Authentication**: Sign up, login, and manage profiles.  
- **Item Management**: Create, edit, and delete listings with images, descriptions, and categories.  
- **Public Gallery**: Browse all items with search, filters, and sorting.  
- **Item Details**: View full details and seller info.  
- **Messaging**: Contact sellers directly.  
- **Cart Simulation**: Add items to a cart and simulate purchases.  
- **Favorites**: Save items to favorites.  
- **Responsive Design**: Works on desktop and mobile.  

---

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, daisyUI  
- **Backend**: Supabase (PostgreSQL, Auth, Storage)  
- **Database**: PostgreSQL  
- **Hosting**: Vercel (frontend), Supabase (backend)  

---

## Installation

1. Clone the repository:

git clone https://github.com/yourusername/shopici.git
cd shopici

text

2. Install dependencies:

npm install

text

3. Create a `.env` file with your Supabase credentials:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

text

4. Start the development server:

npm run dev

text

5. Open your browser at http://localhost:5173

---

## Folder Structure

src/
├─ components/ # Reusable UI components
├─ pages/ # Login, Signup, Home, etc.
├─ services/ # Supabase client config
├─ App.jsx
└─ main.jsx

text

---

## Usage

- Sign up or login to access full features
- Create or browse items
- Add items to favorites or cart
- Contact sellers via messaging system

---

## Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/YourFeature`)
5. Open a Pull Request
