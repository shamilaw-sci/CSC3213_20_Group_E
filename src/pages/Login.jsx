import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import lock from '../assets/lock.jpeg'
import './Login.css'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  return (
    <div className='login-page'>

      <div className='login-left'>
        <h2>Welcome Back to Thirasara Property</h2>

        <label>Your Email</label>
        <input type="email" placeholder="" />

        <label>Password</label>
        <div className='password-box'>
          <input type={showPassword ? "text" : "password"} />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁"}
          </span>
        </div>

        <div className='options'>
          <div className='remember'>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>
          <p className='forgot'>Forgot Password?</p>
        </div>

        <button className='submit-btn'>Login</button>

        <p className='switch-link'>
          New to Thirasara Property ? <span onClick={() => navigate('/signup')}>Create account</span>
        </p>
      </div>

      <div className='login-right'>
        <div className='logo-overlay'>
          <h2>THIRASARA <br /> PROPERTY</h2>
          <img src={logo} alt="" />
        </div>
        <img src={lock} alt="" className='side-image' />
      </div>

    </div>
  )
}

export default Login