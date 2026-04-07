import { Suspense, lazy, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import './App.css'
import NavBar from './components/NavBar.tsx'
import Loader from './components/Loader';
import { CartProvider } from './contexts/CartContext';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/SignUp'));
const Profile = lazy(() => import('./pages/Profile'));
const Products = lazy(() => import('./pages/Products'));
const MyProducts = lazy(() => import('./pages/MyProducts'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Chat = lazy(() => import('./pages/Chat'));
const Conversation = lazy(() => import('./pages/Conversation'));
const Cart = lazy(() => import('./pages/Cart'));
const MyFavorites = lazy(() => import('./pages/MyFavorites'));
const FavoriteCollection = lazy(() => import('./pages/FavoriteCollection'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <div data-theme="shopici" className="min-h-screen">
      <CartProvider>
      <Router>
        <NavBar />
        <div className="relative">
          <Suspense fallback={<Loader />}> {/* Affiche le loader pendant le chargement */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/products" element={<Products />} />
              <Route path="/my-products" element={<MyProducts />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/conversations/:id" element={<Conversation />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/my-favorites" element={<MyFavorites />} />
              <Route path="/collections/:id" element={<FavoriteCollection />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
      </CartProvider>
    </div>
  )
}

export default App
