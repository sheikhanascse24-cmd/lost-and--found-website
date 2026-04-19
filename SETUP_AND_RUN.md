# Lost & Found Website - Setup & Running Guide

## ✅ Step-by-Step Instructions to Run Your Website

---

## **STEP 1: Verify Database Setup** ✓ (Already Done)
You've already created the database and tables. Good! 

To verify your database is set up correctly:
1. Open **phpMyAdmin**: `http://localhost/phpmyadmin`
2. Look for **`lost_and_found`** database in the left sidebar
3. You should see 4 tables:
   - `users` (with columns: id, username, email, password, profile_picture, branch, semester, section, bio, etc.)
   - `items` (with columns: id, user_id, title, description, type, status, image_path, etc.)
   - `messages` (for user-to-user messaging)
   - `responses` (for comments and claims)

---

## **STEP 2: Create Upload Directories**

The website needs folders to store user profile pictures and item images.

### On Windows (Using File Explorer):

1. **Open File Explorer**
2. Navigate to: `C:\xampp\htdocs\lost_and_found_web\`
3. Create two new folders:
   - **`uploads`** (for item images)
   - Inside `uploads`, create another folder: **`profiles`** (for user profile pictures)

**Final structure should look like:**
```
C:\xampp\htdocs\lost_and_found_web\
├── uploads/
│   └── profiles/
├── api/
├── css/
├── js/
├── index.html
├── feed.html
├── register.html
├── login.html
├── post-item.html
└── ... (other files)
```

### Or Using PowerShell (Command Line):

Open **PowerShell** and run:
```powershell
cd C:\xampp\htdocs\lost_and_found_web
mkdir uploads
mkdir uploads/profiles
```

---

## **STEP 3: Start XAMPP Services**

### Method 1: Using XAMPP Control Panel (Easiest)

1. **Open XAMPP Control Panel**
   - Click **Start** menu → Search for "XAMPP Control Panel"
   - Or double-click `C:\xampp\xampp-control.exe`

2. **Start Apache & MySQL:**
   - Click **"Start"** button next to **Apache**
   - Click **"Start"** button next to **MySQL**
   
   ✅ Both should show **green** and say **"Running"**

### Method 2: Using PowerShell (Command Line)

```powershell
# Start Apache
C:\xampp\apache\bin\httpd.exe

# In another PowerShell window, start MySQL
C:\xampp\mysql\bin\mysqld.exe
```

---

## **STEP 4: Open the Website in Browser**

Once Apache and MySQL are running:

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)
2. **Go to:** `http://localhost/lost_and_found_web/`
3. You should see the **Home Page** with:
   - Lost & Found logo/title
   - **Register** button
   - **Login** button
   - Featured items section

✅ **Website is now running!**

---

## **STEP 5: Test the Website**

### Test 1: Register a New Account

1. Click **"Register"** button
2. Fill in the form:
   - **Full Name:** Your name (e.g., "John Doe")
   - **Username:** Your username (e.g., "johndoe")
   - **Email:** Your email (e.g., "john@example.com")
   - **Password:** Any password (min 6 characters)
   - **Phone:** (Optional) Your phone number
   - **Address:** (Optional) Your address
   - **Branch:** (Optional) Your course/program (e.g., "Computer Science")
   - **Semester:** (Optional) Select your semester
   - **Section:** (Optional) Your section (e.g., "A")
   - **Profile Picture:** (Optional) Upload a photo
3. Click **"Register"**
4. ✅ You should see success message → Redirect to Login

### Test 2: Login

1. Enter your **Email** and **Password** from registration
2. Click **"Login"**
3. ✅ You should see "Logged in as @yourusername"

### Test 3: Post an Item

1. Click **"Post Item"** button (or in navigation)
2. Fill in:
   - **Type:** "Lost" or "Found"
   - **Title:** "Lost Phone"
   - **Description:** "Black Samsung phone, please return"
   - **Category:** "Electronics"
   - **Location:** "Campus Main Road"
   - **Date:** When you lost/found it
   - **Image:** (Optional) Click to upload a photo
3. Click **"Post Item"**
4. ✅ Item should appear on the feed

### Test 4: Browse Items (Find Items Feed)

1. Click **"Find Items"** or **"Browse Items"**
2. You should see:
   - Your posted item in **Twitter-like feed format**
   - User profile picture
   - Item title and description
   - Item image
   - **Comment** button 💬
   - **Claim** button ✓
   - **View** button 👁️

### Test 5: Comment on Item

1. **Logout** and **Login with another account** (register another user)
2. Go to **Find Items**
3. Click **💬 Comment** on the first user's item
4. Type a comment and submit
5. ✅ Comment should appear below the item

### Test 6: Claim an Item

1. Click **✓ Claim** on an item
2. Add a message explaining you have the item
3. Submit
4. ✅ Item should show:
   - **"✓ CLAIMED"** badge
   - **"Will disappear in 2 days"** message
   - Comment/Claim buttons disabled

### Test 7: View User Profile

1. Click on any **user's profile picture** in the feed
2. You should see:
   - Their profile picture
   - Name, username, email, phone, address
   - **Education:** Branch, Semester, Section
   - All their posted items
3. ✅ Click an item to view details

---

## **STEP 6: Troubleshooting**

### ❌ Problem: Page shows "Cannot connect to database"

**Solution:**
1. Check MySQL is running in XAMPP Control Panel (green status)
2. Verify database name is `lost_and_found`
3. Open phpMyAdmin and check if tables exist

### ❌ Problem: Images not uploading

**Solution:**
1. Verify folders exist: `C:\xampp\htdocs\lost_and_found_web\uploads\`
2. Check folder permissions (right-click → Properties → Security)
3. Ensure Apache user has write permission

### ❌ Problem: "Folder not found" when accessing website

**Solution:**
1. Verify files are in: `C:\xampp\htdocs\lost_and_found_web\`
2. Check if Apache is running (green "Running" status)
3. Try: `http://localhost/lost_and_found_web/` or `http://127.0.0.1/lost_and_found_web/`

### ❌ Problem: "Cannot find file api/register.php"

**Solution:**
1. Check `api/` folder exists at: `C:\xampp\htdocs\lost_and_found_web\api\`
2. Verify all PHP files are in the folder
3. Restart Apache

### ❌ Problem: Profile pictures not saving

**Solution:**
1. Create folder: `C:\xampp\htdocs\lost_and_found_web\uploads\profiles\`
2. Check folder has write permissions
3. Verify XAMPP apache user can write to folder

---

## **STEP 7: Website Navigation Map**

Once logged in, here's what you can access:

```
HOME PAGE (index.html)
├── Register → Create new account
├── Login → Access account
├── Post Item → Go to upload page
└── Find Items → Go to feed

LOGGED IN MENU
├── Home → Back to homepage
├── Find Items → Browse feed (Twitter style)
│   ├── Filter by Lost/Found
│   ├── Filter by Category
│   ├── Search items
│   ├── Comment on items
│   └── Claim items
├── Post Item → Create new item
├── My Profile → View your profile
│   ├── See your details
│   ├── See your education info
│   └── See items you posted
├── Dashboard → (Optional) Business logic
└── Logout → Exit account
```

---

## **STEP 8: Access Important Pages**

### **Direct URLs you can visit:**

- **Home:** `http://localhost/lost_and_found_web/`
- **Feed (Find Items):** `http://localhost/lost_and_found_web/feed.html`
- **Post Item:** `http://localhost/lost_and_found_web/post-item.html`
- **Login:** `http://localhost/lost_and_found_web/login.html`
- **Register:** `http://localhost/lost_and_found_web/register.html`
- **User Profile:** `http://localhost/lost_and_found_web/user-profile.html`
- **phpMyAdmin:** `http://localhost/phpmyadmin`

---

## **STEP 9: Helpful Tips**

### 📱 Test on Mobile
While developing, test on your mobile phone:
1. Find your computer's IP: Open PowerShell and type `ipconfig`
2. Look for "IPv4 Address" (usually starts with 192.168.x.x)
3. On phone, visit: `http://[YOUR_IP]:80/lost_and_found_web/`
4. Example: `http://192.168.1.100/lost_and_found_web/`

### 🔍 Check Browser Console for Errors
1. Press **F12** → Open Developer Tools
2. Go to **Console** tab
3. Look for any red error messages
4. Share errors if troubleshooting needed

### 💾 Clear Browser Cache
If pages don't update:
1. Press **Ctrl + Shift + Delete** (or **Cmd + Shift + Delete** on Mac)
2. Select "All time"
3. Check "Cookies and other site data" + "Cached images and files"
4. Click **"Clear data"**
5. Refresh page

### 📝 Test User Accounts

To easily test, create multiple accounts:
- User 1: johndoe / john@test.com / password123
- User 2: janedoe / jane@test.com / password123

Then:
- User 1 posts items
- User 2 comments/claims items
- Switch between accounts to test features

---

## **STEP 10: When Everything Works ✅**

You should be able to:
- ✅ Register new users
- ✅ Login/Logout
- ✅ Upload profile pictures
- ✅ Post items (lost/found)
- ✅ Upload item images
- ✅ Browse items in Twitter-like feed
- ✅ Filter by Lost/Found/Category
- ✅ Search items
- ✅ Comment on items
- ✅ Claim items
- ✅ View other users' profiles
- ✅ See your profile with education details
- ✅ Claimed items disappear after 2 days
- ✅ All responsive design works on mobile

---

## **Quick Reference Checklist**

- [ ] Database created (`lost_and_found`)
- [ ] All 4 tables created (users, items, messages, responses)
- [ ] Upload folders created (`uploads/` and `uploads/profiles/`)
- [ ] Files copied to `C:\xampp\htdocs\lost_and_found_web\`
- [ ] Apache started in XAMPP Control Panel
- [ ] MySQL started in XAMPP Control Panel
- [ ] Visited `http://localhost/lost_and_found_web/` in browser
- [ ] Registered test account
- [ ] Logged in successfully
- [ ] Posted a test item
- [ ] Viewed feed with Twitter-like layout
- [ ] Tested profile viewing
- [ ] Claimed an item to see "✓ CLAIMED" badge

---

## **Need Help?**

If you encounter issues:

1. **Check Apache/MySQL Status**: Make sure both are running (green in Control Panel)
2. **Check File Location**: All files should be in `C:\xampp\htdocs\lost_and_found_web\`
3. **Check Folders Exist**: `uploads/` and `uploads/profiles/`
4. **Check Database**: Open phpMyAdmin and verify `lost_and_found` database exists
5. **Check Browser Console**: Press F12 and look for error messages
6. **Restart XAMPP**: Stop and restart Apache/MySQL

---

**🎉 Your website is ready to run!**

Start with **STEP 3** (Start XAMPP) and **STEP 4** (Open in Browser).

Enjoy your Lost & Found website! 🚀
