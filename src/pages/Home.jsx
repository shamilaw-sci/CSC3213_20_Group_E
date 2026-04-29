import React from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import icon from '../assets/icon.jpg'
import home from '../assets/home.jpeg'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div>
      <nav className='navbar'>
        <div className='logo-section'>
          <img src={logo} alt="" />
          <h2>THIRASARA <br /> PROPERTY</h2>
        </div>
        <ul>
          <li>Home</li>
          <li>Property</li>
          <li>About Us</li>
          <li>Contact Us</li>
          <li>
            <button className='login-btn' onClick={() => navigate('/login')}>Log In</button>
          </li>
          <li>
            <img src={icon} alt="" className='icon-img' />
          </li>
        </ul>
      </nav>

      <div className='hero' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${home})` }}>
        <div className='hero-text'>
          <h1>Find Your Dream <br /> Property</h1>
          <div className='search-box'>
            <span>Select City</span>
            <span>Property Type</span>
            <button className='search-btn'>Search</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home