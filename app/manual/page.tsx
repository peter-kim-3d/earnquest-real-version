/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { Users, Baby, Settings, Gift, Heart, CheckCircle, Home, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current section index for navigation
  const currentIndex = sections.findIndex(s => s.id === activeSection);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
  const currentSection = sections[currentIndex];

  const navigateTo = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8f6] to-white">
      {/* Header */}
      <header className="bg-white border-b border-[#2bb800]/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="EarnQuest" width={40} height={40} />
            <div>
              <h1 className="font-display text-2xl font-bold text-[#121811]">EarnQuest Manual</h1>
              <p className="text-sm text-[#688961]">Complete guide for families</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/pamphlet" className="text-[#688961] hover:text-[#121811] font-medium flex items-center gap-2 transition-colors">
              <Home className="w-4 h-4" aria-hidden="true" />
              Home
            </a>
            <Link href="/en-US/login" className="bg-[#2bb800] hover:bg-[#229900] px-5 py-2 rounded-full text-white font-semibold transition-all">
              Login
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Mobile Contents Toggle */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full bg-white rounded-2xl shadow-lg border border-[#2bb800]/20 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#2bb800] to-[#25a000] flex items-center justify-center">
                {currentSection && <currentSection.icon className="w-5 h-5 text-white" />}
              </div>
              <div className="text-left">
                <p className="text-xs text-[#688961]">Currently viewing</p>
                <p className="font-semibold text-[#121811]">{currentSection?.title}</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#688961] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <nav className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-lg border border-[#2bb800]/10 p-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#688961]/10">
                <div className="w-2 h-2 rounded-full bg-[#2bb800]" />
                <h3 className="font-display font-bold text-[#121811] text-sm uppercase tracking-wide">Contents</h3>
              </div>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => navigateTo(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-[#2bb800] to-[#25a000] text-white shadow-md'
                          : 'text-[#688961] hover:bg-[#f6f8f6]'
                      }`}
                    >
                      <section.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {/* Sidebar Navigation - Desktop */}
        <aside className="w-64 flex-shrink-0 sticky top-24 h-fit hidden md:block">
          <nav className="bg-gradient-to-br from-white to-[#f6f8f6] rounded-2xl p-6 shadow-card border border-[#2bb800]/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#2bb800]" />
              <h3 className="font-display font-bold text-[#121811] text-sm uppercase tracking-wide">Contents</h3>
            </div>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-[#2bb800] to-[#25a000] text-white shadow-md'
                        : 'text-[#688961] hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <section.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-0">
          <div className="bg-white rounded-2xl p-6 md:p-12 shadow-card">
            {activeSection === 'getting-started' && <GettingStarted />}
            {activeSection === 'parent-guide' && <ParentGuide />}
            {activeSection === 'child-guide' && <ChildGuide />}
            {activeSection === 'tasks' && <TasksGuide />}
            {activeSection === 'rewards' && <RewardsGuide />}
            {activeSection === 'kindness' && <KindnessGuide />}
            {activeSection === 'settings' && <SettingsGuide />}

            {/* Bottom Navigation */}
            <div className="mt-12 pt-8 border-t border-[#688961]/20">
              <div className="flex items-center justify-between gap-4">
                {/* Previous */}
                {prevSection ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(prevSection.id)}
                    className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-[#688961]/20 hover:border-[#2bb800] hover:bg-[#2bb800]/5 transition-all group text-left"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#688961] group-hover:text-[#2bb800] flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#688961]">Previous</p>
                      <p className="font-semibold text-[#121811] truncate">{prevSection.title}</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Current Page Indicator */}
                <div className="hidden md:flex items-center gap-1">
                  {sections.map((section, index) => (
                    <button
                      type="button"
                      key={section.id}
                      onClick={() => navigateTo(section.id)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-6 bg-[#2bb800]'
                          : 'bg-[#688961]/30 hover:bg-[#688961]/50'
                      }`}
                      title={section.title}
                    />
                  ))}
                </div>

                {/* Next */}
                {nextSection ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(nextSection.id)}
                    className="flex-1 flex items-center justify-end gap-3 p-4 rounded-xl border border-[#688961]/20 hover:border-[#2bb800] hover:bg-[#2bb800]/5 transition-all group text-right"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-[#688961]">Next</p>
                      <p className="font-semibold text-[#121811] truncate">{nextSection.title}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#688961] group-hover:text-[#2bb800] flex-shrink-0" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Section Components
function GettingStarted() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Getting Started with EarnQuest</h1>
      <p className="text-xl text-[#688961] mb-8">Welcome to EarnQuest! Let's set up your family in minutes.</p>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mb-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2">What You'll Need</h3>
        <ul className="space-y-2 text-[#688961]">
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" aria-hidden="true" />
            <span>5 minutes of time</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" aria-hidden="true" />
            <span>Google or email account</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" aria-hidden="true" />
            <span>Your child's name and birthdate</span>
          </li>
        </ul>
      </div>

      <Section title="Parent Sign Up">
        <p className="text-[#688961] mb-4">Three ways to create your parent account:</p>
        <ul className="space-y-2 text-[#688961]">
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" aria-hidden="true" />
            <div><strong>Google OAuth</strong> - One-click sign up with your Google account</div>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" aria-hidden="true" />
            <div><strong>Email + Password</strong> - Traditional sign up with email confirmation</div>
          </li>
        </ul>
      </Section>

      <Section title="4-Step Onboarding">
        <StepItem
          number={1}
          title="Add Your Children"
          description="Enter each child's name and birthdate. The system automatically assigns an age group:"
          items={[
            "🐣 Mini Earners (5-7 years) - Simple tasks, lots of encouragement",
            "🚀 Pro Earners (8-11 years) - Balanced challenge and responsibility",
            "🎓 Teen Earners (12-14 years) - More autonomy and complex tasks"
          ]}
        />

        <StepItem
          number={2}
          title="Select Your Style"
          description="Choose a task preset and optional add-on modules:"
          items={[
            "🌱 Starter (5 tasks, ~70 daily XP) - Minimal set for building habits gradually",
            "⭐ Balanced (8 tasks, ~125 daily XP) - Recommended for most families",
            "📖 Learning Focus (6 tasks, ~110 daily XP) - Academic emphasis"
          ]}
        />

        <div className="bg-[#f6f8f6] rounded-xl p-4 ml-14 mb-6">
          <p className="text-sm text-[#688961] font-medium mb-2">Optional Add-on Modules:</p>
          <ul className="text-sm text-[#688961] space-y-1">
            <li>🧼 <strong>Hygiene Routine</strong> - Brush teeth, wash hands, shower</li>
            <li>💪 <strong>Fitness</strong> - Exercise and outdoor play</li>
            <li>🎵 <strong>Hobby</strong> - Practice instrument, art/craft</li>
          </ul>
        </div>

        <StepItem
          number={3}
          title="Family Values"
          description="Toggle family values that appear as daily reminders (optional). Examples: Gratitude, Greetings, Honesty, Respect, Clean Spaces."
        />

        <StepItem
          number={4}
          title="Complete & Launch"
          description="Review your setup summary and start using EarnQuest! You can always adjust tasks and rewards later from the dashboard."
        />
      </Section>

      <Section title="Child Login Setup">
        <p className="text-[#688961] mb-4">After onboarding, set up child access:</p>
        <ol className="space-y-3 text-[#688961]">
          <li>1. Go to <strong>Settings → Device Connection</strong> to find your 6-character family code</li>
          <li>2. (Optional) Enable <strong>PIN Protection</strong> and set a 4-digit PIN for each child</li>
          <li>3. On the child's device, go to the child login page and enter the family code</li>
          <li>4. Select the child's profile (and enter PIN if required)</li>
        </ol>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-10">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#0ea5e9]" aria-hidden="true" />
          Pro Tip
        </h3>
        <p className="text-[#688961]">
          Start with just 3-5 tasks in the first week. Once your child is comfortable with the routine, you can gradually add more tasks and increase complexity.
        </p>
      </div>
    </div>
  );
}

function ParentGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Parent Guide</h1>
      <p className="text-xl text-[#688961] mb-8">Everything you need to manage your family's EarnQuest experience.</p>

      <Section title="Dashboard Overview">
        <p className="text-[#688961] mb-4">Your dashboard shows everything at a glance:</p>
        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-bold text-[#121811] mb-2">⚡ Active Tasks</h4>
            <p className="text-sm text-[#688961]">Total tasks currently active for your family</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <h4 className="font-bold text-[#121811] mb-2">🔔 Pending Approvals</h4>
            <p className="text-sm text-[#688961]">Tasks waiting for your review</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-bold text-[#121811] mb-2">📈 Weekly XP</h4>
            <p className="text-sm text-[#688961]">Total family points earned this week</p>
          </div>
        </div>
        <p className="text-[#688961]">The <strong>Action Center</strong> shows all pending task completions. You can approve tasks individually or use batch approval to handle multiple tasks at once.</p>
      </Section>

      <Section title="Managing Tasks">
        <SubSection title="Creating a Task">
          <ol className="space-y-3 text-[#688961]">
            <li>1. Go to <strong>Tasks</strong> page and click "New Task"</li>
            <li>2. Fill in task details:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• <strong>Task name</strong> and optional description</li>
                <li>• <strong>Icon or image</strong> - Choose from library or upload custom</li>
                <li>• <strong>Category</strong> - 📚 Learning, 🏡 Life Skills, or ❤️ Health</li>
                <li>• <strong>Time context</strong> - ☀️ Morning, 🏠 After School, 🌙 Evening, or 📚 Anytime</li>
                <li>• <strong>Points</strong> - 5 to 500 XP (use slider)</li>
              </ul>
            </li>
            <li>3. Set frequency: Daily, Weekly (specific days), Monthly, or One Time</li>
            <li>4. Choose approval method and assign to children</li>
          </ol>
        </SubSection>

        <SubSection title="Approval Methods">
          <ul className="space-y-3 text-[#688961]">
            <li className="flex gap-3">
              <span className="text-xl">👤</span>
              <div>
                <strong>Parent</strong> - You manually review and approve each completion
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">⏱️</span>
              <div>
                <strong>Timer</strong> - Child runs a timer (1-180 mins), auto-completes when done. Points auto-calculate at 1.5 XP/minute.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">✓</span>
              <div>
                <strong>Checklist</strong> - Child checks off sub-steps, then submits for your approval
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <strong>Auto</strong> - Auto-approves after 24 hours (use sparingly for trusted tasks)
              </div>
            </li>
          </ul>
        </SubSection>
      </Section>

      <Section title="Action Center">
        <p className="text-[#688961] mb-4">Handle task approvals efficiently:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>Confirm Complete</strong> - Approve the task and award XP</li>
          <li>• <strong>Request Fix</strong> - Send feedback and ask child to redo (choose from quick fixes or write custom message)</li>
          <li>• <strong>Batch Approve</strong> - Select multiple tasks and approve all at once</li>
        </ul>
      </Section>

      <Section title="Managing Rewards">
        <SubSection title="Reward Categories">
          <div className="grid md:grid-cols-2 gap-3 my-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <strong>📺 Screen Time</strong>
              <p className="text-sm text-[#688961]">Digital device time with built-in timer</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <strong>🔓 Power Ups</strong>
              <p className="text-sm text-[#688961]">Instant redemption (e.g., skip a chore)</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <strong>🎉 Fun Stuff</strong>
              <p className="text-sm text-[#688961]">Experiences you fulfill manually</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3">
              <strong>💰 Savings</strong>
              <p className="text-sm text-[#688961]">Points deducted instantly (virtual savings)</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <strong>🎁 Gift Cards</strong>
              <p className="text-sm text-[#688961]">Physical items you provide later</p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Pending Tickets">
          <p className="text-[#688961]">When children purchase rewards, you may need to:</p>
          <ul className="space-y-1 text-[#688961] mt-2">
            <li>• <strong>Approve Use Request</strong> - For screen time rewards, child requests to start timer</li>
            <li>• <strong>Mark as Given</strong> - For physical rewards/experiences you've fulfilled</li>
          </ul>
        </SubSection>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2">Best Practices</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Keep tasks age-appropriate and achievable</li>
          <li>✓ Balance different task categories and time contexts</li>
          <li>✓ Respond to task approvals within 24 hours</li>
          <li>✓ Review and adjust point values monthly</li>
          <li>✓ Use the "Gift to Child" feature to reward spontaneous good behavior</li>
        </ul>
      </div>
    </div>
  );
}

function ChildGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Guide for Kids</h1>
      <p className="text-xl text-[#688961] mb-8">Learn how to complete quests, earn XP, and get awesome rewards!</p>

      <Section title="Your Quest Dashboard">
        <p className="text-[#688961] mb-4">When you log in, you'll see your personal dashboard with:</p>
        <ul className="space-y-3 text-[#688961]">
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <strong>Your XP Balance</strong> - Quest Points you've earned and can spend
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <strong>Day Streak</strong> - How many days in a row you've completed tasks
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <strong>Weekly Goal</strong> - Progress bar showing how close you are to your weekly XP target
            </div>
          </li>
        </ul>

        <SubSection title="Task Tabs">
          <div className="grid md:grid-cols-3 gap-3 my-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <strong>📋 To Do</strong>
              <p className="text-sm text-[#688961]">Tasks ready to complete</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <strong>⏳ Parent Checking</strong>
              <p className="text-sm text-[#688961]">Waiting for approval</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <strong>✅ Completed</strong>
              <p className="text-sm text-[#688961]">Done for today!</p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Task Groups">
          <p className="text-[#688961]">Tasks are organized by when to do them:</p>
          <ul className="text-[#688961] mt-2 space-y-1">
            <li>☀️ <strong>Morning</strong> - Before school tasks</li>
            <li>🏠 <strong>After School</strong> - When you get home</li>
            <li>🌙 <strong>Evening</strong> - Before bedtime</li>
            <li>📚 <strong>Anytime</strong> - Do these whenever you want</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="Completing Tasks">
        <p className="text-[#688961] mb-4">Here's how to complete tasks and earn XP:</p>

        <StepItem number={1} title="Pick a Task" description="Choose a task from your 'To Do' list" />
        <StepItem number={2} title="Do the Task" description="Complete the activity! Do your best work." />
        <StepItem number={3} title="Mark Complete" description="Tap the task card. For timer tasks, the timer runs automatically. For checklist tasks, check off each step." />
        <StepItem number={4} title="Get Your XP!" description="If it's auto-approved, you get XP right away. Otherwise, wait for your parent to approve it." />

        <div className="bg-orange-50 rounded-xl p-4 mt-4">
          <p className="text-sm text-[#688961]"><strong>⚠️ Needs Attention:</strong> If a parent asks you to fix something, it will show at the top of your task list with their feedback.</p>
        </div>
      </Section>

      <Section title="The Reward Store">
        <p className="text-[#688961] mb-4">Spend your hard-earned XP on rewards!</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>Wallet Card</strong> - Shows your current XP balance</li>
          <li>• <strong>Screen Time Budget</strong> - See how much screen time you have left today/this week</li>
          <li>• <strong>Reward Cards</strong> - Browse and buy rewards (green = can afford, gray = need more XP)</li>
        </ul>
        <p className="text-[#688961] mt-4">When you buy a reward, it becomes a <strong>Ticket</strong> that goes to your "My Tickets" page.</p>
      </Section>

      <Section title="My Tickets">
        <p className="text-[#688961] mb-4">Tickets are rewards you've purchased:</p>
        <div className="grid md:grid-cols-2 gap-3 my-4">
          <div className="bg-green-50 rounded-lg p-3">
            <strong>✨ Active</strong>
            <p className="text-sm text-[#688961]">Ready to use</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <strong>⏳ Waiting</strong>
            <p className="text-sm text-[#688961]">Waiting for parent approval</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <strong>▶️ Playing</strong>
            <p className="text-sm text-[#688961]">Screen time running now</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <strong>✅ Used</strong>
            <p className="text-sm text-[#688961]">Already enjoyed!</p>
          </div>
        </div>
        <p className="text-[#688961]">For screen time rewards, tap "Use Now" to start a fullscreen timer. When time's up, you'll hear a sound!</p>
      </Section>

      <div className="bg-[#f49d25]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">🌟 Kindness Badges</h3>
        <p className="text-[#688961] mb-3">
          Check your <strong>Badges</strong> page to see gratitude cards from your family! Collect cards to earn badges:
        </p>
        <ul className="text-[#688961] space-y-1">
          <li>🥉 <strong>Bronze Badge</strong> - 5 cards</li>
          <li>🥈 <strong>Silver Badge</strong> - 10 cards</li>
          <li>🥇 <strong>Gold Badge</strong> - 20 cards</li>
        </ul>
      </div>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-6">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">Tips for Success 💪</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Check your tasks every morning</li>
          <li>✓ Do morning tasks before school</li>
          <li>✓ Complete timer tasks fully - don't skip!</li>
          <li>✓ Save XP for bigger rewards (check Goals!)</li>
          <li>✓ Ask for help if a task is too hard</li>
        </ul>
      </div>
    </div>
  );
}

function TasksGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Task System Guide</h1>
      <p className="text-xl text-[#688961] mb-8">Deep dive into how tasks work in EarnQuest.</p>

      <Section title="Task Categories">
        <p className="text-[#688961] mb-4">Every task belongs to one of three main categories:</p>
        <div className="grid md:grid-cols-3 gap-6 my-6">
          <div className="bg-[#2bb800]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">📚 Learning</h4>
            <p className="text-[#688961] text-sm">Homework, reading, educational apps, writing practice, check planner</p>
          </div>
          <div className="bg-[#0ea5e9]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">🏡 Life Skills</h4>
            <p className="text-[#688961] text-sm">Make bed, put away backpack, prep for tomorrow, clean desk, organize</p>
          </div>
          <div className="bg-[#f49d25]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">❤️ Health</h4>
            <p className="text-[#688961] text-sm">Brush teeth, shower, exercise, outdoor play, hygiene routines</p>
          </div>
        </div>
      </Section>

      <Section title="Time Contexts">
        <p className="text-[#688961] mb-4">Tasks are organized by when they should be done:</p>
        <div className="grid md:grid-cols-4 gap-4 my-6">
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <span className="text-2xl">☀️</span>
            <h4 className="font-bold text-[#121811] mt-2">Morning</h4>
            <p className="text-xs text-[#688961]">Before school</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <span className="text-2xl">🏠</span>
            <h4 className="font-bold text-[#121811] mt-2">After School</h4>
            <p className="text-xs text-[#688961]">When home</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <span className="text-2xl">🌙</span>
            <h4 className="font-bold text-[#121811] mt-2">Evening</h4>
            <p className="text-xs text-[#688961]">Before bed</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <span className="text-2xl">📚</span>
            <h4 className="font-bold text-[#121811] mt-2">Anytime</h4>
            <p className="text-xs text-[#688961]">Flexible</p>
          </div>
        </div>
      </Section>

      <Section title="XP Values Guide">
        <p className="text-[#688961] mb-4">Recommended XP values based on task difficulty and time:</p>
        <ul className="space-y-3 text-[#688961]">
          <li><strong>10-20 XP</strong> - Quick tasks (5-10 mins): Lunchbox to sink, wash hands</li>
          <li><strong>20-30 XP</strong> - Medium tasks (10-20 mins): Make bed, brush teeth, clean desk</li>
          <li><strong>30-50 XP</strong> - Longer tasks (20-40 mins): Put away items, prep for tomorrow</li>
          <li><strong>50-60 XP</strong> - Major tasks (40+ mins): Homework, reading time, practice instrument</li>
        </ul>
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-[#688961]"><strong>Timer tasks:</strong> Points auto-calculate at ~1.5 XP per minute</p>
        </div>
      </Section>

      <Section title="Frequency Options">
        <p className="text-[#688961] mb-4">Tasks can repeat automatically:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>☀️ Daily</strong> - Task appears every day</li>
          <li>• <strong>📅 Weekly</strong> - Choose specific days (Mon, Wed, Fri, etc.)</li>
          <li>• <strong>📆 Monthly</strong> - Once per month (anytime, specific date, first/last day)</li>
          <li>• <strong>⚡ One Time</strong> - Single occurrence, then done</li>
        </ul>
      </Section>

      <Section title="Trust Levels">
        <p className="text-[#688961] mb-4">As your child proves responsibility, their trust level increases:</p>
        <div className="space-y-4">
          <div className="border-l-4 border-gray-300 pl-4">
            <strong className="text-[#121811]">Level 1 (Starting Out)</strong>
            <p className="text-[#688961] text-sm mt-1">All tasks require parent approval. Default for new children.</p>
          </div>
          <div className="border-l-4 border-[#0ea5e9] pl-4">
            <strong className="text-[#121811]">Level 2 (Building Trust)</strong>
            <p className="text-[#688961] text-sm mt-1">Simple routine tasks can auto-approve.</p>
          </div>
          <div className="border-l-4 border-[#2bb800] pl-4">
            <strong className="text-[#121811]">Level 3 (Trusted)</strong>
            <p className="text-[#688961] text-sm mt-1">Most tasks auto-approve. Child has proven consistent responsibility.</p>
          </div>
        </div>
        <p className="text-sm text-[#688961] mt-4">Trust level is visible in the child's profile page and affects which approval methods are available.</p>
      </Section>

      <Section title="Task Templates">
        <p className="text-[#688961] mb-4">EarnQuest includes 18 pre-built task templates organized by time:</p>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#688961]">
            <div>
              <strong className="text-[#121811]">Morning:</strong> Wake up on time, Make bed, Brush teeth
            </div>
            <div>
              <strong className="text-[#121811]">After School:</strong> Put away backpack, Lunchbox to sink, Check planner
            </div>
            <div>
              <strong className="text-[#121811]">Evening:</strong> Prep for tomorrow, Brush teeth, Shower
            </div>
            <div>
              <strong className="text-[#121811]">Anytime:</strong> Homework, Reading, Exercise, Practice instrument
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function RewardsGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Reward Store Guide</h1>
      <p className="text-xl text-[#688961] mb-8">Create motivating rewards that your kids will love.</p>

      <Section title="Reward Categories">
        <p className="text-[#688961] mb-4">Six categories with different fulfillment behaviors:</p>
        <div className="space-y-6">
          <RewardType
            icon="📺"
            title="Screen Time"
            description="Digital device time with built-in timer. Child requests to use → Parent approves → Timer starts automatically."
            examples={[
              "30 minutes iPad time - 100 XP",
              "1 hour video game time - 150 XP",
              "Watch a movie - 200 XP"
            ]}
          />

          <RewardType
            icon="🔓"
            title="Power Ups"
            description="Instant redemption rewards. Points deducted immediately, no approval needed."
            examples={[
              "Skip one chore today - 100 XP",
              "Stay up 30 mins late - 120 XP",
              "Extra dessert - 50 XP"
            ]}
          />

          <RewardType
            icon="🎉"
            title="Fun Stuff"
            description="Experiences you fulfill manually. Child purchases → Parent marks as 'Given' when done."
            examples={[
              "Choose family movie - 150 XP",
              "Friend sleepover - 300 XP",
              "Trip to ice cream shop - 200 XP"
            ]}
          />

          <RewardType
            icon="💰"
            title="Savings"
            description="Virtual savings category. Points deducted instantly. Great for teaching delayed gratification."
            examples={[
              "Save for vacation fund - 500 XP",
              "Birthday party upgrade - 1000 XP"
            ]}
          />

          <RewardType
            icon="🎁"
            title="Gift Cards"
            description="Physical items you provide later. Child purchases → You give the item when ready."
            examples={[
              "Small toy ($5-10) - 250 XP",
              "New book - 200 XP",
              "$10 gift card - 500 XP"
            ]}
          />
        </div>
      </Section>

      <Section title="Screen Time Budget">
        <p className="text-[#688961] mb-4">The Screen Time Budget system helps manage device time:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>Daily Limit</strong> - Maximum screen time per day</li>
          <li>• <strong>Weekly Limit</strong> - Total screen time for the week</li>
          <li>• <strong>Timer</strong> - Fullscreen countdown when using screen time rewards</li>
          <li>• <strong>Bonus Time</strong> - Extra time earned through achievements (shown in green)</li>
        </ul>
        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-[#688961]">Children see their remaining budget on the Store page. When the limit is reached, screen time rewards show as "Limit Reached".</p>
        </div>
      </Section>

      <Section title="Goals System">
        <p className="text-[#688961] mb-4">Help children save for bigger rewards with Goals:</p>
        <div className="grid md:grid-cols-4 gap-3 my-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <strong>Small</strong>
            <p className="text-sm text-[#688961]">200 XP</p>
            <p className="text-xs text-[#688961]">~1 week</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <strong>Medium</strong>
            <p className="text-sm text-[#688961]">500 XP</p>
            <p className="text-xs text-[#688961]">~2-3 weeks</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <strong>Large</strong>
            <p className="text-sm text-[#688961]">1000 XP</p>
            <p className="text-xs text-[#688961]">~1 month</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <strong>XL</strong>
            <p className="text-sm text-[#688961]">2000 XP</p>
            <p className="text-xs text-[#688961]">Major goal</p>
          </div>
        </div>
        <SubSection title="Milestone Bonuses">
          <p className="text-[#688961]">Enable milestone bonuses to reward progress at 25%, 50%, and 75% of the goal. This keeps children motivated during long-term saving!</p>
        </SubSection>
      </Section>

      <Section title="Pricing Strategy">
        <p className="text-[#688961] mb-4">Good pricing makes rewards feel achievable:</p>
        <ul className="space-y-3 text-[#688961]">
          <li><strong>Quick wins (50-100 XP)</strong> - Achievable in 1-2 days to maintain motivation</li>
          <li><strong>Medium goals (150-300 XP)</strong> - Requires a week of effort, teaches saving</li>
          <li><strong>Big rewards (500+ XP)</strong> - Use Goals feature for long-term targets</li>
        </ul>
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-[#688961]"><strong>Exchange Rate:</strong> Set your family's XP-to-dollar ratio in Settings (e.g., 100 XP = $1) to help price rewards consistently.</p>
        </div>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">💡 Best Practices</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Offer a mix of quick wins and bigger goals</li>
          <li>✓ Include non-material rewards (experiences, privileges)</li>
          <li>✓ Use weekly limits to prevent over-redemption</li>
          <li>✓ Let kids suggest rewards they'd like</li>
          <li>✓ Use "Gift to Child" to reward spontaneous good behavior</li>
        </ul>
      </div>
    </div>
  );
}

function KindnessGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Kindness System</h1>
      <p className="text-xl text-[#688961] mb-8">Recognize and celebrate pro-social behavior and empathy.</p>

      <div className="bg-gradient-to-br from-[#f49d25]/20 to-[#0ea5e9]/20 rounded-2xl p-8 mb-8">
        <h3 className="font-display text-2xl font-bold text-[#121811] mb-4">What is the Kindness System?</h3>
        <p className="text-[#688961]">
          The Kindness System is separate from regular tasks. It's designed to notice and celebrate when your child shows empathy, helps others, or does kind things without being asked. Send gratitude cards to recognize these moments!
        </p>
      </div>

      <Section title="Sending Gratitude Cards">
        <p className="text-[#688961] mb-4">Navigate to <strong>Kindness → Send Kindness</strong> to send a card:</p>
        <StepItem number={1} title="Choose Recipient" description="Select which child you want to thank" />
        <StepItem number={2} title="Pick a Theme" description="Choose from 4 beautiful card themes:" />
        <div className="grid grid-cols-4 gap-3 ml-14 mb-6">
          <div className="bg-purple-100 rounded-lg p-3 text-center">
            <span className="text-xl">✨</span>
            <p className="text-xs font-medium">Cosmic</p>
          </div>
          <div className="bg-green-100 rounded-lg p-3 text-center">
            <span className="text-xl">🌿</span>
            <p className="text-xs font-medium">Nature</p>
          </div>
          <div className="bg-orange-100 rounded-lg p-3 text-center">
            <span className="text-xl">⚡</span>
            <p className="text-xs font-medium">Super Hero</p>
          </div>
          <div className="bg-pink-100 rounded-lg p-3 text-center">
            <span className="text-xl">❤️</span>
            <p className="text-xs font-medium">Love</p>
          </div>
        </div>
        <StepItem number={3} title="Write Message" description="Write a personal message (up to 140 characters). Use quick prompts like 'Helping out' or 'Made my day better' for inspiration." />
      </Section>

      <Section title="Kindness Badges">
        <p className="text-[#688961] mb-4">Children earn badges based on gratitude cards received:</p>
        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="bg-amber-50 rounded-xl p-6 text-center border-2 border-amber-200">
            <span className="text-4xl">🥉</span>
            <h4 className="font-bold text-[#121811] mt-2">Bronze Badge</h4>
            <p className="text-sm text-[#688961]">5 gratitude cards</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-6 text-center border-2 border-gray-300">
            <span className="text-4xl">🥈</span>
            <h4 className="font-bold text-[#121811] mt-2">Silver Badge</h4>
            <p className="text-sm text-[#688961]">10 gratitude cards</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 text-center border-2 border-yellow-300">
            <span className="text-4xl">🥇</span>
            <h4 className="font-bold text-[#121811] mt-2">Gold Badge</h4>
            <p className="text-sm text-[#688961]">20 gratitude cards</p>
          </div>
        </div>
        <p className="text-[#688961]">Children can view their badge progress and recent cards on the <strong>Badges</strong> page in their dashboard.</p>
      </Section>

      <Section title="Examples of Kindness Actions">
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <KindnessExample
            title="Helping Family"
            items={[
              "Helped sibling with homework",
              "Made breakfast for parent",
              "Played with baby brother without being asked"
            ]}
          />
          <KindnessExample
            title="Showing Empathy"
            items={[
              "Comforted friend who was sad",
              "Shared toy with upset sibling",
              "Wrote thank you note to teacher"
            ]}
          />
          <KindnessExample
            title="Community Actions"
            items={[
              "Helped elderly neighbor",
              "Picked up litter at park",
              "Donated old toys to charity"
            ]}
          />
          <KindnessExample
            title="Going Above"
            items={[
              "Did extra chore without being asked",
              "Cleaned up someone else's mess",
              "Helped new student at school"
            ]}
          />
        </div>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">✨ Why It Matters</h3>
        <p className="text-[#688961]">
          Research shows that recognizing prosocial behavior increases empathy and emotional intelligence. The Kindness System helps build character alongside habits. It's not about "paying for kindness" - it's about noticing and celebrating the person your child is becoming.
        </p>
      </div>
    </div>
  );
}

function SettingsGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Settings & Customization</h1>
      <p className="text-xl text-[#688961] mb-8">Configure EarnQuest to work perfectly for your family.</p>

      <Section title="Device Connection">
        <p className="text-[#688961] mb-4">Set up child access to EarnQuest:</p>
        <SettingItem
          title="Family Join Code"
          description="A unique 6-character code (e.g., 'ABC123') that children enter to access their accounts. You can copy this code or generate a new one if needed."
        />
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#688961]"><strong>⚠️ Note:</strong> Generating a new code disables the old one. All devices using the old code will need to re-enter the new code.</p>
        </div>
      </Section>

      <Section title="Child Login Security">
        <SettingItem
          title="PIN Protection"
          description="Toggle to require a 4-digit PIN for children to log in. When enabled, each child needs their own PIN (default: 0000)."
        />
        <SettingItem
          title="Individual Child PINs"
          description="Set a unique 4-digit PIN for each child. You can change PINs anytime from this section."
        />
      </Section>

      <Section title="Exchange Rate">
        <p className="text-[#688961] mb-4">Set a reference exchange rate for pricing rewards consistently:</p>
        <div className="grid grid-cols-5 gap-2 my-4">
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">10 XP = $1</div>
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">20 XP = $1</div>
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">50 XP = $1</div>
          <div className="bg-green-100 rounded-lg p-2 text-center text-sm font-medium">100 XP = $1 ✓</div>
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">200 XP = $1</div>
        </div>
        <p className="text-sm text-[#688961]">This is a reference only - it helps you price rewards and goals consistently but doesn't affect children's accounts.</p>
      </Section>

      <Section title="Co-Parent Access">
        <SettingItem
          title="Invite Co-Parent"
          description="Generate a 7-day invitation link to share with your partner. They can join your family account and help manage tasks and approvals."
        />
        <SettingItem
          title="Pending Invitations"
          description="View and manage outstanding invitations with their expiration dates."
        />
      </Section>

      <Section title="Children Management">
        <p className="text-[#688961] mb-4">Navigate to <strong>Settings → Manage Children</strong> to:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>Add Child</strong> - Enter name, birthdate, and optional PIN</li>
          <li>• <strong>Edit Profile</strong> - Update name, birthdate, or avatar</li>
          <li>• <strong>Change Avatar</strong> - Upload photo, take selfie, or choose from presets</li>
          <li>• <strong>View as Child</strong> - See exactly what your child sees in their dashboard</li>
        </ul>
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-[#688961]">Each child card shows their current XP balance, age group, and when they joined.</p>
        </div>
      </Section>

      <Section title="Avatar Options">
        <p className="text-[#688961] mb-4">Both parents and children can customize their avatars:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>📷 Take Photo</strong> - Use device camera for a selfie</li>
          <li>• <strong>📁 Upload Image</strong> - Choose from your device (up to 5MB)</li>
          <li>• <strong>🎨 Preset Avatars</strong> - Select from a gallery of pre-made avatars</li>
        </ul>
      </Section>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">⚙️ Pro Tips</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Enable PIN protection for shared devices</li>
          <li>✓ Invite co-parents early so both can help with approvals</li>
          <li>✓ Use "View as Child" to understand the child experience</li>
          <li>✓ Review settings monthly as children grow older</li>
          <li>✓ Use the exchange rate to price rewards like real-world items</li>
        </ul>
      </div>
    </div>
  );
}

// Helper Components
function Section({ title, children }: any) {
  return (
    <div className="mt-12 first:mt-0">
      <h2 className="font-display text-3xl font-bold text-[#121811] mb-6">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: any) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-xl font-semibold text-[#121811] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StepItem({ number, title, description, items }: any) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#2bb800] text-white font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-display text-xl font-bold text-[#121811] mb-2">{title}</h4>
        <p className="text-[#688961] mb-2">{description}</p>
        {items && (
          <ul className="space-y-1 text-[#688961] text-sm">
            {items.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#2bb800] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RewardType({ icon, title, description, examples }: any) {
  return (
    <div className="border-l-4 border-[#2bb800] pl-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{icon}</span>
        <h3 className="font-display text-2xl font-bold text-[#121811]">{title}</h3>
      </div>
      <p className="text-[#688961] mb-3">{description}</p>
      <ul className="space-y-1 text-[#688961] text-sm">
        {examples.map((example: string, i: number) => (
          <li key={i}>• {example}</li>
        ))}
      </ul>
    </div>
  );
}

function KindnessExample({ title, items }: any) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#2bb800]/20">
      <h4 className="font-display font-bold text-[#121811] mb-3">{title}</h4>
      <ul className="space-y-2 text-[#688961] text-sm">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-2">
            <Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SettingItem({ title, description }: any) {
  return (
    <div className="mb-6 pb-6 border-b border-[#688961]/20 last:border-0">
      <h4 className="font-display text-xl font-semibold text-[#121811] mb-2">{title}</h4>
      <p className="text-[#688961]">{description}</p>
    </div>
  );
}

// Navigation Data
const sections = [
  { id: 'getting-started', title: 'Getting Started', icon: Home },
  { id: 'parent-guide', title: 'Parent Guide', icon: Users },
  { id: 'child-guide', title: 'Kid\'s Guide', icon: Baby },
  { id: 'tasks', title: 'Tasks System', icon: CheckCircle },
  { id: 'rewards', title: 'Reward Store', icon: Gift },
  { id: 'kindness', title: 'Kindness System', icon: Heart },
  { id: 'settings', title: 'Settings', icon: Settings },
];
