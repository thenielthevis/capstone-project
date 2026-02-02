import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import logoImg from '../assets/logo.png';

export default function TermsAndConditions() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-50" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Lifora</h1>
            </Link>

            {/* Back Button */}
            <Link to="/settings">
              <Button variant="ghost" className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
              Terms and Conditions
            </h1>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>1. Introduction</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                Welcome to Lifora ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of the Lifora mobile and web applications, including any content, functionality, and services offered on or through the Lifora platform (collectively, the "Service").
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>2. Acceptance of Terms</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                By creating an account or using Lifora, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using Lifora on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>3. User Accounts</h2>
              <p className="leading-relaxed mb-4" style={{ color: theme.colors.text }}>
                To access certain features of the Service, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: theme.colors.text }}>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                You are responsible for safeguarding your password and any activities or actions under your account. We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
              </p>
            </section>

            {/* Health Information Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>4. Health Information Disclaimer</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                <strong className="font-semibold">IMPORTANT:</strong> Lifora is designed to help you track and manage your wellness journey. However, the Service is not intended to diagnose, treat, cure, or prevent any disease or health condition.
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                The information provided through Lifora, including AI-powered insights and recommendations, is for informational and educational purposes only. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided by Lifora.
              </p>
            </section>

            {/* Use of Service */}
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>5. Use of Service</h2>
              <p className="leading-relaxed mb-4" style={{ color: theme.colors.text }}>
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: theme.colors.text }}>
                <li>Use the Service in any way that violates any applicable law or regulation</li>
                <li>Upload or transmit viruses, malware, or any malicious code</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use any automated system to access the Service without our express written permission</li>
                <li>Impersonate or attempt to impersonate Lifora, a Lifora employee, another user, or any other person or entity</li>
                <li>Use the Service to transmit spam, chain letters, or other unsolicited communications</li>
              </ul>
            </section>

            {/* User-Generated Content */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User-Generated Content</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                You may have the opportunity to post, upload, or submit content, including photos, activity logs, comments, and other materials ("User Content"). You retain ownership of your User Content, but by submitting User Content to Lifora, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such User Content in connection with operating and providing the Service.
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                You represent and warrant that you own or have the necessary rights to submit User Content and that your User Content does not violate any third-party rights or applicable laws.
              </p>
            </section>

            {/* Privacy and Data Protection */}
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>7. Privacy and Data Protection</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                Your privacy is important to us. Our <Link to="/privacy" className="font-semibold underline" style={{ color: theme.colors.primary }}>Privacy Policy</Link> explains how we collect, use, and protect your personal information. By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                The Service and its original content (excluding User Content), features, and functionality are owned by Lifora and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent. You may not use, copy, reproduce, modify, or distribute any content from the Service without our express written permission.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                Lifora may integrate with or contain links to third-party services, websites, or applications. We are not responsible for the content, privacy policies, or practices of any third-party services. You acknowledge and agree that Lifora shall not be liable for any damage or loss caused by your use of any third-party services.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                You may delete your account at any time through the Service settings. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LIFORA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4" style={{ color: theme.colors.text }}>
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
            </section>

            {/* Disclaimer of Warranties */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Disclaimer of Warranties</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. LIFORA DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                We do not warrant that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected. We make no warranties about the accuracy or completeness of the content provided through the Service.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Indemnification</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                You agree to defend, indemnify, and hold harmless Lifora and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your violation of any rights of another party.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="leading-relaxed mt-4" style={{ color: theme.colors.text }}>
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you must stop using the Service.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Governing Law</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Lifora operates, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts of that jurisdiction.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-6 rounded-lg" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, border: '1px solid' }}>
                <p className="font-semibold mb-2" style={{ color: theme.colors.text }}>Lifora Support Team</p>
                <p style={{ color: theme.colors.text }}>Email:</p>
                <Link className="font-semibold underline" style={{ color: theme.colors.primary }} to="mailto:capsproject123@gmail.com">capsproject123@gmail.com</Link>
              </div>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Severability</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Entire Agreement</h2>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Lifora regarding the use of the Service and supersede all prior agreements and understandings, whether written or oral.
              </p>
            </section>
          </div>

          {/* Back to Top */}
          <div className="mt-16 text-center">
            <Link to="/settings">
              <Button size="lg" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                Return to Settings
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8" style={{ backgroundColor: theme.colors.surface, borderTop: `1px solid ${theme.colors.border}` }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center">
            <p className="text-sm" style={{ color: theme.colors.text }}>
              © 2026 Lifora. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
