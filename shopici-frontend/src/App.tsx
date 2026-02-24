import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NavBar from './components/NavBar.tsx'
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/SignUp.tsx';
import Profile from './pages/Profile.tsx';
import Products from './pages/Products.tsx';
import MyProducts from './pages/MyProducts.tsx';
import ProductDetails from './pages/ProductDetails.tsx';
import Cart from './pages/Cart';
import { CartProvider } from './contexts/CartContext';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div data-theme="shopici" className="min-h-screen">
      <CartProvider>
      <Router>
        <NavBar />
        <div className="relative">
          <Routes>
            {/* Define your routes here */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<Products />} />
            <Route path="/my-products" element={<MyProducts />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </div>
      </Router>
      </CartProvider>
    </div>
  )
}

export default App
