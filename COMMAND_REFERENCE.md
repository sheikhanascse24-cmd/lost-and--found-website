# Command Reference & Useful Links

## 🌐 Website URLs (Once Running)

```
Main Website:     http://localhost/lost_and_found_web/
Home Page:        http://localhost/lost_and_found_web/index.html
Find Items Feed:  http://localhost/lost_and_found_web/feed.html
Post Item:        http://localhost/lost_and_found_web/post-item.html
Login:            http://localhost/lost_and_found_web/login.html
Register:         http://localhost/lost_and_found_web/register.html
User Profile:     http://localhost/lost_and_found_web/user-profile.html
Item Details:     http://localhost/lost_and_found_web/item-detail.html
Dashboard:        http://localhost/lost_and_found_web/dashboard.html
phpMyAdmin:       http://localhost/phpmyadmin
XAMPP Homepage:   http://localhost/
```

---

## 💻 PowerShell Commands

### **Create Upload Folders**
```powershell
cd C:\xampp\htdocs\lost_and_found_web
mkdir uploads
mkdir uploads/profiles
```

### **Check If Folders Exist**
```powershell
Test-Path "C:\xampp\htdocs\lost_and_found_web\uploads"
Test-Path "C:\xampp\htdocs\lost_and_found_web\uploads\profiles"
```

### **List All Files in Project**
```powershell
cd C:\xampp\htdocs\lost_and_found_web
Get-ChildItem -Recurse
```

### **Start Apache (Command Line)**
```powershell
& "C:\xampp\apache\bin\httpd.exe"
```

### **Start MySQL (Command Line)**
```powershell
& "C:\xampp\mysql\bin\mysqld.exe"
```

### **Stop Apache**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "httpd"} | Stop-Process
```

### **Stop MySQL**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "mysqld"} | Stop-Process
```

---

## 🗄️ MySQL / Database Commands

### **Login to MySQL (Command Line)**
```bash
mysql -u root -p
# Press Enter when asked for password (no password by default in XAMPP)
```

### **View All Databases**
```sql
SHOW DATABASES;
```

### **Select Database**
```sql
USE lost_and_found;
```

### **View All Tables**
```sql
SHOW TABLES;
```

### **View Users Table**
```sql
SELECT * FROM users;
```

### **View Items Table**
```sql
SELECT * FROM items;
```

### **View Responses (Comments/Claims)**
```sql
SELECT * FROM responses;
```

### **Count Total Users**
```sql
SELECT COUNT(*) FROM users;
```

### **Count Total Items**
```sql
SELECT COUNT(*) FROM items;
```

### **Find User by Email**
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

### **Find All Lost Items**
```sql
SELECT * FROM items WHERE type = 'lost' AND status = 'active';
```

### **Find All Found Items**
```sql
SELECT * FROM items WHERE type = 'found' AND status = 'active';
```

### **Find All Claimed Items (Status = resolved)**
```sql
SELECT * FROM items WHERE status = 'resolved';
```

### **Delete a User**
```sql
DELETE FROM users WHERE id = 1;
```

### **Reset Database (Delete All Data but Keep Tables)**
```sql
-- Delete all data from tables (in order to avoid foreign key issues)
DELETE FROM responses;
DELETE FROM messages;
DELETE FROM items;
DELETE FROM users;
```

### **Drop Database (Delete Everything)**
```sql
DROP DATABASE lost_and_found;
```

---

## 🔧 File Locations

### **Project Root**
```
C:\xampp\htdocs\lost_and_found_web\
```

### **API Files**
```
C:\xampp\htdocs\lost_and_found_web\api\
```

### **Styles (CSS)**
```
C:\xampp\htdocs\lost_and_found_web\css\
```

### **Scripts (JavaScript)**
```
C:\xampp\htdocs\lost_and_found_web\js\
```

### **Uploaded Images (Items)**
```
C:\xampp\htdocs\lost_and_found_web\uploads\
```

### **Uploaded Profile Pictures**
```
C:\xampp\htdocs\lost_and_found_web\uploads\profiles\
```

### **XAMPP Installation**
```
C:\xampp\
```

### **XAMPP Apache**
```
C:\xampp\apache\
```

### **XAMPP MySQL**
```
C:\xampp\mysql\
```

### **Web Root (htdocs)**
```
C:\xampp\htdocs\
```

---

## 📂 File Editing

### **Edit Database Connection**
```
File: C:\xampp\htdocs\lost_and_found_web\api\db_connection.php

If you need to change:
- Database name: Change "lost_and_found" 
- Username: Change "root"
- Password: Add password here
- Host: Keep as "localhost"
```

### **Edit API Endpoint Paths**
```
Files using API:
- js/auth.js
- js/login.js
- js/register.js
- js/feed.js
- js/post-item.js
- js/user-profile.js

If you move api/ folder, update all apiCall() function paths
```

---

## 🔍 Debugging & Checking

### **Check Apache is Working**
1. Open browser
2. Go to: http://localhost/
3. Should see Apache welcome page

### **Check MySQL is Working**
1. Open browser
2. Go to: http://localhost/phpmyadmin
3. Should see phpMyAdmin login page

### **Check Website Files**
1. Open: C:\xampp\htdocs\lost_and_found_web\
2. Should see all HTML files (index.html, feed.html, etc.)
3. Should see api/, css/, js/ folders
4. Should see uploads/ and uploads/profiles/ folders

### **Check Browser Console for Errors**
1. In browser, press F12
2. Click "Console" tab
3. Look for red errors or warnings
4. Most common: 404 (file not found), 500 (server error)

### **Check Network Requests**
1. In browser, press F12
2. Click "Network" tab
3. Reload page
4. Look for red X marks (failed requests)
5. Click on request to see response

### **View Page Source**
1. Right-click on page
2. Click "View Page Source" or "Inspect"
3. Check HTML structure

---

## 🔐 Default Credentials

### **MySQL (XAMPP)**
```
Username: root
Password: (blank/empty)
Host: localhost
Port: 3306
```

### **phpMyAdmin**
```
Username: root
Password: (blank/empty)
URL: http://localhost/phpmyadmin
```

### **Test User Accounts** (Create these yourself)
```
Account 1:
- Email: user1@test.com
- Password: password123
- Username: user1

Account 2:
- Email: user2@test.com
- Password: password123
- Username: user2
```

---

## 🐛 Error Messages & Solutions

| Error | Meaning | Solution |
|-------|---------|----------|
| **Connection refused** | Can't connect to MySQL | Start MySQL in XAMPP |
| **404 Not Found** | File doesn't exist | Check file location and spelling |
| **500 Internal Server Error** | PHP error in script | Check browser console, check database connection |
| **Access Denied for user 'root'** | MySQL credentials wrong | Check db_connection.php |
| **Table 'lost_and_found.users' doesn't exist** | Database not set up | Import database.sql to create tables |
| **CORS Error** | Cross-origin request blocked | Usually not an issue locally |
| **Undefined variable** | Variable not set | Check PHP code, check console for warnings |

---

## 📊 Testing Data

### **Sample User to Create**
```
Name: John Doe
Email: john@test.com
Password: password123
Username: johndoe
Phone: 1234567890
Address: 123 Main St
Branch: Computer Science
Semester: 3rd
Section: A
Profile Picture: (optional)
```

### **Sample Item to Post**
```
Type: Lost
Title: Black iPhone 13
Description: Lost black iPhone 13 with blue case near library
Category: Electronics
Location: Campus Library
Date: 2026-04-18
Image: (optional)
```

---

## 📚 Important Files Reference

| File | Purpose |
|------|---------|
| **api/db_connection.php** | Database connection - DON'T MODIFY |
| **api/register.php** | Handles user registration |
| **api/login.php** | Handles user login |
| **api/post_item.php** | Handles item posting |
| **api/get_items.php** | Fetches items for feed |
| **api/add_comment.php** | Adds comments/claims |
| **js/auth.js** | Authentication utilities |
| **js/feed.js** | Feed page functionality |
| **css/feed.css** | Feed styling |
| **database.sql** | Database schema (already imported) |

---

## ⚡ Quick Commands

### **Open PowerShell in Project Folder**
```
1. Navigate to: C:\xampp\htdocs\lost_and_found_web\
2. Hold Shift + Right-click
3. Click "Open PowerShell window here"
```

### **Open File Explorer**
```
1. Press Windows Key + E
2. Navigate to: C:\xampp\htdocs\lost_and_found_web\
```

### **Clear Browser Cache**
```
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check all boxes
4. Click "Clear data"
5. Refresh browser (F5)
```

### **Restart Browser**
```
1. Close all browser windows
2. Wait 5 seconds
3. Open browser again
4. Visit http://localhost/lost_and_found_web/
```

### **Restart XAMPP**
```
1. Click "Stop" on Apache
2. Click "Stop" on MySQL
3. Wait 10 seconds
4. Click "Start" on MySQL
5. Click "Start" on Apache
6. Wait 5 seconds
7. Refresh browser
```

---

## 📖 Documentation Files

After setup, read these for more information:

1. **SETUP_AND_RUN.md** - Detailed setup instructions
2. **QUICK_RUN.md** - Quick checklist
3. **VISUAL_GUIDE.md** - Visual diagrams
4. **FEATURES.md** - List of all features
5. **COMPLETE_GUIDE.md** - Complete implementation guide
6. **FOUND_ITEMS_FEATURE.md** - Auto-deletion feature details
7. **README.md** - General documentation
8. **PROJECT_SUMMARY.md** - Project overview

---

## 🎯 Next Steps

1. **Follow QUICK_RUN.md** checklist
2. **Create upload folders** if not done
3. **Start XAMPP services**
4. **Visit http://localhost/lost_and_found_web/**
5. **Register test account**
6. **Post test item**
7. **Browse feed**
8. **Test all features**

---

**Everything you need to know is here! Start with the 4 steps in QUICK_RUN.md** 🚀
