import React from 'react';
import {
  Leaf,
  Users,
  Globe,
  Heart,
  Target,
  TrendingUp,
  Clock,
  MapPin,
  Bell,
  BarChart3,
  Calendar,
  CheckCircle,
  Utensils,
  Package,
  Award,
  Shield,
  Lightbulb,
  Zap,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: <Utensils className="w-8 h-8" />,
      title: "Surplus Food Listing",
      description: "Canteens and event organizers can easily list excess food with detailed information about type, quantity, and freshness status.",
      gradient: "from-emerald-500 to-green-400"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Real-Time Notifications",
      description: "Instant notifications to students, staff, and NGOs about available food with pickup windows and locations.",
      gradient: "from-blue-500 to-blue-400"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Food Safety Tagging",
      description: "Advanced safety features with time-based freshness tracking and automatic expiry management for food quality assurance.",
      gradient: "from-purple-500 to-purple-400"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Impact Analytics",
      description: "Comprehensive dashboard showing environmental impact, carbon footprint reduction, and community impact statistics.",
      gradient: "from-orange-500 to-orange-400"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Event Integration",
      description: "Seamless integration with campus events and calendars for automatic food logging reminders after events.",
      gradient: "from-pink-500 to-pink-400"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Smart Coordination",
      description: "Intelligent pickup coordination system that optimizes routes and timing for maximum efficiency.",
      gradient: "from-teal-500 to-teal-400"
    }
  ];

  const stats = [
    { number: "95%", label: "Waste Reduction", icon: <Leaf className="w-6 h-6" /> },
    { number: "500+", label: "Meals Saved Daily", icon: <Utensils className="w-6 h-6" /> },
    { number: "1000+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { number: "50+", label: "Campus Partners", icon: <Globe className="w-6 h-6" /> }
  ];

  const teamMembers = [
    {
      name: "Development Team",
      role: "Full-Stack Development",
      description: "Creating innovative solutions for sustainable food management",
      icon: <Zap className="w-8 h-8" />
    },
    {
      name: "Campus Partners",
      role: "Food Providers",
      description: "Canteens, hostels, and event organizers working towards zero waste",
      icon: <Users className="w-8 h-8" />
    },
    {
      name: "Community Leaders",
      role: "Impact Champions",
      description: "Students and staff leading the sustainability movement on campus",
      icon: <Award className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-green-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent leading-tight">
                About Our Mission
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                Building a sustainable future through smart surplus food redistribution and zero-waste campus initiatives
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center space-x-3 text-emerald-400">
                <Target className="w-6 h-6" />
                <span className="text-lg font-semibold">Zero Waste Goal</span>
              </div>
              <div className="flex items-center space-x-3 text-green-400">
                <Heart className="w-6 h-6" />
                <span className="text-lg font-semibold">Community Impact</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-400">
                <Globe className="w-6 h-6" />
                <span className="text-lg font-semibold">Sustainable Future</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl mb-6">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-6">Our Vision</h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Every day, campus canteens, hostels, and event venues discard large amounts of edible but unused food due to lack of coordination, awareness, and systematic redistribution. We're building a smart, sustainable platform that enables tracking, redistribution, and responsible management of surplus food across campus communities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-400/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Leaf className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-100">Sustainability</h3>
                  <p className="text-gray-400">Reducing environmental impact through smart food waste management</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-100">Community</h3>
                  <p className="text-gray-400">Connecting food providers with those who need nutritious meals</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-2xl flex items-center justify-center mx-auto">
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-100">Innovation</h3>
                  <p className="text-gray-400">Leveraging technology to create efficient redistribution systems</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Making a real difference in campus communities through sustainable food redistribution
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-6 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-emerald-900/10 hover:to-gray-900">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-400 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(stat.icon, { className: "w-6 h-6 text-white" })}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Comprehensive tools and features designed to make food redistribution seamless and efficient
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 transition-all duration-300 hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-emerald-900/5 hover:to-gray-900">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {React.cloneElement(feature.icon, { className: "w-8 h-8 text-white" })}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-4 group-hover:text-emerald-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">How It Works</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              A simple, three-step process that connects surplus food with hungry communities
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Line - Hidden on mobile */}
            <div className="hidden lg:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400/40 to-emerald-500/20 rounded-full"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
              {[
                {
                  step: "01",
                  title: "List Surplus Food",
                  description: "Food providers post details about available surplus food including quantity, location, type, and safe consumption timeframe.",
                  icon: <Package className="w-10 h-10" />,
                  color: "emerald"
                },
                {
                  step: "02",
                  title: "Smart Matching",
                  description: "Our system automatically notifies registered users about nearby available food and coordinates optimal pickup times.",
                  icon: <Zap className="w-10 h-10" />,
                  color: "blue"
                },
                {
                  step: "03",
                  title: "Collect & Impact",
                  description: "Users collect fresh meals while contributing to waste reduction and environmental sustainability goals.",
                  icon: <Heart className="w-10 h-10" />,
                  color: "purple"
                }
              ].map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="relative z-10 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 transition-all duration-300 hover:border-emerald-500/30">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-${step.color}-500 to-${step.color}-400 rounded-2xl mb-6 shadow-lg relative`}>
                      {React.cloneElement(step.icon, { className: "w-10 h-10 text-white" })}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 border-2 border-emerald-400 rounded-full flex items-center justify-center">
                        <span className="text-emerald-400 text-sm font-bold">{step.step}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-4">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                  
                  {/* Arrow - Only show between steps on large screens */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-20 -right-4 z-20">
                      <ArrowRight className="w-8 h-8 text-emerald-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">Our Community</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              A diverse group of innovators, educators, and sustainability champions working together for a zero-waste future
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-emerald-900/5 hover:to-gray-900">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {React.cloneElement(member.icon, { className: "w-8 h-8 text-white" })}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                  {member.name}
                </h3>
                <div className="text-emerald-400 font-semibold mb-4">{member.role}</div>
                <p className="text-gray-400 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-100">Get Involved</h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                Join our mission to create a sustainable, zero-waste campus community. Whether you're a food provider, student, or sustainability advocate, there's a place for you in our movement.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-400/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">Email Us</h3>
                  <p className="text-gray-400">contact@smartsurplus.edu</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Phone className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">Call Us</h3>
                  <p className="text-gray-400">+1 (555) 123-4567</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-2xl flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">Join Community</h3>
                  <p className="text-gray-400">Campus Sustainability Group</p>
                </div>
              </div>

              <div className="mt-12">
                <button className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold">
                  Start Your Impact Journey
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}