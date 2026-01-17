/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { BookOpen, Users, Baby, Settings, Gift, Heart, CheckCircle, ChevronRight, Home } from 'lucide-react';

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8f6] to-white">
      {/* Header */}
      <header className="bg-white border-b border-[#2bb800]/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#2bb800]" />
            <div>
              <h1 className="font-display text-2xl font-bold text-[#121811]">EarnQuest User Manual</h1>
              <p className="text-sm text-[#688961]">Complete guide for parents and children</p>
            </div>
          </div>
          <a href="/pamphlet" className="text-[#2bb800] hover:text-[#229900] font-semibold flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
          <nav className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-display font-bold text-[#121811] mb-4 text-sm uppercase tracking-wide">Contents</h3>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-[#2bb800] text-white'
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
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white rounded-2xl p-12 shadow-card">
            {activeSection === 'getting-started' && <GettingStarted />}
            {activeSection === 'parent-guide' && <ParentGuide />}
            {activeSection === 'child-guide' && <ChildGuide />}
            {activeSection === 'tasks' && <TasksGuide />}
            {activeSection === 'rewards' && <RewardsGuide />}
            {activeSection === 'kindness' && <KindnessGuide />}
            {activeSection === 'settings' && <SettingsGuide />}
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
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>5 minutes of time</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>Email address or Google/Apple account</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>Your child's age and name</span>
          </li>
        </ul>
      </div>

      <h2 className="font-display text-3xl font-bold text-[#121811] mt-10 mb-6">Step-by-Step Setup</h2>

      <StepItem
        number={1}
        title="Create Your Account"
        description="Sign up using your email, Google, or Apple account. This will be your parent account."
      />

      <StepItem
        number={2}
        title="Add Your Children"
        description="Enter your child's name, age, and choose an avatar. You can add multiple children to the same family account."
      />

      <StepItem
        number={3}
        title="Choose a Parenting Style"
        description="Select from three presets that match your family's values:"
        items={[
          "Easy Start - Minimal tasks, focus on building habits gradually",
          "Balanced - Mix of tasks across learning, chores, and health",
          "Learning Focus - Emphasize homework and educational activities"
        ]}
      />

      <StepItem
        number={4}
        title="Review Default Tasks & Rewards"
        description="We've created age-appropriate tasks and rewards based on your choices. You can customize them anytime."
      />

      <StepItem
        number={5}
        title="Launch and Share"
        description="Show your child the app! Walk through their dashboard together and explain how they can earn points and redeem rewards."
      />

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-10">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#0ea5e9]" />
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

      <Section title="Managing Tasks">
        <p className="text-[#688961] mb-4">As a parent, you have full control over the task system.</p>

        <SubSection title="Creating a Task">
          <ol className="space-y-3 text-[#688961]">
            <li>1. Go to Parent Dashboard → Tasks</li>
            <li>2. Click "Add Task"</li>
            <li>3. Fill in task details:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Task name and description</li>
                <li>• Category (Learning, Chores, Health)</li>
                <li>• Point value (typically 20-50 points)</li>
                <li>• Approval method</li>
              </ul>
            </li>
            <li>4. Set schedule (daily, weekly, or custom)</li>
            <li>5. Assign to children</li>
          </ol>
        </SubSection>

        <SubSection title="Approval Methods">
          <ul className="space-y-3 text-[#688961]">
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>Parent Approval</strong> - You manually review and approve completion
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>Auto-Approve</strong> - System automatically approves when child marks complete (for trusted tasks)
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>Timer</strong> - Child starts a timer, task auto-completes when timer ends
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>Checklist</strong> - Child checks off sub-items, parent approves final checklist
              </div>
            </li>
          </ul>
        </SubSection>
      </Section>

      <Section title="Approving Completed Tasks">
        <p className="text-[#688961] mb-4">When your child completes a task requiring approval:</p>
        <ol className="space-y-2 text-[#688961]">
          <li>1. You'll receive a notification</li>
          <li>2. Review the task completion (check photo if required)</li>
          <li>3. Tap "Approve" to award points, or "Reject" with feedback</li>
          <li>4. Your child receives points instantly upon approval</li>
        </ol>
      </Section>

      <Section title="Managing the Reward Store">
        <SubSection title="Adding Rewards">
          <ol className="space-y-2 text-[#688961]">
            <li>1. Navigate to Parent Dashboard → Store</li>
            <li>2. Click "Add Reward"</li>
            <li>3. Choose reward type:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Screen Time (e.g., "30 mins iPad time")</li>
                <li>• Experience (e.g., "Movie night choice")</li>
                <li>• Privilege (e.g., "Stay up 30 mins late")</li>
                <li>• Physical (e.g., "Small toy from store")</li>
              </ul>
            </li>
            <li>4. Set the cost in points</li>
            <li>5. Add description and optional image</li>
          </ol>
        </SubSection>

        <SubSection title="Approving Purchases">
          <p className="text-[#688961] mb-3">When your child redeems a reward, you'll receive a notification. Review and approve the purchase to confirm.</p>
        </SubSection>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2">Best Practices</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Keep tasks age-appropriate and achievable</li>
          <li>✓ Balance different task categories</li>
          <li>✓ Respond to task approvals within 24 hours</li>
          <li>✓ Review and adjust point values monthly</li>
          <li>✓ Celebrate milestones together as a family</li>
        </ul>
      </div>
    </div>
  );
}

function ChildGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">Guide for Kids</h1>
      <p className="text-xl text-[#688961] mb-8">Learn how to complete tasks, earn points, and get awesome rewards!</p>

      <Section title="Your Dashboard">
        <p className="text-[#688961] mb-4">When you open EarnQuest, you'll see your personal dashboard with:</p>
        <ul className="space-y-3 text-[#688961]">
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <strong>Your Points</strong> - How many points you've earned
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <strong>Today's Tasks</strong> - Things you can do to earn points
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <strong>Your Stats</strong> - Streak, total points, and achievements
            </div>
          </li>
        </ul>
      </Section>

      <Section title="Completing Tasks">
        <p className="text-[#688961] mb-4">Here's how to complete tasks and earn points:</p>

        <StepItem
          number={1}
          title="Pick a Task"
          description="Look at your task list and choose one to do"
        />

        <StepItem
          number={2}
          title="Do the Task"
          description="Complete the activity! Make sure you do it well."
        />

        <StepItem
          number={3}
          title="Mark Complete"
          description="Tap the task and click 'Mark Complete'. Some tasks need a photo or timer."
        />

        <StepItem
          number={4}
          title="Wait for Approval"
          description="Your parent will check your work and approve it. Then you get the points!"
        />
      </Section>

      <Section title="The Reward Store">
        <p className="text-[#688961] mb-4">Once you have enough points, you can buy rewards from the store:</p>
        <ol className="space-y-3 text-[#688961]">
          <li>1. Tap the "Store" button</li>
          <li>2. Browse rewards and see how many points they cost</li>
          <li>3. When you find something you want, tap "Redeem"</li>
          <li>4. Your parent will approve it, and you get your reward!</li>
        </ol>
      </Section>

      <div className="bg-[#f49d25]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">🌟 Special: Kindness Points</h3>
        <p className="text-[#688961] mb-3">
          Did something kind without being asked? Tell your parents! Kindness actions can earn you bonus points.
        </p>
        <p className="text-[#688961] font-semibold">
          Examples: Helping a sibling, sharing toys, comforting someone who's sad
        </p>
      </div>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-6">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">Tips for Success 💪</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Check your tasks every morning</li>
          <li>✓ Do your tasks before playing</li>
          <li>✓ Take photos to prove completion</li>
          <li>✓ Save points for bigger rewards</li>
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
        <div className="grid md:grid-cols-3 gap-6 my-6">
          <div className="bg-[#2bb800]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">📚 Learning</h4>
            <p className="text-[#688961] text-sm">Homework, reading, educational apps, practice instruments</p>
          </div>
          <div className="bg-[#0ea5e9]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">🏠 Chores</h4>
            <p className="text-[#688961] text-sm">Room cleaning, dishes, laundry, pet care, yard work</p>
          </div>
          <div className="bg-[#f49d25]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">💪 Health</h4>
            <p className="text-[#688961] text-sm">Exercise, brushing teeth, morning routine, bedtime routine</p>
          </div>
        </div>
      </Section>

      <Section title="Point Values Guide">
        <p className="text-[#688961] mb-4">Recommended point values based on task difficulty and time:</p>
        <ul className="space-y-3 text-[#688961]">
          <li><strong>10-20 points</strong> - Quick tasks (5-10 mins): Brush teeth, make bed</li>
          <li><strong>20-30 points</strong> - Medium tasks (10-20 mins): Clean room, read for 15 mins</li>
          <li><strong>30-50 points</strong> - Longer tasks (20-40 mins): Homework, exercise 30 mins</li>
          <li><strong>50+ points</strong> - Major tasks (40+ mins): Deep clean room, big school project</li>
        </ul>
      </Section>

      <Section title="Setting Up Recurring Tasks">
        <p className="text-[#688961] mb-4">Tasks can repeat automatically on your chosen schedule:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>Daily</strong> - Task appears every day (e.g., "Brush teeth")</li>
          <li>• <strong>Weekdays</strong> - Monday through Friday only (e.g., "Do homework")</li>
          <li>• <strong>Weekends</strong> - Saturday and Sunday only (e.g., "Help with yard work")</li>
          <li>• <strong>Specific Days</strong> - Choose exact days (e.g., "Piano practice" on Mon/Wed/Fri)</li>
          <li>• <strong>Weekly</strong> - Once per week on chosen day (e.g., "Deep clean room" every Saturday)</li>
        </ul>
      </Section>

      <Section title="Trust Levels">
        <p className="text-[#688961] mb-4">As your child proves responsibility, you can increase their trust level to enable auto-approval for certain tasks.</p>
        <div className="space-y-4">
          <div className="border-l-4 border-[#2bb800] pl-4">
            <strong className="text-[#121811]">Level 1 (Starting Out)</strong>
            <p className="text-[#688961] text-sm mt-1">All tasks require parent approval</p>
          </div>
          <div className="border-l-4 border-[#0ea5e9] pl-4">
            <strong className="text-[#121811]">Level 2 (Building Trust)</strong>
            <p className="text-[#688961] text-sm mt-1">Simple daily tasks auto-approve</p>
          </div>
          <div className="border-l-4 border-[#f49d25] pl-4">
            <strong className="text-[#121811]">Level 3 (Trusted)</strong>
            <p className="text-[#688961] text-sm mt-1">Most routine tasks auto-approve</p>
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

      <Section title="Types of Rewards">
        <div className="space-y-6">
          <RewardType
            icon="📱"
            title="Screen Time"
            description="Digital device time - the most requested reward!"
            examples={[
              "30 minutes iPad time - 100 points",
              "1 hour video game time - 150 points",
              "Watch a movie - 200 points"
            ]}
          />

          <RewardType
            icon="🎉"
            title="Experiences"
            description="Fun activities and special time together"
            examples={[
              "Choose family movie - 150 points",
              "Extra bedtime story - 80 points",
              "Friend sleepover - 300 points"
            ]}
          />

          <RewardType
            icon="⭐"
            title="Privileges"
            description="Special permissions and freedoms"
            examples={[
              "Stay up 30 mins late - 120 points",
              "Skip one chore - 100 points",
              "Choose dinner menu - 150 points"
            ]}
          />

          <RewardType
            icon="🎁"
            title="Physical Items"
            description="Tangible rewards and treats"
            examples={[
              "Small toy ($5-10) - 250 points",
              "Favorite snack - 50 points",
              "New book - 200 points"
            ]}
          />
        </div>
      </Section>

      <Section title="Pricing Strategy">
        <p className="text-[#688961] mb-4">Good pricing makes rewards feel achievable while encouraging delayed gratification:</p>
        <ul className="space-y-3 text-[#688961]">
          <li><strong>Quick wins (50-100 points)</strong> - Achievable in 1-2 days to maintain motivation</li>
          <li><strong>Medium goals (150-300 points)</strong> - Requires a week of effort, teaches saving</li>
          <li><strong>Big rewards (400+ points)</strong> - Long-term goals for major rewards</li>
        </ul>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">💡 Best Practices</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Offer a mix of quick wins and bigger goals</li>
          <li>✓ Include non-material rewards (experiences, privileges)</li>
          <li>✓ Update the store seasonally to keep it fresh</li>
          <li>✓ Let kids suggest rewards they'd like</li>
          <li>✓ Avoid rewards that contradict your values</li>
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
          The Kindness System is separate from regular tasks. It's designed to notice and celebrate when your child shows empathy, helps others, or does kind things without being asked. These moments are precious - the system helps you capture and celebrate them.
        </p>
      </div>

      <Section title="How It Works">
        <ol className="space-y-4 text-[#688961]">
          <li>
            <strong className="text-[#121811]">Child reports or parent notices</strong>
            <p className="mt-1">When a kind action happens, either the child can report it or you can add it</p>
          </li>
          <li>
            <strong className="text-[#121811]">Parent reviews and approves</strong>
            <p className="mt-1">You write a short note about why it was kind and approve it</p>
          </li>
          <li>
            <strong className="text-[#121811]">Child receives recognition</strong>
            <p className="mt-1">Bonus points are awarded + a special badge in their profile</p>
          </li>
          <li>
            <strong className="text-[#121811]">Build a kindness history</strong>
            <p className="mt-1">All kindness actions are saved - a beautiful record of growth</p>
          </li>
        </ol>
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

      <Section title="Point Awards for Kindness">
        <p className="text-[#688961] mb-4">Kindness points are bonus rewards:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>Small kindness</strong> - 20-30 bonus points</li>
          <li>• <strong>Significant kindness</strong> - 40-60 bonus points</li>
          <li>• <strong>Exceptional kindness</strong> - 80-100 bonus points</li>
        </ul>
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

      <Section title="Family Settings">
        <SettingItem
          title="Add/Remove Children"
          description="Manage which children are part of your family account. Each child gets their own profile and progress tracking."
        />
        <SettingItem
          title="Parent Accounts"
          description="Add your partner or co-parent so both can approve tasks and manage the system."
        />
        <SettingItem
          title="Notification Preferences"
          description="Choose which notifications you receive: task completions, reward redemptions, milestones, or daily summaries."
        />
        <SettingItem
          title="Privacy Settings"
          description="Control what data is collected and how your family information is used. EarnQuest is COPPA compliant."
        />
      </Section>

      <Section title="Child Profile Settings">
        <SettingItem
          title="Avatar & Customization"
          description="Let your child choose their avatar, color theme, and display name."
        />
        <SettingItem
          title="Age & Presets"
          description="Update as your child grows. Age presets automatically adjust task difficulty and point values."
        />
        <SettingItem
          title="Trust Level"
          description="Adjust trust level to enable auto-approval for appropriate tasks as responsibility increases."
        />
      </Section>

      <Section title="Task Defaults">
        <SettingItem
          title="Default Point Values"
          description="Set standard point values for each task category to maintain consistency."
        />
        <SettingItem
          title="Approval Requirements"
          description="Choose default approval method for new tasks: parent approval, auto-approve, timer, or checklist."
        />
        <SettingItem
          title="Streak Rules"
          description="Configure how streaks work: consecutive days required, grace periods, and bonus rewards."
        />
      </Section>

      <Section title="Store Settings">
        <SettingItem
          title="Purchase Approval"
          description="Require parent approval for all purchases, or set an auto-approve limit for smaller rewards."
        />
        <SettingItem
          title="Savings Goals"
          description="Help children set savings goals for big rewards and track progress toward them."
        />
      </Section>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">⚙️ Pro Tips</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ Review settings monthly as your child grows</li>
          <li>✓ Enable notifications for task completions to stay responsive</li>
          <li>✓ Adjust point values if rewards are being redeemed too quickly or slowly</li>
          <li>✓ Use trust levels as a reward for consistent responsibility</li>
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
            <Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" />
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
