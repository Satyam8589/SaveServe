"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const statsData = [
    { number: "2.5K+", label: "Meals Saved", icon: "🍽️" },
    { number: "150+", label: "Active Users", icon: "👥" },
    { number: "95%", label: "Waste Reduced", icon: "♻️" },
    { number: "12", label: "Campus Partners", icon: "🏫" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="text-center space-y-8"
          >
            {/* Main Heading */}
            <motion.div variants={itemVariants} className="space-y-4">
              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
                variants={itemVariants}
              >
                <span className="block bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Save Food
                </span>
                <span className="block text-white mt-2">
                  Serve People
                </span>
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Transform campus food waste into community nourishment. Every meal saved is a step towards a sustainable future.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/get-started">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-8 py-4 rounded-full font-semibold text-lg overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 text-white">Start Sharing Food</span>
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full border-2 border-emerald-400/50 text-emerald-400 font-semibold text-lg hover:bg-emerald-400/10 transition-all duration-300"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>

            {/* Floating Food Icons */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="absolute top-20 left-10 text-4xl"
                style={{ animationDelay: "0s" }}
              >
                🥗
              </motion.div>
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="absolute top-32 right-20 text-3xl"
                style={{ animationDelay: "1s" }}
              >
                🍎
              </motion.div>
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="absolute bottom-40 left-20 text-3xl"
                style={{ animationDelay: "2s" }}
              >
                🥖
              </motion.div>
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="absolute bottom-20 right-10 text-4xl"
                style={{ animationDelay: "0.5s" }}
              >
                🍊
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Our Impact
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Together, we&#39;re making a real difference in our campus community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center p-8 rounded-2xl bg-gray-800/80 border border-gray-700/50 backdrop-blur-sm"
              >
                <div className="text-5xl mb-4">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple steps to reduce waste and help your community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Share Surplus",
                description: "List your excess food with details about quantity, freshness, and pickup time",
                icon: "📱",
                color: "from-emerald-500 to-green-500"
              },
              {
                step: "2",
                title: "Get Notified",
                description: "Receive real-time alerts about available food near you with pickup instructions",
                icon: "🔔",
                color: "from-orange-500 to-amber-500"
              },
              {
                step: "3",
                title: "Make Impact",
                description: "Track your environmental impact and see how you're helping build a sustainable campus",
                icon: "🌍",
                color: "from-amber-500 to-yellow-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -8 }}
                className="relative p-8 rounded-2xl bg-gray-800/80 border border-gray-700/50 backdrop-blur-sm overflow-hidden group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-6 text-center">{feature.icon}</div>
                  <div className={`text-sm font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent mb-2`}>
                    STEP {feature.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-900/20 via-orange-900/20 to-amber-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Make a <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">Difference?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students, staff, and organizations working together to create a zero-waste campus community.
            </p>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-12 py-5 rounded-full font-bold text-xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 text-white">Join SaveServe Today</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer Section */}
            <Footer />
    </div>
  );
}