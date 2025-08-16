"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Icon Components
const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const QuestionMarkIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const BookIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const HelpSupportPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ loading: false, message: '', type: '' });

  const faqs = [
    {
      question: "How do I complete my profile?",
      answer: "To complete your profile, click on the 'Edit Profile' button on your profile page and fill in all required fields including phone number, campus location, and any role-specific information."
    },
    {
      question: "What are the different user roles?",
      answer: "We have two main roles: CONSUMER (students and staff who need meals) and PROVIDER (canteens, hostels, event organizers, and NGOs who can provide meals)."
    },
    {
      question: "How do I update my information?",
      answer: "You can update your information anytime by going to your profile page and clicking the 'Edit Profile' button. Changes are saved immediately."
    },
    {
      question: "What if I forgot my password?",
      answer: "Since we use Clerk authentication, you can reset your password through the sign-in page by clicking 'Forgot Password' and following the instructions."
    },
    {
      question: "How do I deactivate my account?",
      answer: "Currently, account deactivation must be done through our support team. Please contact us using the form below or email us directly."
    },
    {
      question: "Why can't I see certain features?",
      answer: "Some features may be role-specific or require a complete profile. Make sure your profile is fully filled out and that you're signed in to access all features."
    }
  ];

  const contactOptions = [
    {
      icon: MailIcon,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "support@foodshare.com",
      action: "Send Email"
    },
    {
      icon: ChatIcon,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available 9 AM - 6 PM",
      action: "Start Chat"
    },
    {
      icon: PhoneIcon,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      contact: "+1 (555) 123-4567",
      action: "Call Now"
    }
  ];

  const handleFaqToggle = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ loading: true, message: 'Sending message...', type: 'info' });

    // Simulate API call
    setTimeout(() => {
      setFormStatus({ loading: false, message: 'Message sent successfully! We\'ll get back to you soon.', type: 'success' });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 animate-fade-in">
            <Link 
              href="/profile" 
              className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-gray-700/50 transform hover:scale-105"
            >
              <ArrowLeftIcon />
              <span>Back to Profile</span>
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Help & Support
              </h1>
              <p className="text-gray-300 mt-2 text-lg">
                Get the help you need
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* FAQ Section */}
            <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-up">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <QuestionMarkIcon />
                </div>
                <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-600/30 rounded-lg overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <button
                      onClick={() => handleFaqToggle(index)}
                      className="w-full text-left px-6 py-4 bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-between"
                    >
                      <span className="font-medium text-white">{faq.question}</span>
                      <svg
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 py-4 bg-gray-700/20 border-t border-gray-600/30 animate-fade-in">
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={contactForm.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={contactForm.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    required
                    value={contactForm.subject}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-500"
                    placeholder="What's this about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-500 resize-none"
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {formStatus.loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
              
              {formStatus.message && (
                <div className={`mt-4 p-4 rounded-lg text-center font-medium animate-fade-in ${
                  formStatus.type === 'success' 
                    ? 'bg-green-900/50 text-green-300 border border-green-700/50' 
                    : formStatus.type === 'error'
                    ? 'bg-red-900/50 text-red-300 border border-red-700/50'
                    : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                }`}>
                  {formStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Options */}
            <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right">
              <h3 className="text-xl font-bold text-white mb-6">Contact Options</h3>
              <div className="space-y-4">
                {contactOptions.map((option, index) => (
                  <div key={index} className="p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-200 border border-gray-600/30 transform hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <option.icon />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{option.title}</h4>
                        <p className="text-sm text-gray-300 mb-2">{option.description}</p>
                        <p className="text-sm text-blue-400 font-medium">{option.contact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right" style={{ animationDelay: '200ms' }}>
              <h3 className="text-xl font-bold text-white mb-6">Quick Links</h3>
              <div className="space-y-3">
                {[
                  { icon: BookIcon, label: "User Guide", href: "#" },
                  { icon: QuestionMarkIcon, label: "Community Forum", href: "#" },
                  { icon: MailIcon, label: "Report a Bug", href: "#" },
                  { icon: ChatIcon, label: "Feature Requests", href: "#" }
                ].map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-gray-600/50 transform hover:scale-105 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <link.icon />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right" style={{ animationDelay: '400ms' }}>
              <h3 className="text-xl font-bold text-white mb-4">Support Hours</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Monday - Friday</span>
                  <span className="text-white">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Saturday</span>
                  <span className="text-white">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Sunday</span>
                  <span className="text-red-400">Closed</span>
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-blue-300 text-xs">
                    <strong>Note:</strong> Emergency support is available 24/7 through email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-right {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HelpSupportPage;