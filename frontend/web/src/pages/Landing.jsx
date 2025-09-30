import React from 'react';
import { Link } from 'react-router-dom';
import wellnessGif from '../assets/wellness.gif';
import assessmentGif from '../assets/features/assessment.gif';
import gamifiedGif from '../assets/features/gamified.gif';
import nutritionGif from '../assets/features/nutrition.gif';
import team1 from '../assets/member/team1.jpg';
import team2 from '../assets/member/team2.jpg';
import team3 from '../assets/member/team3.png';
import team4 from '../assets/member/team4.jpg';
import prof from '../assets/member/prof.jpg';
import logo from '../assets/logo.png';

export default function Landing() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main data-theme="light" className="min-h-screen w-full bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-base-300">
        <div className="navbar-start">
          <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('home')}>
            <img src={logo} alt="Lifora Logo" className="w-10 h-10 mr-3" />
            <span className="text-2xl font-bold text-primary">Lifora</span>
          </div>
        </div>
        <div className="navbar-center flex gap-6">
          <button 
            onClick={() => scrollToSection('features')} 
            className="flex flex-col items-center gap-1 p-2 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium">Features</span>
          </button>
          <button 
            onClick={() => scrollToSection('about')} 
            className="flex flex-col items-center gap-1 p-2 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">About</span>
          </button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className="flex flex-col items-center gap-1 p-2 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Contact</span>
          </button>
        </div>
        <div className="navbar-end gap-2">
          <Link to="/login" className="btn btn-outline btn-primary hover:bg-primary hover:text-white transition-all duration-200">Login</Link>
          <Link to="/register" className="btn btn-primary text-white shadow-lg hover:shadow-xl transition-all duration-200">Register</Link>
        </div>
      </div>

      {/* Home Section */}
      <section id="home" className="hero min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-6 text-base-content">
              Gamifying Wellness: Track, Assess, and Thrive Every Day
            </h1>
            <p className="text-xl mb-8 text-base-content/90">
              Lifora uses AI to provide predictive health insights and preventive wellness solutions, 
              helping you stay ahead of potential health risks and optimize your well-being.
            </p>
            <button className="btn btn-primary btn-lg text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">JOIN NOW!</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-base-200/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-base-content">Transform Your Health Journey</h2>
            <p className="text-xl text-base-content/80 max-w-3xl mx-auto">
              Experience a revolutionary approach to wellness with our cutting-edge features designed to make your health journey engaging and effective.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={gamifiedGif} alt="Gamified" className="rounded-xl h-full w-full object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Gamified</h2>
                <p className="text-base-content/80">Engage in a fun, interactive experience that turns health goals into rewarding challenges.</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={nutritionGif} alt="Nutritional Tracking" className="rounded-xl h-full w-full object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Nutritional Tracking</h2>
                <p className="text-base-content/80">Easily track your daily food intake and gain valuable insights into your nutrition.</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={assessmentGif} alt="Daily Assessment" className="rounded-xl h-full w-full object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Daily Assessment</h2>
                <p className="text-base-content/80">Receive personalized daily assessments to monitor your progress and identify health trends.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-base-content">About Lifora</h2>
            <p className="text-xl text-base-content/80 max-w-4xl mx-auto">
              We are dedicated to transforming personal health by making wellness an engaging and insightful journey. 
              Our platform combines gamification, nutritional tracking, and daily assessments to empower you with the 
              knowledge and motivation to achieve your health goals.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="card-title justify-center text-primary mb-2">Our Mission</h2>
                <p className="text-base-content/80">To provide accessible and comprehensive wellness solutions through innovative technology.</p>
              </div>
            </div>
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="card-title justify-center text-secondary mb-2">Our Vision</h2>
                <p className="text-base-content/80">To revolutionize personal health management through engaging, technology-driven solutions.</p>
              </div>
            </div>
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="card-title justify-center text-accent mb-2">Our Values</h2>
                <p className="text-base-content/80">Innovation, accessibility, and user empowerment drive our commitment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-base-200/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-base-content">For Any Concerns or Inquiries</h2>
            <p className="text-xl text-base-content/80">
              Have questions or need assistance? Get in touch with us today!
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="card-title text-primary mb-2">Email Us</h2>
                <p className="text-base-content/80">FutureProof@gmail.com</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h2 className="card-title text-secondary mb-2">Call Us</h2>
                <p className="text-base-content/80">+1 (800) 123-4567</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="card-title text-accent mb-2">Visit Us</h2>
                <p className="text-base-content/80">123 Greenway Blvd, Suite 456</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-base-content">Meet Our Team</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={team1} alt="Rene Cian Baloloy" className="rounded-xl w-32 h-32 object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Rene Cian Baloloy</h2>
                <p className="text-sm text-base-content/80">Backend Developer</p>
              </div>
            </div>
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={team2} alt="Rean Joy Cicat" className="rounded-xl w-32 h-32 object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Rean Joy Cicat</h2>
                <p className="text-sm text-base-content/80">UI/UX Designer</p>
              </div>
            </div>
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={team3} alt="Mark Al Bartolome" className="rounded-xl w-32 h-32 object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Mark Al Bartolome</h2>
                <p className="text-sm text-base-content/80">Frontend Developer</p>
              </div>
            </div>
            <div className="card bg-base-200/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <figure className="px-10 pt-10">
                <img src={team4} alt="Daniel Davis" className="rounded-xl w-32 h-32 object-cover" />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-primary">Daniel Davis</h2>
                <p className="text-sm text-base-content/80">Full Stack Developer</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
          </div>
        </div>
      </section>
    </main>
  );
}