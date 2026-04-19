# Lost & Found Website - Quick Start Checklist

## ⚡ 5-Minute Quick Start

### 1️⃣ Create Upload Folders
```
Go to: C:\xampp\htdocs\lost_and_found_web\
Create folder: uploads
Create folder: uploads\profiles
```

### 2️⃣ Start XAMPP Services
- Open XAMPP Control Panel
- Click "Start" next to Apache ✅ (should turn green & say "Running")
- Click "Start" next to MySQL ✅ (should turn green & say "Running")

### 3️⃣ Open Website
- Open browser (Chrome, Firefox, Edge)
- Go to: **http://localhost/lost_and_found_web/**
- You should see the Home Page

### 4️⃣ Register & Test
```
1. Click "Register"
2. Fill in form (all fields optional except email/password/username)
3. Click "Register"
4. Login with email & password
5. Click "Post Item" to create a test item
6. Click "Find Items" to see Twitter-like feed
7. Try commenting and claiming items
```

---

## ✅ Verification Checklist

Run through this to verify everything is working:

### Database Setup
- [ ] Opened phpMyAdmin at http://localhost/phpmyadmin
- [ ] Database `lost_and_found` exists
- [ ] Table `users` exists
- [ ] Table `items` exists
- [ ] Table `messages` exists
- [ ] Table `responses` exists

### Folders Created
- [ ] Folder exists: `C:\xampp\htdocs\lost_and_found_web\uploads\`
- [ ] Folder exists: `C:\xampp\htdocs\lost_and_found_web\uploads\profiles\`

### Services Running
- [ ] Apache is running (green in XAMPP Control Panel)
- [ ] MySQL is running (green in XAMPP Control Panel)

### Website Access
- [ ] Can access http://localhost/lost_and_found_web/
- [ ] See Home Page with Register/Login buttons
- [ ] Page loads without errors (F12 console shows no red errors)

### Registration Works
- [ ] Can click "Register" button
- [ ] Registration form opens
- [ ] Can fill form with test data
- [ ] Can click "Register" button
- [ ] Success message appears (or redirects to login)

### Login Works
- [ ] Can click "Login" button
- [ ] Can enter email and password from registration
- [ ] Can click "Login" button
- [ ] Successfully logged in (see username in top right)

### Posting Items Works
- [ ] Can click "Post Item" button
- [ ] Can fill item form (title, description, etc.)
- [ ] Can upload item image (if available)
- [ ] Can click "Post Item" button
- [ ] Item successfully posted

### Feed Display Works
- [ ] Can click "Find Items" to see feed
- [ ] See items in Twitter-like format
- [ ] Each item shows: profile picture, user name, title, description, image
- [ ] Can see "Comment", "Claim", and "View" buttons
- [ ] Can filter by Lost/Found
- [ ] Can filter by Category
- [ ] Can search items

### Profiles Work
- [ ] Can click user's profile picture from feed
- [ ] User profile page opens
- [ ] Can see: name, email, phone, address, education fields
- [ ] Can see all user's posted items

### Interaction Works
- [ ] Can click "Comment" button
- [ ] Modal appears for adding comment
- [ ] Can type comment and submit
- [ ] Comment appears below item
- [ ] Can click "Claim" button
- [ ] Modal appears for claiming item
- [ ] Can submit claim
- [ ] Item shows "✓ CLAIMED" badge
- [ ] Item shows "Will disappear in 2 days" message

### Profile Pictures Work (Optional)
- [ ] Profile picture uploads during registration
- [ ] Profile picture appears on user posts
- [ ] Profile picture appears in user profile
- [ ] Profile picture appears on comments

### Responsive Design Works (Optional)
- [ ] Resize browser window - layout adjusts
- [ ] On mobile (F12 → toggle device toolbar) - single column layout
- [ ] All buttons are clickable on mobile
- [ ] Images scale properly

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Cannot access localhost"** | Start Apache in XAMPP Control Panel |
| **"Database connection error"** | Start MySQL in XAMPP Control Panel |
| **"404 Not Found"** | Check files are in `C:\xampp\htdocs\lost_and_found_web\` |
| **"Images won't upload"** | Create `uploads/` and `uploads/profiles/` folders |
| **"Blank/white page"** | Press F12, check Console for errors; Clear browser cache |
| **"Cannot upload profile picture"** | Check folder: `uploads/profiles/` exists and has write permission |
| **"Login doesn't work"** | Check MySQL is running; Clear browser cookies (Ctrl+Shift+Delete) |

---

## 📞 If Still Not Working

1. **Verify File Location:**
   ```
   C:\xampp\htdocs\lost_and_found_web\
   ├── index.html
   ├── feed.html
   ├── api/
   │   ├── db_connection.php
   │   ├── register.php
   │   ├── login.php
   │   └── ... (other files)
   ├── js/
   ├── css/
   ├── uploads/
   └── uploads/profiles/
   ```

2. **Check Apache Working:**
   - Should be able to visit: http://localhost/
   - Should see Apache page (or "It works!")

3. **Check MySQL Working:**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Should see list of databases

4. **Check for Errors:**
   - Press F12 in browser
   - Go to "Console" tab
   - Look for red error messages
   - Look for "404" or "500" errors

5. **Restart Everything:**
   - Stop Apache (XAMPP Control Panel → Stop)
   - Stop MySQL (XAMPP Control Panel → Stop)
   - Wait 5 seconds
   - Start MySQL (XAMPP Control Panel → Start)
   - Start Apache (XAMPP Control Panel → Start)
   - Try again

---

## 📱 Access on Phone (Same WiFi Network)

1. Find your computer IP:
   - Open PowerShell: `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On your phone (connected to same WiFi):
   - Open browser
   - Go to: `http://[YOUR_IP]/lost_and_found_web/`
   - Example: `http://192.168.1.100/lost_and_found_web/`

---

## 🎯 Features to Test

✅ Registration with education fields  
✅ Profile picture upload  
✅ Login/Logout  
✅ Post Lost/Found items  
✅ Twitter-like feed  
✅ Comment on items  
✅ Claim items  
✅ View user profiles  
✅ See education details  
✅ Claimed items expire after 2 days  
✅ Responsive design  

---

**Ready? Follow the 5-Minute Quick Start above! 🚀**
