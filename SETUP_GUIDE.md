# DateUp - Complete Setup Guide
# ₹0 Stack: Supabase + Cloudinary + Vercel
# ==========================================

# ==============================================
# STEP 1: SUPABASE SETUP
# ==============================================

## 1.1 Account banana
1. https://supabase.com jao
2. "Start your project" click karo
3. GitHub se sign in karo (free)
4. "New project" click karo:
   - Name: dateup
   - Database Password: strong password rakhna (save karo)
   - Region: South Asia (Singapore - closest to India)
5. "Create new project" - wait karo ~2 min

---

## 1.2 Database Tables banana (SQL Editor)
Left sidebar → "SQL Editor" → "New query" → Yeh POORA SQL paste karo → "Run" dabao:

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  notice_count INTEGER DEFAULT 0,
  groups JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notices table
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  group_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tag TEXT DEFAULT 'general',
  image_url TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Org owner can do anything"
ON organizations FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Notices policies (read = anyone with group_id, write = org owner)
CREATE POLICY "Anyone can read notices"
ON notices FOR SELECT
USING (true);

CREATE POLICY "Only org owner can insert notices"
ON notices FOR INSERT
WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Only org owner can update notices"
ON notices FOR UPDATE
USING (auth.uid() = org_id);

CREATE POLICY "Only org owner can delete notices"
ON notices FOR DELETE
USING (auth.uid() = org_id);

-- Allow viewers to increment view count (they're not logged in)
CREATE POLICY "Anyone can update views"
ON notices FOR UPDATE
USING (true)
WITH CHECK (true);
```

✅ "Success" message aa gaya toh database ready hai!

---

## 1.3 Supabase Keys lena
Left sidebar → "Settings" ⚙️ → "API" →
- Project URL: copy karo  (ye SUPABASE_URL hai)
- anon / public key: copy karo  (ye SUPABASE_ANON_KEY hai)

---

# ==============================================
# STEP 2: CLOUDINARY SETUP
# ==============================================

## 2.1 Account banana
1. https://cloudinary.com jao
2. "Sign Up for Free" click karo
3. Form fill karo - email verify karo

## 2.2 Cloud Name lena
Dashboard pe top-left me "Cloud Name" dikhega → copy karo
e.g. "dxyz12abc"

## 2.3 Upload Preset banana (IMPORTANT)
1. Top-right gear icon ⚙️ → "Settings"
2. Left menu → "Upload"
3. Scroll down → "Upload presets"
4. "Add upload preset" click karo:
   - Preset name: dateup_unsigned
   - Signing Mode: UNSIGNED ← (yeh zaroori hai!)
   - Folder: dateup
5. "Save" click karo

✅ Cloudinary ready!

---

# ==============================================
# STEP 3: CODE SETUP
# ==============================================

## 3.1 Keys config file me paste karo
`src/config.js` file kholo:

```javascript
// YE LINES REPLACE KARO:
const SUPABASE_URL = 'https://xyzabc.supabase.co';        // tumhara URL
const SUPABASE_ANON_KEY = 'eyJhbGci...';                  // tumhara anon key
export const CLOUDINARY_CLOUD_NAME = 'dxyz12abc';         // tumhara cloud name
export const CLOUDINARY_UPLOAD_PRESET = 'dateup_unsigned'; // exact yahi naam
```

## 3.2 Dependencies install karo
```bash
cd dateup
npm install
```

## 3.3 Local run karo
```bash
npm start
```
Browser me http://localhost:3000 khulega - DateUp ready!

---

# ==============================================
# STEP 4: VERCEL DEPLOYMENT (FREE)
# ==============================================

## 4.1 GitHub pe code daalo
```bash
git init
git add .
git commit -m "DateUp v1.0"
```

GitHub.com pe jao → "New repository" → name: dateup → Create

```bash
git remote add origin https://github.com/TUMHARA_USERNAME/dateup.git
git branch -M main
git push -u origin main
```

## 4.2 Vercel pe deploy karo
1. https://vercel.com jao
2. GitHub se sign in karo
3. "Add New Project" → dateup repo select karo
4. Framework: Create React App (auto detect hoga)
5. "Deploy" click karo
6. 2-3 min me live link milega: https://dateup-xyz.vercel.app

✅ LIVE HO GAYA!

---

# ==============================================
# FREE TIER LIMITS (Kab tak free rhega?)
# ==============================================

| Service      | Free Limit                    | Enough for? |
|--------------|-------------------------------|-------------|
| Supabase DB  | 500MB storage, 50K req/day   | ✅ 1000+ users |
| Cloudinary   | 5GB storage, 25 credits/mo   | ✅ ~500 images |
| Vercel       | Unlimited deployments         | ✅ Unlimited |
| Supabase Auth| Unlimited users               | ✅ Unlimited |

Total monthly cost: ₹0 🎉

---

# ==============================================
# HOW IT WORKS (Flow)
# ==============================================

ADMIN FLOW:
1. Admin → signup (org name + email + password)
2. Admin → "Manage Groups" → group banao (unique ID milega e.g. DU-ABCD-EF12-GH34)
3. Admin → yeh ID apne members ko share kare
4. Admin → "Create Notice" → group select → tag select → text/image/pdf add → Publish!
5. Admin → "Admin Info" → views dekho, notices delete karo

VIEWER FLOW:
1. Viewer → DateUp website kholo
2. "Enter as Viewer" click karo
3. Group ID paste karo (jo admin ne diya)
4. Direct feed dikhi! Instagram jaise notices show honge
5. Notice click karo → full details + PDF download

---

# ==============================================
# MONETIZATION PLAN (Already in code)
# ==============================================

- 50 notices/month = FREE
- 50 se zyada = PAID (quota bar admin ko dikhi hai)
- Future: Razorpay integrate karo for payments

---

# ==============================================
# TROUBLESHOOTING
# ==============================================

Problem: "Invalid API key" error
Solution: src/config.js me Supabase keys check karo

Problem: Images upload nahi ho rahi
Solution: Cloudinary preset "UNSIGNED" hai ya nahi check karo

Problem: "Row Level Security" error
Solution: Supabase SQL Editor me woh SQL dobara run karo

Problem: Login ke baad page reload ho raha hai
Solution: Normal hai! Supabase auth session refresh karta hai

---

# DateUp by You 🚀
# Built with: React + Supabase + Cloudinary + Vercel
# Cost: ₹0/month
