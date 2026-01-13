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
import Catalog from './pages/Catalog.tsx';
import MyProducts from './pages/MyProducts.tsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div data-theme="shopici" className="min-h-screen">
      <Router>
        <NavBar />
        <div className="relative">
          <Routes>
            {/* Define your routes here */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/my-products" element={<MyProducts />} />
          </Routes>
        </div>
      </Router>
    </div>
  )
}

export default App
