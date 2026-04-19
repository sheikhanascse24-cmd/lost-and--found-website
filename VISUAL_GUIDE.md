# How to Run Your Lost & Found Website - Visual Guide

## 🎯 The Process (Simple Version)

```
┌─────────────────────────────────────┐
│  Step 1: Create Upload Folders      │
│  ✓ uploads/                         │
│  ✓ uploads/profiles/                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 2: Start XAMPP Services       │
│  ✓ Start Apache (click Start button)│
│  ✓ Start MySQL (click Start button) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 3: Open Browser               │
│  http://localhost/lost_and_found_web/
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 4: Start Using!               │
│  ✓ Register                         │
│  ✓ Login                            │
│  ✓ Post Items                       │
│  ✓ Browse Feed                      │
└─────────────────────────────────────┘
```

---

## 📂 File Location

**Your website files should be here:**

```
C:\xampp\htdocs\lost_and_found_web\
│
├── 📄 index.html                      (Home page)
├── 📄 feed.html                       (Find Items - Twitter Feed)
├── 📄 login.html                      (Login page)
├── 📄 register.html                   (Registration page)
├── 📄 post-item.html                  (Post new item)
├── 📄 user-profile.html               (View user profile)
├── 📄 item-detail.html                (Item details)
├── 📄 dashboard.html                  (User dashboard)
│
├── 📁 api/                            (Server scripts)
│   ├── db_connection.php              (Database connection)
│   ├── register.php                   (Handle registration)
│   ├── login.php                      (Handle login)
│   ├── post_item.php                  (Handle item posting)
│   ├── get_items.php                  (Fetch items for feed)
│   ├── get_comments.php               (Get comments/claims)
│   ├── add_comment.php                (Post comments/claims)
│   ├── get_user_profile.php           (Fetch user profile)
│   ├── messages.php                   (Messaging system)
│   └── user_dashboard.php             (Dashboard data)
│
├── 📁 css/                            (Styling)
│   ├── styles.css                     (Main styles)
│   ├── feed.css                       (Feed page styles)
│   └── profile.css                    (Profile page styles)
│
├── 📁 js/                             (JavaScript)
│   ├── auth.js                        (Authentication helpers)
│   ├── login.js                       (Login logic)
│   ├── register.js                    (Registration logic)
│   ├── home.js                        (Home page logic)
│   ├── feed.js                        (Feed page logic)
│   ├── post-item.js                   (Post item logic)
│   ├── item-detail.js                 (Item detail logic)
│   ├── user-profile.js                (Profile page logic)
│   └── dashboard.js                   (Dashboard logic)
│
├── 📁 uploads/                        ⭐ (CREATE THIS!)
│   └── 📁 profiles/                   ⭐ (CREATE THIS!)
│
├── 📄 database.sql                    (Database schema)
├── 📄 README.md                       (Documentation)
├── 📄 QUICK_START.md                  (Quick start guide)
├── 📄 SETUP_AND_RUN.md                (Detailed setup)
├── 📄 QUICK_RUN.md                    (Checklist)
├── 📄 FEATURES.md                     (Features list)
├── 📄 COMPLETE_GUIDE.md               (Complete guide)
└── 📄 FOUND_ITEMS_FEATURE.md          (Found items feature)
```

**⭐ You MUST create `uploads/` and `uploads/profiles/` folders!**

---

## 🖥️ XAMPP Control Panel

**This is what you need to click:**

```
┌─────────────────────────────────┐
│   XAMPP Control Panel           │
├─────────────────────────────────┤
│                                 │
│  Apache                         │
│  ☐ Disable   ☐ Quit            │
│  ┌──────────┐                   │
│  │  START   │  ← Click Start!   │
│  └──────────┘                   │
│  Status: Running ✅             │
│                                 │
│  MySQL                          │
│  ☐ Disable   ☐ Quit            │
│  ┌──────────┐                   │
│  │  START   │  ← Click Start!   │
│  └──────────┘                   │
│  Status: Running ✅             │
│                                 │
└─────────────────────────────────┘
```

---

## 🌐 Website Flow

```
┌──────────────┐
│  Home Page   │
│ index.html   │
└──────┬───────┘
       │
       ├─ Click "Register"
       │  ▼
       │  ┌──────────────┐
       │  │  Register    │
       │  │ register.html│
       │  └──────────────┘
       │
       ├─ Click "Login"
       │  ▼
       │  ┌──────────────┐
       │  │    Login     │
       │  │  login.html  │
       │  └──────────────┘
       │
       ├─ Click "Post Item"
       │  ▼
       │  ┌──────────────┐
       │  │ Post Item    │
       │  │post-item.html│
       │  └──────────────┘
       │
       └─ Click "Find Items"
          ▼
          ┌──────────────┐
          │ Feed (Twitter│
          │  style)      │
          │  feed.html   │
          │              │
          │ Click user   │
          │ avatar ──────┼──► User Profile
          │              │   user-profile.html
          │ Click item   │
          │ ─────────────┼──► Item Details
          │              │   item-detail.html
          │              │
          │ Click Comment│
          │ or Claim ────┼──► Add Comment Modal
          │              │   (add_comment.php)
          └──────────────┘
```

---

## 🗄️ Database Connection

```
Your Website (JavaScript)
       │
       │ (AJAX calls)
       │
       ▼
PHP API Files (api/*.php)
       │
       │ (SQL queries)
       │
       ▼
MySQL Database
(lost_and_found)
       │
       ├─ users (registration, profiles)
       ├─ items (lost/found items)
       ├─ responses (comments & claims)
       └─ messages (user messages)
```

---

## 📝 Step-by-Step Walkthrough

### **STEP 1: Create Folders (1 minute)**

**Using File Explorer:**
- Open: `C:\xampp\htdocs\lost_and_found_web\`
- Right-click → New Folder → Name: `uploads`
- Inside uploads, right-click → New Folder → Name: `profiles`

**Using PowerShell:**
```powershell
cd C:\xampp\htdocs\lost_and_found_web
mkdir uploads
mkdir uploads/profiles
```

---

### **STEP 2: Start XAMPP (1 minute)**

```
1. Click Start menu
2. Search for "XAMPP Control Panel"
3. Open XAMPP Control Panel
4. Click "Start" next to Apache
5. Click "Start" next to MySQL
6. Wait for both to show "Running" (green)
```

---

### **STEP 3: Open Website (30 seconds)**

```
1. Open web browser (Chrome, Firefox, Edge)
2. Type in address bar: http://localhost/lost_and_found_web/
3. Press Enter
4. You should see the Home Page
```

---

### **STEP 4: Test Features (5 minutes)**

```
A. Register:
   1. Click "Register" button
   2. Fill form with test data
   3. Click "Register"
   
B. Login:
   1. Click "Login" button
   2. Enter email and password
   3. Click "Login"
   
C. Post Item:
   1. Click "Post Item" button
   2. Fill: Type, Title, Description, Category, Location
   3. Click "Post Item"
   
D. Browse Feed:
   1. Click "Find Items"
   2. See your item in Twitter-like feed
   3. Try Comment and Claim buttons
```

---

## 🎨 What You'll See

### **Home Page**
```
┌─────────────────────────────────┐
│      Lost & Found Website       │
├─────────────────────────────────┤
│                                 │
│  [Register] [Login]             │
│                                 │
│  Featured Items:                │
│  ┌─────────────────────────┐    │
│  │ Lost Book - $10 Reward  │    │
│  │ Posted yesterday        │    │
│  └─────────────────────────┘    │
│                                 │
│  [Post Item]  [Find Items]      │
│                                 │
└─────────────────────────────────┘
```

### **Feed (Twitter Style)**
```
┌──────────────┬─────────────┬──────────────┐
│ Filters:     │             │ Status:      │
│ Lost / Found │  Feed Items │ Login       │
│ Category     │             │ Post Item   │
│ Search       │ ┌─────────┐ │             │
│              │ │ 👤 John │ │             │
│              │ │ @john   │ │             │
│              │ │ LOST    │ │             │
│              │ │ Lost Key│ │             │
│              │ │ Black   │ │             │
│              │ │ office  │ │             │
│              │ │ key...  │ │             │
│              │ │🖼️[image]│ │             │
│              │ │💬 📍 👁 │ │             │
│              │ │          │ │             │
│              │ │ Comments:│ │             │
│              │ │ @jane: I │ │             │
│              │ │ saw one  │ │             │
│              │ └─────────┘ │             │
│              │             │             │
│              │ ┌─────────┐ │             │
│              │ │ 👤 Jane │ │             │
│              │ │ @jane   │ │             │
│              │ │ ✓ FOUND │ │             │
│              │ │[2 days] │ │             │
│              │ │ Found... │ │             │
│              │ └─────────┘ │             │
└──────────────┴─────────────┴──────────────┘
```

---

## ✅ Confirm Everything Works

After following the steps, you should be able to:

- ✅ See home page at http://localhost/lost_and_found_web/
- ✅ Register new accounts
- ✅ Upload profile pictures
- ✅ Login with credentials
- ✅ Post items with images
- ✅ See items in Twitter-like feed
- ✅ Filter by type and category
- ✅ Search for items
- ✅ View other users' profiles
- ✅ Comment and claim items
- ✅ See profile with education details

---

## 🆘 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Cannot reach localhost" | Start Apache in XAMPP Control Panel |
| White/blank page | Press F12, check Console; Clear cache (Ctrl+Shift+Del) |
| Can't upload images | Create `uploads/` and `uploads/profiles/` folders |
| Login fails | Verify MySQL is running; Clear browser cookies |
| Database error | Open phpMyAdmin, verify `lost_and_found` database exists |
| 404 File Not Found | Check all files are in `C:\xampp\htdocs\lost_and_found_web\` |

---

## 📞 Need More Help?

1. Check **SETUP_AND_RUN.md** for detailed instructions
2. Check **QUICK_RUN.md** for a checklist
3. Check **FEATURES.md** for what the website does
4. Press F12 in browser and check "Console" for error messages

---

**🚀 Ready to start? Follow these 4 simple steps above!**
