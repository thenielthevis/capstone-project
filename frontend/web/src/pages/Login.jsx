import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', formData);
    // For now, just navigate to home
    navigate('/');
  };

  return (
    <main data-theme="light" className="min-h-screen w-full bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-base-300">
        <div className="navbar-start">
          <Link to="/" className="flex items-center cursor-pointer">
            <img src={logo} alt="Lifora Logo" className="w-10 h-10 mr-3" />
            <span className="text-2xl font-bold text-primary">Lifora</span>
          </Link>
        </div>
        <div className="navbar-center flex gap-6">
          <Link 
            to="/#features" 
            className="flex flex-col items-center gap-1 p-2 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium">Features</span>
          </Link>
          <Link 
            to="/#about" 
            className="flex flex-col items-center gap-1 p-2 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">About</span>
          </Link>
          <Link 
            to="/#contact" 
            className="flex flex-col items-center gap-1 p-2 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Contact</span>
          </Link>
        </div>
        <div className="navbar-end gap-2">
          <Link to="/login" className="btn btn-outline btn-primary hover:bg-primary hover:text-white transition-all duration-200">Login</Link>
          <Link to="/register" className="btn btn-primary text-white shadow-lg hover:shadow-xl transition-all duration-200">Register</Link>
        </div>
      </div>

      {/* Login Section */}
      <section className="hero min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="hero-content flex-col lg:flex-row-reverse max-w-6xl w-full">
          {/* Welcome Message */}
          <div className="text-center lg:text-left lg:w-1/2">
            <h1 className="text-5xl font-bold text-base-content mb-6">
              Welcome Back to <span className="text-primary">Lifora</span>
            </h1>
            <p className="text-xl text-base-content/90 mb-8">
              Continue your wellness journey with personalized health insights and gamified wellness tracking.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base-content/80">Track your daily wellness progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base-content/80">Get AI-powered health insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base-content/80">Earn rewards for healthy habits</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="card bg-base-100 w-full max-w-md shadow-2xl lg:w-1/2">
            <form className="card-body" onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-base-content">Sign In</h2>
                <p className="text-base-content/70 mt-2">Enter your credentials to access your account</p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full focus:input-primary" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Enter your password"
                  className="input input-bordered w-full focus:input-primary" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
                <label className="label">
                  <a href="#" className="label-text-alt link link-hover text-primary">Forgot password?</a>
                </label>
              </div>

              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Sign In
                </button>
              </div>

              <div className="divider">OR</div>

              <div className="form-control">
                <button type="button" className="btn btn-outline gap-2 hover:bg-base-200 transition-all duration-200">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-base-content/70">
                  Don't have an account? 
                  <Link to="/register" className="link link-primary font-medium ml-1">Sign up here</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
