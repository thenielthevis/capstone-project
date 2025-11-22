import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#395886] text-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm opacity-80">
            &copy; {new Date().getFullYear()} Lifora. All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm opacity-70 hover:opacity-100">
            <a 
              href="mailto:contact@lifora.com" 
              className="hover:text-[#D5DEEF] transition-colors"
            >
              Contact
            </a>
            <span>|</span>
            <a 
              href="#" 
              className="hover:text-[#D5DEEF] transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}