# Lost & Found Website

A full-featured web application for reporting and discovering lost and found items.

## Features

- **User Authentication**: Register and login with email
- **Post Items**: Report lost or found items with photos and detailed descriptions
- **Search & Filter**: Browse items by type, category, location, or keywords
- **User Dashboard**: Manage your posted items and view your profile
- **Messaging System**: Contact other users about items
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Backend**: PHP with MySQL database
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Server**: XAMPP (Apache + MySQL)

## Setup Instructions

### 1. Database Setup

1. Open phpMyAdmin (usually at `http://localhost/phpmyadmin`)
2. Create a new database named `lost_and_found`
3. Navigate to the SQL tab and paste the contents of `database.sql`
4. Execute the SQL queries to create all tables

### 2. Configure the Project

Update the database connection in `api/db_connection.php` if needed:
- Default: `localhost`, user: `root`, password: empty

Create the `uploads` folder for image storage:
```
mkdir uploads
```

### 3. Start the Server

Open XAMPP Control Panel:
1. Start **Apache**
2. Start **MySQL**
3. Open browser and go to: `http://localhost/lost_and_found_web/`

## File Structure

```
lost_and_found_web/
├── api/                      # PHP backend APIs
│   ├── db_connection.php      # Database configuration
│   ├── register.php           # User registration API
│   ├── login.php              # User login API
│   ├── post_item.php          # Post new item API
│   ├── get_items.php          # Get items with filters
│   ├── get_item.php           # Get single item details
│   ├── messages.php           # Messaging API
│   └── user_dashboard.php     # User dashboard data API
├── css/
│   └── styles.css             # All styling
├── js/
│   ├── auth.js               # Authentication utilities
│   ├── login.js              # Login page logic
│   ├── register.js           # Register page logic
│   ├── home.js               # Home page logic
│   ├── browse.js             # Browse items logic
│   ├── post-item.js          # Post item form logic
│   ├── item-detail.js        # Item detail page logic
│   └── dashboard.js          # Dashboard logic
├── uploads/                  # User uploaded images (created automatically)
├── index.html                # Home page
├── login.html                # Login page
├── register.html             # Registration page
├── browse.html               # Browse items page
├── post-item.html            # Post item page
├── item-detail.html          # Item detail page
├── dashboard.html            # User dashboard
├── database.sql              # Database schema
└── README.md                 # This file
```

## Usage

### For First-Time Users

1. Go to the **Register** page
2. Create a new account with your details
3. Login with your credentials
4. Go to **Post Item** to report a lost/found item
5. Browse other items and message users about matches

### Features

#### Posting Items
- Choose if item is Lost or Found
- Add detailed description and photos
- Specify category and location
- Set the date the item was lost/found

#### Searching
- Filter by Lost/Found type
- Filter by category (electronics, documents, jewelry, etc.)
- Search by keywords
- Pagination for browsing results

#### Messaging
- Contact item posters directly
- Discuss item details
- Arrange handover/recovery

#### Dashboard
- View all your posted items
- Track item status (active, resolved, closed)
- Check incoming messages
- Manage your profile

## Default Categories

- Electronics (phones, laptops, tablets, etc.)
- Documents (IDs, certificates, passports)
- Jewelry (rings, bracelets, necklaces)
- Keys
- Wallet/Money
- Phones
- Bags/Luggage
- Clothing
- Other

## Image Upload

- Supported formats: JPG, PNG, GIF
- Max file size: 5MB
- Images are stored in the `uploads/` folder
- Optional: Leave blank if no image available

## Database Tables

### users
- id, username, email, password, full_name, phone, address, created_at, updated_at

### items
- id, user_id, title, description, category, type (lost/found), status, location, date_occurred, image_path, created_at, updated_at

### messages
- id, sender_id, receiver_id, item_id, message_text, read_status, created_at

### responses
- id, item_id, user_id, comment_text, created_at

## Session Management

- Logged-in user data is stored in browser's localStorage
- Files that require login will redirect to login page
- Session data includes: user id, username, email, full name

## Security Notes

- Passwords are hashed using bcrypt
- SQL queries use prepared statements to prevent injection
- Validate all user inputs on both client and server side
- Consider adding:
  - Email verification
  - Rate limiting on API calls
  - File upload size validation
  - XSS protection headers
  - CSRF tokens

## Future Enhancements

- Email notifications for messages
- User reputation/rating system
- Item status timeline
- Admin panel
- Advanced search filters
- Map integration for locations
- Photo gallery with multiple images
- Two-factor authentication
- Social media sharing

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Check phpMyAdmin for database connectivity
3. Verify XAMPP services are running
4. Check file permissions in uploads folder
5. Verify database credentials in `api/db_connection.php`

## License

This project is open source and available under the MIT License.
