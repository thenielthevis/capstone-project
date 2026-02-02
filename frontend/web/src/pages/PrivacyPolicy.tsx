import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import logoImg from '../assets/logo.png';

export default function PrivacyPolicy() {
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
                            Privacy Policy
                        </h1>
                    </div>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none space-y-8">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>1. Introduction</h2>
                            <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                At Lifora, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
                                Please also read our <Link to="/terms" className="font-semibold underline" style={{ color: theme.colors.primary }}>Terms & Conditions</Link> for more information about our services.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>2. Information We Collect</h2>
                            <p className="leading-relaxed mb-4" style={{ color: theme.colors.text }}>
                                To provide our core wellness and health-tracking services, we collect various types of information:
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>Personal Data</h3>
                                    <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                        Account information including username, email address, and profile details provided during registration.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>Physical Metrics</h3>
                                    <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                        Basic physiological data used for calorie and health calculations:
                                    </p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: theme.colors.text }}>
                                        <li>Age and Gender</li>
                                        <li>Height and Weight (including Target Weight)</li>
                                        <li>Body Mass Index (BMI)</li>
                                        <li>Waist Circumference</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>Lifestyle and Dietary Profile</h3>
                                    <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                        Information regarding your daily habits and nutrition:
                                    </p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: theme.colors.text }}>
                                        <li>Activity Levels (Sedentary to Extremely Active)</li>
                                        <li>Sleep Duration and Quality</li>
                                        <li>Dietary Preferences (e.g., Vegan, Vegetarian, Gluten-free)</li>
                                        <li>Food Allergies and Daily Water Intake</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>Health Profile and Status</h3>
                                    <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                        Detailed health context for accurate wellness insights:
                                    </p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: theme.colors.text }}>
                                        <li>Current Medical Conditions and Family History</li>
                                        <li>Medications and Blood Type</li>
                                        <li>Environmental exposure and Occupational factors</li>
                                        <li>Stress levels and related risk behaviors</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* How We Use Information */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>3. How We Use Your Information</h2>
                            <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4" style={{ color: theme.colors.text }}>
                                <li>Generate personalized health analysis and disease risk predictions</li>
                                <li>Track and visualize your fitness progress through avatars and dashboards</li>
                                <li>Calculate daily calorie goals and monitor nutritional balance</li>
                                <li>Maintain our gamified wellness system (batteries and coins)</li>
                                <li>Improve our machine learning models for better accuracy</li>
                            </ul>
                        </section>

                        {/* Data Protection */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>4. Data Protection and Security</h2>
                            <p className="leading-relaxed" style={{ color: theme.colors.text }}>
                                We implement robust security measures to protect your sensitive health data. This includes administrative, technical, and physical safeguards. However, please be aware that no system is 100% secure. We encourage users to use strong passwords and maintain the confidentiality of their account credentials.
                            </p>
                        </section>

                        {/* Contact Information */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>5. Contact Information</h2>
                            <p className="leading-relaxed mb-4" style={{ color: theme.colors.text }}>
                                If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
                            </p>
                            <div className="mt-4 p-6 rounded-lg" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, border: '1px solid' }}>
                                <p className="font-semibold mb-2" style={{ color: theme.colors.text }}>Lifora Support Team</p>
                                <p style={{ color: theme.colors.text }}>Email:</p>
                                <Link className="font-semibold underline" style={{ color: theme.colors.primary }} to="mailto:capsproject123@gmail.com">capsproject123@gmail.com</Link>
                            </div>
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-20 pt-12 border-t text-center" style={{ borderColor: theme.colors.border }}>
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
