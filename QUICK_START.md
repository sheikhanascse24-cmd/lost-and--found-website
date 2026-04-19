# Quick Start Guide

## 1. Database Setup (First Time Only)

1. Open **phpMyAdmin** at `http://localhost/phpmyadmin`
2. Create new database: `lost_and_found`
3. Click on the database, go to **SQL** tab
4. Copy & paste contents of `database.sql` file
5. Click **Go** to execute

## 2. Create Uploads Folder

In the `lost_and_found_web` folder, create a new folder named `uploads` for storing item images.

## 3. Start the Website

1. Open XAMPP Control Panel
2. Click **Start** for Apache
3. Click **Start** for MySQL
4. Open browser and visit: `http://localhost/lost_and_found_web/`

## 4. Test the Website

### Create Test Account
1. Click "Register"
2. Fill in the form with test data
3. Click "Register"
4. Login with your credentials

### Post an Item
1. Click "Post Item"
2. Fill in item details (Lost/Found, title, description, etc.)
3. Optionally add a photo
4. Click "Post Item"

### Browse Items
1. Click "Browse Items"
2. Use filters to search (type, category, keywords)
3. Click on any item to see details
4. Send message to item poster

## Database Credentials

- **Host**: localhost
- **User**: root
- **Password**: (empty)
- **Database**: lost_and_found

## File Permissions

Make sure the `uploads` folder has write permissions:
- Windows: Usually automatic
- Linux/Mac: `chmod 755 uploads`

## Troubleshooting

### Error: "Database connection failed"
- Check MySQL is running in XAMPP
- Verify credentials in `api/db_connection.php`

### Images not uploading
- Check `uploads` folder exists
- Verify folder has write permissions
- Check file size (max 5MB)
- Supported formats: JPG, PNG, GIF

### Page shows blank
- Open browser console (F12)
- Check for JavaScript errors
- Check Network tab for API errors

### Can't login
- Make sure database is populated (run database.sql)
- Check email/password spelling
- Try resetting with new account

## API Endpoints

All backend APIs are in the `api/` folder:

- `register.php` - POST: user registration
- `login.php` - POST: user login
- `post_item.php` - POST: create new item
- `get_items.php` - GET: list items with filters
- `get_item.php` - GET: single item details
- `messages.php` - GET/POST: messaging
- `user_dashboard.php` - GET: user profile & items

## Important Notes

1. **Browser Storage**: Login info is saved in localStorage (browser storage)
2. **Image Path**: Images stored as relative paths in uploads folder
3. **Categories**: Fixed list of 9 categories - add more in database if needed
4. **Full Text Search**: Uses MySQL FULLTEXT index on title & description

Enjoy!
