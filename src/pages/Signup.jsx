import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import handshake from '../assets/handshake.jpeg'
import './Signup.css'

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  return (
    <div className='signup-page'>

      <div className='signup-left'>
        <div className='logo-overlay'>
          <img src={logo} alt="" />
          <h2>THIRASARA <br /> PROPERTY</h2>
        </div>
        <img src={handshake} alt="" className='side-image' />
      </div>

      <div className='signup-right'>
        <div className='form-box'>
          <h1>Create Account</h1>

          <label>Your Name</label>
          <input type="text" />

          <label>Your Email</label>
          <input type="email" />

          <label>Password</label>
          <div className='password-box'>
            <input type={showPassword ? "text" : "password"} />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button className='submit-btn'>Create</button>

          <p className='switch-link'>
            Already have an account? <span onClick={() => navigate('/login')}>Log In</span>
          </p>
        </div>
      </div>

    </div>
  )
}

export default Signup