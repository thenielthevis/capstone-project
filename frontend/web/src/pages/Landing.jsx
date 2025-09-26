import React, { useState } from 'react';
import './Landing.css';

// Data para sa Features Section
const featuresData = [
  { 
    title: "Gamified", 
    description: "Engage in a fun, interactive experience that turns health goals into rewarding challenges.", 
    img: "/src/assets/features/gamified.gif" 
  },
  { 
    title: "Nutritional Tracking", 
    description: "Easily track your daily food intake and gain valuable insights into your nutrition.", 
    img: "/src/assets/features/nutrition.gif" 
  },
  { 
    title: "Daily Assessment", 
    description: "Receive personalized daily assessments to monitor your progress and identify health trends.", 
    img: "/src/assets/features/assessment.gif" 
  }
];

const images = {
  logo: './src/assets/logo.png',
  team: {
    member1: './src/assets/member/team1.jpg',
    member2: './src/assets/member/team2.jpg',
    member3: './src/assets/member/team3.png',
    member4: './src/assets/member/team4.jpg',
    professor: './src/assets/member/prof.jpg'
  }
};

export default function Landing() {
  const [activeSection, setActiveSection] = useState('home');
  const [showLogin, setShowLogin] = useState(true);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(sectionId);
  };

  const teamMembers = [
    { name: 'Rene Cian Baloloy', role: 'Backend Developer', img: images.team.member1 },
    { name: 'Rean Joy Cicat', role: 'UI/UX Designer', img: images.team.member2 },
    { name: 'Mark Al Bartolome', role: 'Frontend Developer', img: images.team.member3 },
    { name: 'Daniel Davis', role: 'Full Stack Developer', img: images.team.member4 },
  ];

  const professor = { name: 'Mrs. Madriaga Pops', role: 'Project Supervisor', img: images.team.professor };

  return (
    <div className="min-h-screen w-full bg-[#F0F3FA] overflow-x-hidden">
     
      <header className="fixed w-full bg-[#395886] text-white z-50 py-1">
        <div className="max-w-6xl mx-auto px-4 w-full">
          <div className="flex justify-between items-center h-6">
            <div className="flex items-center space-x-1.5">
              <img 
                src={images.logo} 
                alt="Lifora Logo" 
                className="h-3.5 w-3.5 object-contain"
              />
              <h1 className="text-sm font-semibold text-[#F0F3FA]">Lifora</h1>
            </div>
            <div className="flex items-center space-x-10">
              {['home', 'features', 'about', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize text-xs transition-colors ${
                    activeSection === item 
                      ? 'text-[#F0F3FA] border-b border-[#F0F3FA]' 
                      : 'text-[#D5DEEF] hover:text-[#F0F3FA] border-b border-transparent'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowLogin(true)}
                className={`px-3 py-0.5 rounded-full text-xs transition-colors ${
                  showLogin 
                    ? 'bg-[#F0F3FA] text-[#395886]' 
                    : 'text-[#D5DEEF] hover:text-[#F0F3FA]'
                }`}
              >
                Login
              </button>
              <button 
                onClick={() => setShowLogin(false)}
                className={`px-3 py-0.5 rounded-full text-xs transition-colors ${
                  !showLogin 
                    ? 'bg-[#F0F3FA] text-[#395886]' 
                    : 'text-[#D5DEEF] hover:text-[#F0F3FA]'
                }`}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* Home Section */}
        <section id="home" className="min-h-screen w-full flex items-center justify-center pt-16 bg-gradient-to-b from-[#F0F3FA] via-[#F0F3FA] to-[#B1C9EF]">
          <div className="max-w-6xl mx-auto px-4 w-full py-20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="lg:w-1/2 text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#395886] mb-6 leading-tight">
                  Gamifying Wellness: Track, Assess, and Thrive Every Day
                </h1>
                <p className="text-lg text-[#628ECB] mb-8">
                  Lifora uses AI to provide predictive health insights and preventive wellness solutions, helping you stay ahead of potential health risks and optimize your well-being.
                </p>
                <button className="w-full sm:w-auto bg-[#395886] text-white px-8 py-3 rounded-full font-bold hover:bg-[#628ECB] transition-all duration-300 transform hover:scale-105 shadow-lg">
                  JOIN NOW!
                </button>
              </div>
              <div className="lg:w-1/2 w-full mt-10 lg:mt-0">
                <img 
                  src="/assets/a.glb.png"
                  alt="Wellness illustration" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

       {/* Features Section */}
        <section id="features" className="w-full flex items-center justify-center py-20 bg-[#F0F3FA]">
          <div className="max-w-6xl mx-auto px-4 w-full">
            {/* Features Title */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#395886] mb-4">
                Transform Your Health Journey
              </h2>
              <p className="text-xl text-[#628ECB] max-w-3xl mx-auto">
                Experience a revolutionary approach to wellness with our cutting-edge features designed to make your health journey engaging and effective.
              </p>
            </div>

            {/* Features Cards */}
            <div className="flex flex-row flex-wrap justify-center gap-8">
              {featuresData.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-[32px] p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group w-[380px]"
                >
                  <div className="flex flex-col h-full">
                    <h3 className="text-3xl font-bold text-[#40A870] mb-4">{feature.title}</h3>
                    <p className="text-[#628ECB] text-lg mb-8 flex-grow">
                      {feature.description}
                    </p>
                    <div className="flex justify-center w-full">
                      <div className="w-32 h-32">
                        <img 
                          src={feature.img} 
                          alt={feature.title} 
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="w-full flex items-center justify-center py-20 bg-[#D5DEEF]">
          <div className="max-w-6xl mx-auto px-4 w-full text-center">
            <h2 className="text-4xl font-bold text-[#395886] mb-4">About Lifora</h2>
            <p className="text-lg text-[#628ECB] mb-12 max-w-4xl mx-auto">
              We are dedicated to transforming personal health by making wellness an engaging and insightful journey. 
              Our platform combines gamification, nutritional tracking, and daily assessments to empower you with the knowledge 
              and motivation to achieve your health goals.
            </p>
            <div className="flex flex-row flex-wrap justify-center gap-6">
              {[
                { title: 'Our Mission', content: 'To provide accessible and comprehensive wellness solutions through innovative technology.' },
                { title: 'Our Vision', content: 'To revolutionize personal health management through engaging, technology-driven solutions.' },
                { title: 'Our Values', content: 'Innovation, accessibility, and user empowerment drive our commitment.' }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group w-[350px]">
                  <div className="h-2 bg-[#395886] rounded-full mb-4 transform origin-left transition-all duration-300 group-hover:scale-x-110"></div>
                  <h3 className="text-xl font-bold text-[#395886] mb-3">{item.title}</h3>
                  <p className="text-[#628ECB]">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
  N==

        {/* Contact Section */}
        <section id="contact" className="w-full flex items-center justify-center py-20 bg-[#F0F3FA]">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h2 className="text-4xl font-bold text-[#395886] text-center mb-4">For Any Concerns or Inquiries</h2>
            <p className="text-lg text-[#628ECB] text-center mb-12">
              Have questions or need assistance? Get in touch with us today!
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
              {/* Email Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#40A870] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#395886] mb-2">Email Us</h3>
                  <a href="mailto:FutureProof@gmail.com" className="text-[#628ECB] hover:text-[#40A870] transition-colors">
                    FutureProof@gmail.com
                  </a>
                </div>
              </div>

              {/* Call Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#40A870] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#395886] mb-2">Call Us</h3>
                  <a href="tel:+18001234567" className="text-[#628ECB] hover:text-[#40A870] transition-colors">
                    +1 (800) 123-4567
                  </a>
                </div>
              </div>

              {/* Visit Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#40A870] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#395886] mb-2">Visit Us</h3>
                  <p className="text-[#628ECB] text-center">
                    123 Greenway Blvd, Suite 456
                  </p>
                </div>
              </div>
            </div>

            {/* Team Section Title */}
            <h2 className="text-4xl font-bold text-[#395886] text-center mt-20 mb-16">Meet Our Team</h2>
            
            <div className="flex flex-row flex-wrap justify-center gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group w-[280px]">
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                    <img 
                      src={member.img} 
                      alt={member.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-[#395886] bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <p className="text-white font-semibold text-center px-4 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#395886] text-center group-hover:text-[#628ECB] transition-colors duration-300">
                    {member.name}
                  </h3>
                </div>
              ))}
            </div>

            <h2 className="text-4xl font-bold text-[#395886] text-center mt-20 mb-16">Our Professor</h2>
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group w-[280px]">
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                  <img 
                    src={professor.img} 
                    alt={professor.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-[#395886] bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white font-semibold text-center px-4 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {professor.role}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#395886] text-center group-hover:text-[#628ECB] transition-colors duration-300">
                  {professor.name}
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#395886] text-white py-16 mt-20" style={{ borderTopLeftRadius: '110px', borderTopRightRadius: '110px' }}>
          <div className="max-w-6xl mx-auto px-8">
            {/* Logo and Brand Section */}
            <div className="flex items-center justify-center mb-12">
              <div className="text-center">
                <img src={images.logo} alt="Lifora Logo" className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Lifora</h3>
                <p className="opacity-80">Embrace a Healthier You—Strong, Resilient, Future-Ready</p>
              </div>
            </div>

            {/* Links Section */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-8 max-w-2xl mx-auto text-center">
              {/* Quick Links */}
              <div>
                <h4 className="text-xl font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="#about" onClick={(e) => {e.preventDefault(); scrollToSection('about')}} className="opacity-80 hover:opacity-100 transition-opacity">About</a></li>
                  <li><a href="#features" onClick={(e) => {e.preventDefault(); scrollToSection('features')}} className="opacity-80 hover:opacity-100 transition-opacity">Features</a></li>
                  <li><a href="#contact" onClick={(e) => {e.preventDefault(); scrollToSection('contact')}} className="opacity-80 hover:opacity-100 transition-opacity">Contact</a></li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h4 className="text-xl font-bold mb-4">Connect</h4>
                <ul className="space-y-2">
                  <li><a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">GitHub</a></li>
                  <li><a href="mailto:contact@lifora.com" className="opacity-80 hover:opacity-100 transition-opacity">Email</a></li>
                </ul>
              </div>
            </div>

            {/* Technologies Section */}
            <div className="mt-16 text-center">
              <h4 className="text-xl font-bold mb-6">Technologies We Used</h4>
              <div className="flex justify-center items-center gap-6 flex-wrap">
                {/* Add your technology icons here */}
                {/* Example: */}
                <img src="/path-to-react-icon.png" alt="React" className="h-8 w-8 opacity-80 hover:opacity-100 transition-opacity" />
                {/* Add more technology icons as needed */}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}