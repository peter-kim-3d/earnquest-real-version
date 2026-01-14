# Sample Data Seed Script

This script populates your database with realistic sample tasks and rewards for testing the EarnQuest flow.

## What Gets Added

### 📝 Tasks (23 total)

**Hygiene (5 tasks)**
- Brush Teeth (Morning) - 30 QP, Daily, Auto-approve
- Brush Teeth (Night) - 30 QP, Daily, Auto-approve
- Take a Shower - 50 QP, Daily, Manual
- Wash Hands Before Meals - 20 QP, Daily, Auto-approve
- Clean Your Room - 100 QP, Weekly, Manual

**Chores (6 tasks)**
- Make Your Bed - 40 QP, Daily, Manual
- Do the Dishes - 80 QP, Daily, Manual
- Take Out the Trash - 60 QP, Weekly, Manual
- Feed the Pet - 40 QP, Daily, Manual
- Set the Table - 30 QP, Daily, Manual
- Water the Plants - 50 QP, Weekly, Manual

**Learning (5 tasks)**
- Complete Homework - 100 QP, Daily, Manual
- Read for 30 Minutes - 80 QP, Daily, Manual
- Practice Math Problems - 70 QP, Daily, Manual
- Learn New Vocabulary - 60 QP, Weekly, Manual
- Watch Educational Video - 50 QP, Weekly, Manual

**Exercise (4 tasks)**
- Morning Exercise - 70 QP, Daily, Manual
- Go for a Walk - 60 QP, Daily, Manual
- Play Sports - 90 QP, Weekly, Manual
- Bike Ride - 80 QP, Weekly, Manual

**Creativity (3 tasks)**
- Draw or Paint - 60 QP, Weekly, Manual
- Play Musical Instrument - 80 QP, Weekly, Manual
- Build Something - 70 QP, Weekly, Manual

---

### 🎁 Rewards (21 total)

**Screen Time (6 rewards)**
- 15 Minutes TV Time - 50 QP, 15 min, 5× weekly
- 30 Minutes Gaming - 100 QP, 30 min, 4× weekly
- 1 Hour Movie Night - 200 QP, 60 min, 2× weekly
- 20 Minutes YouTube - 60 QP, 20 min, 5× weekly
- 45 Minutes Tablet Time - 150 QP, 45 min, 3× weekly
- Weekend Gaming Session - 400 QP, 120 min, 1× weekly

**Power Ups (Autonomy) (5 rewards)**
- Stay Up 30 Min Late - 120 QP, 2× weekly
- Choose Dinner Menu - 150 QP, 2× weekly
- Skip One Chore - 100 QP, 3× weekly
- Friend Sleepover - 500 QP, 1× weekly
- Pick Weekend Activity - 200 QP, 1× weekly

**Fun Stuff (Experience) (6 rewards)**
- Ice Cream Trip - 150 QP
- Park Playground Visit - 100 QP
- Movie Theater - 600 QP
- Pizza Party - 250 QP
- New Book - 300 QP
- Trampoline Park - 800 QP

**Savings (4 rewards)**
- Save $5 - 250 QP, unlimited
- Save $10 - 500 QP, unlimited
- Save $20 - 1000 QP, unlimited
- Donate $5 to Charity - 300 QP, 2× weekly

---

## How to Use

### Prerequisites

1. **Complete Onboarding First**
   - You must have at least one family in the database
   - Sign up at `http://localhost:3001/en-US/signup`
   - Complete the onboarding flow

2. **Environment Variables**
   - Make sure your `.env.local` file has:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` (service role key, not anon key!)

### Run the Seed Script

```bash
npm run seed
```

### Expected Output

```
🌱 Starting to seed sample data...

📋 Fetching family...
✅ Found family: The Smith Family (uuid-here)

📊 Current state:
   - Existing tasks: 6
   - Existing rewards: 7

📝 Inserting sample tasks...
✅ Inserted 23 tasks
   By category:
   - hygiene: 5
   - chores: 6
   - learning: 5
   - exercise: 4
   - creativity: 3

🎁 Inserting sample rewards...
✅ Inserted 21 rewards
   By category:
   - screen: 6
   - autonomy: 5
   - experience: 6
   - savings: 4

✨ Sample data seeding complete!

📊 Summary:
   - Total tasks: 29
   - Total rewards: 28

🚀 You can now test the complete flow at http://localhost:3001
```

---

## After Seeding

### View the Data

1. **Parent Task Management**
   - Go to `http://localhost:3001/en-US/tasks`
   - See all 23+ tasks organized by category
   - Try editing, activating/deactivating tasks

2. **Parent Reward Management**
   - Go to `http://localhost:3001/en-US/rewards`
   - See all 21+ rewards organized by category
   - Try editing rewards, changing costs

3. **Child Task View**
   - Go to `http://localhost:3001/en-US/child/dashboard`
   - See tasks available to complete
   - Complete several tasks to earn points

4. **Child Reward Store**
   - Go to `http://localhost:3001/en-US/child/store`
   - Browse rewards by category
   - Purchase rewards with earned points

---

## Testing Scenarios

### Scenario 1: Daily Routine (5 min)
1. Child completes 5 daily tasks (200-300 QP)
2. Parent approves all tasks
3. Child buys "30 Minutes Gaming" (100 QP)
4. Parent grants reward
5. Child sees fulfilled ticket

### Scenario 2: Weekly Limits (3 min)
1. Child purchases "30 Minutes Gaming" 4 times
2. Try to purchase 5th time
3. Should fail with "Weekly limit reached"

### Scenario 3: Screen Budget (3 min)
1. Set child's weekly screen budget to 60 min
2. Purchase two 30-min screen rewards
3. Try to purchase another screen reward
4. Should fail with "Screen budget exceeded"

### Scenario 4: Saving Goals (5 min)
1. Child completes multiple high-value tasks
2. Accumulate 1000+ points
3. Purchase "Save $20" reward
4. Parent grants it
5. Discuss real-world savings

---

## Customizing Sample Data

Edit `scripts/seed-sample-data.ts` to:

- **Add your own tasks:**
  ```typescript
  {
    name: 'Your Custom Task',
    description: 'Description here',
    category: 'chores',
    points: 75,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'task',
  }
  ```

- **Add your own rewards:**
  ```typescript
  {
    name: 'Your Custom Reward',
    description: 'Description here',
    category: 'experience',
    points_cost: 200,
    screen_minutes: null,
    weekly_limit: 2,
    icon: 'redeem',
  }
  ```

- **Adjust point values** to match your family's economy
- **Change frequencies** (daily, weekly, monthly, one_time)
- **Modify weekly limits** or remove them (set to `null`)

Then run `npm run seed` again (it will add to existing data).

---

## Troubleshooting

### Error: "No families found"
**Solution:** Complete onboarding first at `/en-US/signup`

### Error: "Missing environment variables"
**Solution:** Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` (not anon key)

### Error: "Failed to insert tasks"
**Check:**
- Database is accessible
- RLS policies allow service role
- No duplicate constraint violations

### Want to reset and re-seed?
1. Delete tasks/rewards in Supabase dashboard
2. Or use SQL: `DELETE FROM tasks WHERE family_id = 'your-family-id';`
3. Run `npm run seed` again

---

## Point Economy Reference

**Task Points Guide:**
- Simple daily tasks: 20-40 QP
- Medium effort tasks: 50-80 QP
- High effort tasks: 90-150 QP
- Weekly big tasks: 200+ QP

**Reward Costs Guide:**
- Small screen time: 50-100 QP
- Medium rewards: 100-200 QP
- Special activities: 250-600 QP
- Big experiences: 600-1000 QP

**Sample Daily Earnings:**
- Light day (3 tasks): 100-150 QP
- Normal day (5 tasks): 200-300 QP
- Productive day (8 tasks): 400-500 QP

This allows kids to:
- Buy small screen rewards daily
- Save up for medium rewards (2-3 days)
- Work toward big experiences (weekly)

---

**Happy Testing! 🎮**
