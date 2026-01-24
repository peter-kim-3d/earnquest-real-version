/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */

import { Sparkle, Target, Heart, TrendUp, Users, Shield, Lightning, Medal } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';

export default function PamphletPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8f6] via-white to-[#f6f8f6]">
      {/* Hero Section with Family Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2bb800] via-[#25a000] to-[#1d8500] text-white pt-6 pb-24 px-6">
        {/* Navigation Header */}
        <nav className="max-w-6xl mx-auto mb-12 relative z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm p-1">
                <Image src="/logo.png" alt="EarnQuest" width={32} height={32} />
              </div>
              <span className="font-display text-xl font-bold text-white">EarnQuest</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/manual" className="text-white/80 hover:text-white transition-colors font-medium">
                Manual
              </a>
              <Link href="/en-US/login" className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-full text-white font-semibold backdrop-blur-sm transition-all">
                Login
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center md:text-left">
              <div className="inline-block mb-6">
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm p-3 shadow-lg">
                  <Image src="/logo.png" alt="EarnQuest" width={80} height={80} />
                </div>
              </div>
              <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                EarnQuest
              </h1>
              <p className="text-2xl md:text-3xl font-light mb-6 opacity-95">
                Growing Habits, Shining Rewards
              </p>
              <p className="text-lg md:text-xl font-body opacity-90 leading-relaxed mb-8">
                Transform family routines into exciting adventures. Watch your children develop lifelong habits through motivation, trust, and positive reinforcement.
              </p>
              <Link href="/en-US/signup" className="inline-block bg-white text-[#2bb800] px-10 py-4 rounded-full text-lg font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-xl">
                Get Started Free
              </Link>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <Image
                  src="/images/pamphlet/gemini/hero-family-celebration-by-gemini.png"
                  alt="Happy family celebrating achievements with EarnQuest"
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </section>

      {/* Core Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-[#121811] mb-6">
            Why Families Love EarnQuest
          </h2>
          <p className="text-xl text-[#688961] max-w-2xl mx-auto">
            A complete motivation system that makes good habits feel like an achievement
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-center text-[#121811] mb-12">
            Simple. Powerful. Effective.
          </h2>

          {/* Journey Infographic */}
          <div className="mb-16 flex justify-center">
            <div className="relative max-w-4xl w-full">
              <Image
                src="/images/pamphlet/gemini/journey-infographic.png-by-gemini.png"
                alt="Your Journey: Tasks → Points → Rewards"
                width={1200}
                height={600}
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <StepCard key={index} {...step} number={index + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#2bb800]/10 via-white to-[#0ea5e9]/10 rounded-3xl p-12 md:p-20 shadow-xl">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-[#121811] mb-16 text-center">
            Designed by Psychology,<br />Built for Families
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {benefits.map((benefit, index) => (
              <BenefitItem key={index} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-[#2bb800] mb-4">95%</div>
              <div className="text-xl text-[#688961]">Task Completion Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#2bb800] mb-4">10K+</div>
              <div className="text-xl text-[#688961]">Happy Families</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#2bb800] mb-4">50%</div>
              <div className="text-xl text-[#688961]">Less Parent-Child Conflict</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#2bb800] via-[#25a000] to-[#1d8500] text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-5xl md:text-6xl font-bold mb-8">
            Start Your Family's Quest Today
          </h2>
          <p className="text-2xl mb-12 opacity-95">
            Join thousands of families building better habits together
          </p>
          <Link href="/en-US/signup" className="inline-block bg-white text-[#2bb800] px-16 py-5 rounded-full text-xl font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-2xl">
            Get Started Free
          </Link>
          <p className="mt-8 text-sm opacity-75">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#132210] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="EarnQuest" width={40} height={40} />
                <h3 className="font-display text-2xl font-bold">EarnQuest</h3>
              </div>
              <p className="text-[#688961]">Growing habits, shining rewards</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-[#688961]">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-[#688961]">
                <li><a href="/manual" className="hover:text-white transition-colors">User Manual</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#688961]/30 pt-8 text-center text-[#688961] text-sm">
            © 2026 EarnQuest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group">
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="font-display text-2xl font-bold text-[#121811] mb-4">
        {title}
      </h3>
      <p className="text-[#688961] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Step Card Component
function StepCard({ number, title, description }: any) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2bb800] to-[#229900] text-white text-3xl font-bold flex items-center justify-center mx-auto mb-8 shadow-lg">
        {number}
      </div>
      <h3 className="font-display text-3xl font-bold text-[#121811] mb-5">
        {title}
      </h3>
      <p className="text-[#688961] leading-relaxed text-lg">
        {description}
      </p>
    </div>
  );
}

// Benefit Item Component
function BenefitItem({ icon: Icon, title, description }: any) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#2bb800]/10 flex items-center justify-center">
          <Icon size={28} className="text-[#2bb800]" />
        </div>
      </div>
      <div>
        <h4 className="font-display text-2xl font-bold text-[#121811] mb-3">
          {title}
        </h4>
        <p className="text-[#688961] text-lg leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// Data
const features = [
  {
    icon: Target,
    title: "Smart Task System",
    description: "Age-appropriate tasks that grow with your child. From homework to chores, everything in one place with automatic reminders.",
    color: "from-[#2bb800] to-[#229900]"
  },
  {
    icon: Sparkle,
    title: "Motivating Rewards",
    description: "Screen time, experiences, and privileges that kids actually want. Turn motivation into meaningful rewards.",
    color: "from-[#0ea5e9] to-[#0284c7]"
  },
  {
    icon: Heart,
    title: "Kindness Recognition",
    description: "Special system to celebrate acts of kindness and pro-social behavior. Build empathy while building habits.",
    color: "from-[#f49d25] to-[#dc8b1e]"
  },
  {
    icon: TrendUp,
    title: "Trust Levels",
    description: "Gradually increase autonomy as your child proves responsibility. Watch them grow more independent over time.",
    color: "from-[#8b5cf6] to-[#7c3aed]"
  },
  {
    icon: Users,
    title: "Family Dashboard",
    description: "One place for all family members. Track progress, approve tasks, and celebrate wins together.",
    color: "from-[#ec4899] to-[#db2777]"
  },
  {
    icon: Shield,
    title: "Age-Appropriate",
    description: "Carefully designed presets for ages 5-14. The right balance of challenge and achievability for every stage.",
    color: "from-[#14b8a6] to-[#0d9488]"
  }
];

const steps = [
  {
    title: "Set Up Tasks",
    description: "Choose from age-appropriate presets or customize your own. Set points, approval methods, and schedules in minutes."
  },
  {
    title: "Kids Complete",
    description: "Children see their tasks, complete them, and request approval. Clear, visual, and motivating interface designed for kids."
  },
  {
    title: "Earn & Redeem",
    description: "Points accumulate automatically. Kids browse the store and redeem rewards they've earned. Teaching responsibility and delayed gratification."
  }
];

const benefits = [
  {
    icon: Lightning,
    title: "Instant Motivation",
    description: "Turn \"I don't want to\" into \"I can't wait to!\" with gamified progress tracking and visual rewards."
  },
  {
    icon: Medal,
    title: "Build Real Skills",
    description: "Responsibility, time management, and delayed gratification - habits that last a lifetime."
  },
  {
    icon: Heart,
    title: "Strengthen Bonds",
    description: "Reduce conflicts over tasks and screen time. Spend more quality time enjoying each other's company."
  },
  {
    icon: Shield,
    title: "Science-Backed",
    description: "Based on behavioral psychology and positive reinforcement. Proven techniques for lasting behavior change."
  }
];
