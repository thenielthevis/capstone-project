import React from 'react';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    
    <footer className="footer sm:footer-horizontal bg-base-200 text-base-content p-10" data-theme="light">
      <aside>
        <img
          src={logo}
          alt="Lifora Logo"
          width="50"
          height="50"
          className="fill-current"
        />
        <p>
          <strong>Lifora</strong>
          <br />
          Embrace a Healthier You, Strong, Resilient, Future-Ready
        </p>
      </aside>
      <nav>
        <h6 className="footer-title">Quick Links</h6>
        <a className="link link-hover">About</a>
        <a className="link link-hover">Features</a>
        <a className="link link-hover">Contact</a>
      </nav>
      <nav>
        <h6 className="footer-title">Connect</h6>
        <a className="link link-hover">GitHub</a>
        <a className="link link-hover">Email</a>
        <a className="link link-hover">Phone</a>
      </nav>
      <nav>
        <h6 className="footer-title">Copyright</h6>
        <p>© 2024 Lifora. All rights reserved.</p>
      </nav>
    </footer>
  );
};

export default Footer;