import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import './Landing.css';
import {
  MapPin,
  Users,
  Camera,
  TrendingUp,
  Award,
  Menu,
  X
} from 'lucide-react';
import MobileMockupCarousel from '@/components/landing/MobileMockupCarousel';

// Data for Features Section
const featuresData = [
  {
    title: "Smart Tracking",
    description: "GPS-powered activity monitoring to track your wellness journey wherever you go.",
    icon: MapPin,
    img: "/src/assets/features/gamified.gif"
  },
  {
    title: "AI Insights",
    description: "Personalized health analytics powered by artificial intelligence to guide your progress.",
    icon: TrendingUp,
    img: "/src/assets/features/nutrition.gif"
  },
  {
    title: "Smart Recognition",
    description: "Automatic food & activity logging using advanced image recognition technology.",
    icon: Camera,
    img: "/src/assets/features/assessment.gif"
  },
  {
    title: "Community Support",
    description: "Connect with like-minded individuals and achieve your goals together.",
    icon: Users,
    img: "/src/assets/features/assessment.gif"
  }
];

// Import images properly using explicit imports with ?url or dynamic imports
import logoImg from '../assets/logo.png';
import team1Img from '../assets/member/team1.jpg';
import team2Img from '../assets/member/team2.jpg';
import team3Img from '../assets/member/team3.png';
import team4Img from '../assets/member/team4.jpg';

const images = {
  logo: logoImg,
  team: {
    member1: team1Img,
    member2: team2Img,
    member3: team3Img,
    member4: team4Img
  }
};

export default function Landing() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  const teamMembers = [
    { name: 'Rene Cian Baloloy', role: 'Backend Developer', img: images.team.member1 },
    { name: 'Rean Joy Cicat', role: 'UI/UX Designer', img: images.team.member2 },
    { name: 'Mark Al Bartolome', role: 'Frontend Developer', img: images.team.member3 },
    { name: 'Daniel Davis', role: 'Full Stack Developer', img: images.team.member4 },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 shadow-sm" style={{ backgroundColor: theme.colors.surface }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={images.logo} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Lifora</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { id: 'home', label: 'Home' },
                { id: 'features', label: 'About Us' },
                { id: 'contact', label: 'Contact' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm font-medium transition-colors"
                  style={{ color: activeSection === item.id ? theme.colors.primary : theme.colors.textSecondary }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/login'}
                className="text-sm font-medium"
              >
                Login
              </Button>
              <Button
                onClick={() => window.location.href = '/register'}
                className="text-sm font-medium rounded-full px-6"
                style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
              >
                Start for free
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
              <nav className="flex flex-col gap-2">
                {['Home', 'About Us', 'Contact'].map((item, index) => (
                  <Button
                    key={item}
                    variant="ghost"
                    onClick={() => scrollToSection(['home', 'features', 'contact'][index])}
                    className="justify-start"
                  >
                    {item}
                  </Button>
                ))}
                <div className="flex flex-col gap-2 pt-2 mt-2" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                    Login
                  </Button>
                  <Button onClick={() => window.location.href = '/register'} style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}>
                    Start for free
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section id="home" className="relative py-20 md:py-28 bg-hero-mesh overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-block">
                    <span className="text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded-full" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.secondary}15 100%)`, color: theme.colors.primary }}>
                      ✨ Your Wellness Companion
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
                    Transform Your Health{' '}
                    <span className="block mt-2 gradient-text">Journey Today</span>
                  </h1>
                  <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-landing-muted">
                    Experience AI-powered health insights, gamified wellness tracking, and supportive community features—all in one intuitive platform.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => window.location.href = '/register'}
                    className="text-base h-14 px-8 rounded-full font-medium shadow-lg btn-cta"
                    style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
                  >
                    REGISTER NOW
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-section-dark">
          <div className="container mx-auto px-6 lg:px-12">
            {/* Features Title */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Our Key Features
              </h2>
              <p className="text-lg text-landing-muted">
                Discover the powerful tools that make your wellness journey effective and engaging.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
              {featuresData.map((feature, index) => (
                <div
                  key={index}
                  className="group p-8 rounded-2xl landing-card feature-card-dark"
                >
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center icon-box-glow shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
                      {React.createElement(feature.icon, {
                        className: "w-7 h-7 text-white"
                      })}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="leading-relaxed text-landing-muted">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Mobile Showcase Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase" style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                    Lifora Mobile App
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                    Wellness in the <span style={{ color: theme.colors.primary }}>Palm of Your Hand</span>
                  </h2>
                  <p className="text-lg leading-relaxed text-landing-muted">
                    Take your wellness journey anywhere. Our mobile application provides a seamless,
                    gamified experience with features designed to keep you motivated.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    { title: 'Interactive Avatars', desc: 'Sync your progress with a unique 3D avatar that reflects your health status.' },
                    { title: 'Real-time GPS Tracking', desc: 'Map your outdoor activities with precision and relive your routes.' },
                    { title: 'Program Coach', desc: 'Get personalized workout programs tailored to your goals.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-500">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-sm text-landing-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px] -z-10"></div>

                <MobileMockupCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 md:py-28 bg-section-secondary">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-5xl mx-auto space-y-12">
              {/* About Header */}
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>About Lifora</h2>
                <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-landing-muted">
                  We are dedicated to transforming personal health by making wellness an engaging and insightful journey.
                  Our platform combines gamification, nutritional tracking, and daily assessments to empower you with the knowledge
                  and motivation to achieve your health goals.
                </p>
              </div>

              {/* Mission, Vision, Values */}
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Our Mission',
                    content: 'To provide accessible and comprehensive wellness solutions through innovative technology.',
                    icon: MapPin
                  },
                  {
                    title: 'Our Vision',
                    content: 'To revolutionize personal health management through engaging, technology-driven solutions.',
                    icon: TrendingUp
                  },
                  {
                    title: 'Our Values',
                    content: 'Innovation, accessibility, and user empowerment drive our commitment.',
                    icon: Award
                  }
                ].map((item, index) => (
                  <div key={index} className="p-8 rounded-2xl shadow-lg landing-card">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
                      {React.createElement(item.icon, {
                        className: "w-7 h-7 text-white"
                      })}
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: theme.colors.text }}>{item.title}</h3>
                    <p className="leading-relaxed text-landing-muted">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Team Section */}
        <section id="contact" className="py-20 md:py-28 bg-section-primary">
          <div className="container mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
                Meet Our Team
              </h2>
              <p className="text-lg text-landing-muted">
                The amazing people behind Lifora, dedicated to your wellness journey
              </p>
            </div>

            {/* Team Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-0">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-member-card group">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/80 to-transparent p-6">
                    <div className="text-white">
                      <div className="text-xs font-semibold text-blue-300 mb-1">{member.role}</div>
                      <h3 className="text-lg font-bold">{member.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-cta-gradient">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Start Your Wellness Journey with Lifora Today
              </h2>
              <p className="text-xl leading-relaxed text-landing-muted">
                No credit card required. Join us in transforming your health.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => window.location.href = '/register'}
                  className="text-base h-14 px-10 border-2 rounded-full font-semibold btn-cta"
                  style={{ borderColor: '#FFFFFF', backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
                >
                  Sign Up
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('features')}
                  className="text-base h-14 px-10 border-2 rounded-full font-semibold btn-cta"
                  style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ backgroundColor: theme.colors.card, color: theme.colors.textSecondary }}>
          <div className="container mx-auto px-6 lg:px-12 py-16">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              {/* Logo and Brand Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <img src={images.logo} alt="Lifora Logo" className="w-8 h-8" />
                  <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Lifora</h3>
                </div>
                <p className="text-sm leading-relaxed">
                  Embrace a Healthier You—Strong, Resilient, Future-Ready
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-bold mb-4" style={{ color: theme.colors.text }}>Quick Links</h4>
                <ul className="space-y-3">
                  {[
                    { id: 'home', label: 'Home' },
                    { id: 'about', label: 'About Us' },
                    { id: 'contact', label: 'Contact' }
                  ].map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className="text-sm hover:text-blue-400 transition-colors"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                  <li>
                    <Link to="/terms" className="text-sm hover:text-blue-400 transition-colors">
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h4 className="font-bold mb-4" style={{ color: theme.colors.text }}>Connect</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://github.com/thenielthevis/capstone-project"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@lifora.com"
                      className="text-sm transition-colors"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Email
                    </a>
                  </li>
                </ul>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="font-bold mb-4" style={{ color: theme.colors.text }}>Built With</h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Tailwind', 'Vite'].map((tech) => (
                    <span key={tech} className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: theme.colors.background, color: theme.colors.textSecondary }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm">
                  © 2025 Lifora. All rights reserved.
                </p>
                <div className="flex gap-6">
                  <a href="#" className="text-sm hover:text-blue-400 transition-colors">
                    Privacy Policy
                  </a>
                  <Link to="/terms" className="text-sm hover:text-blue-400 transition-colors">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
