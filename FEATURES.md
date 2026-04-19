# Lost & Found Website - Updated Features & Architecture# Lost & Found Website - Updated Features & Architecture

























































































































































































































































































































































Enjoy your Lost & Found website!- Further feature additions- Deployment to production server- Testing and customization- Local development on XAMPPAll features are fully implemented and ready for:## 🎉 Ready to Use!| `/api/user_dashboard.php` | GET | User dashboard data || `/api/messages.php` | GET/POST | Send/receive messages || `/api/get_user_profile.php` | GET | Get user profile || `/api/add_comment.php` | POST | Add comment/claim || `/api/get_comments.php` | GET | Get item comments || `/api/get_item.php` | GET | Get single item || `/api/get_items.php` | GET | List items with filters || `/api/post_item.php` | POST | Post new item || `/api/login.php` | POST | User login || `/api/register.php` | POST | Create new account ||----------|--------|---------|| Endpoint | Method | Purpose |## ⚙️ API Endpoints Summary- Item tracking history- Notifications system- Dark theme- Two-factor authentication- Password recovery- Email verification- Admin dashboard- Multiple images per item- Advanced search with maps- User ratings/reviews- Email notifications## 📊 Future Enhancements- **Item Images**: `/uploads/items/` (currently uses uploads/ root)- **Profile Pictures**: `/uploads/profiles/`## 🚦 File Upload PathsThese fields help students identify others from their class/batch.- **Section**: Class section (A, B, C, etc.)- **Semester**: 1st through 8th semester- **Branch**: Course or degree program name## 🎓 Education Fields- Message history- Track unread messages- Reference items in messages- Direct user-to-user messaging## 📧 Messaging System- **Closed** - Item no longer available- **Resolved** - Item found/returned to owner- **Active** - Item is being searched/offered## 🔄 Status Lifecycle9. Other8. Clothing7. Bag/Luggage6. Phone5. Wallet/Money4. Keys3. Jewelry2. Documents1. Electronics## 📝 Categories Available- Light: #ECF0F1- Dark: #2C3E50- Danger: #E74C3C (Red)- Secondary: #50C878 (Green)- Primary: #4A90E2 (Blue)## 🎨 Color Scheme- Extra Small (<480px): Optimized for phones- Mobile (480px-767px): Single column- Tablet (768px-1199px): Adjusted grid- Desktop (1200px+): Full sidebar layout## 📱 Responsive Design- File upload validation (images only)- User verification via email (can be added)- Session-based authentication- SQL injection protection via escaped queries- Passwords hashed with bcrypt## 🔒 Security Features- Claim appears with green badge- Post claim- Add message (e.g., "I have this item, how do I return it?")- Check "Mark as claim" if you have the item- Click "✓ Claim" on an item### Claiming Items:- Post as regular comment- Add your message (e.g., "I saw this item at...")- Click "💬 Comment" on any item### Adding Comments:## 💬 Comments & Claims System3. Send message button to contact them   - All their posted items   - Education (Branch, Semester, Section)   - Phone & address   - Username   - Name   - Profile picture2. See their:1. Click any user's profile picture in feed### Viewing Profiles:4. Item appears on feed3. Click "Post Item"   - Add image (optional)   - Set date   - Choose location   - Select category   - Write description   - Add title   - Select Lost or Found2. Fill form:1. Click "Post Item"### Posting Items:7. Click "👁️ View" to see full item details6. Click "💬 Comment" to add comments5. Click "✓ Claim" to claim you have the item4. Click on user profile picture to see full profile3. View items in feed format   - Search keywords   - Category   - Lost/Found type2. Filter by:1. Click "Find Items" in navigation### Browsing Items (Find Items - Feed):4. Post items or browse items3. Login with credentials   - Profile Picture (optional)   - Section (optional)   - Semester (optional)   - Branch (optional)   - Address (optional)   - Phone (optional)   - Password   - Email   - Username   - Full name2. Click "Register" → Fill registration form with:1. Visit Home Page### First Time User:## 🎯 User Flow- Open browser: `http://localhost/lost_and_found_web/`### Step 4: Access Website3. Start MySQL2. Start Apache1. Open XAMPP Control Panel### Step 3: Start Services```mkdir uploads/itemsmkdir uploads/profilesmkdir uploads```bash### Step 2: Create Directories   - Click Go   - Paste contents of `database.sql`   - Go to SQL tab   - Select the database3. Import `database.sql`:2. Create database: `lost_and_found`1. Open phpMyAdmin at `http://localhost/phpmyadmin`### Step 1: Database Setup## 🚀 Setup Instructions```- created_at (TIMESTAMP)- read_status (BOOLEAN)- message_text (TEXT)- item_id (INT - Foreign Key)- receiver_id (INT - Foreign Key)- sender_id (INT - Foreign Key)- id (INT)```sql### Messages Table```- created_at (TIMESTAMP)- is_claim (BOOLEAN) - NEW: TRUE if user claims to have item- comment_text (TEXT)- user_id (INT - Foreign Key)- item_id (INT - Foreign Key)- id (INT)```sql### Responses Table (Comments/Claims) - Enhanced```- updated_at (TIMESTAMP)- created_at (TIMESTAMP)- image_path (VARCHAR)- date_occurred (DATE)- location (VARCHAR)- status (ENUM: 'active', 'resolved', 'closed')- type (ENUM: 'lost', 'found')- category (VARCHAR)- description (TEXT)- title (VARCHAR)- user_id (INT - Foreign Key)- id (INT)```sql### Items Table```- updated_at (TIMESTAMP)- created_at (TIMESTAMP)- bio (TEXT) - NEW- section (VARCHAR) - NEW: A, B, C, etc.- semester (VARCHAR) - NEW: 1-8- branch (VARCHAR) - NEW: Course/Program- profile_picture (VARCHAR) - NEW- address (TEXT)- phone (VARCHAR)- full_name (VARCHAR)- password (VARCHAR - bcrypt hashed)- email (VARCHAR)- username (VARCHAR)- id (INT)```sql### Users Table (Enhanced)## 🗄️ Database Schema Updates```└── PROJECT_SUMMARY.md                 # Project overview├── QUICK_START.md                     # Quick setup guide├── README.md                          # Full documentation├── database.sql                       # Database schema├── dashboard.html                     # User dashboard├── user-profile.html                  # User profile display├── item-detail.html                   # Item details page├── post-item.html                     # Upload/post items├── feed.html                          # Find items (Twitter-like)├── register.html                      # Register with education & profile pic├── login.html                         # Login page├── index.html                         # Home page│   └── items/                         # Item images│   ├── profiles/                      # User profile pictures├── uploads/│   └── dashboard.js                   # User dashboard│   ├── user-profile.js                # User profile display│   ├── item-detail.js                 # Item detail page│   ├── post-item.js                   # Post item form│   ├── feed.js                        # Feed/items feed with comments│   ├── home.js                        # Home page logic│   ├── register.js                    # Register with profile picture│   ├── login.js                       # Login page logic│   ├── auth.js                        # Authentication utilities├── js/│   └── profile.css                    # User profile styling│   ├── feed.css                       # Twitter-like feed styles│   ├── styles.css                     # Main styling├── css/│   └── user_dashboard.php             # User dashboard│   ├── messages.php                   # Messaging system│   ├── get_user_profile.php           # Get user profile info│   ├── add_comment.php                # Add comment/claim to item│   ├── get_comments.php               # Get comments/claims for items│   ├── get_item.php                   # Single item details│   ├── get_items.php                  # Get items with filters│   ├── post_item.php                  # Post new item│   ├── login.php                      # User login│   ├── register.php                   # User registration (with profile picture)│   ├── db_connection.php              # Database connection config├── api/lost_and_found_web/```## 📁 Project Structure- Click on any user's profile picture in feed to view their full profile- **Send Message Button** - Contact the user directly- **Posted Items Display** - All items posted by this user  - Section (A, B, C, etc.)  - Semester (1st-8th)  - Branch (program/degree)- **Education Details:**  - Member since date  - Address  - Email  - Phone Number  - Name- **Personal Details:**- **Profile Picture** - Display user's avatar### 5. **User Profile Page**- Items show clear visual indicators for Lost (red) or Found (green)- **Found** - Mark items as found- **Lost** - Mark items as lost### 4. **Status Tracking**- Pagination for browsing- View all comments and claims on each item- **Claim System** - Click "✓ Claim" to claim you have found/lost the item- **Comments System** - Users can write comments to claim or respond to items- User avatars and information- Read messages/descriptions posted with items- View user profile pictures next to each post- Browse items in Twitter/feed format### 3. **Find Item (Feed - Twitter-like)**- Final post button to publish on feed- Select status: Lost or Found- Item name (title) field- Write message/description with items- Post lost or found items### 2. **Upload Item (Post Item Page)**- Links to "Find Items" and "Post Item"- Featured recent items display- Login link (direct button to login.html)- Registration link (direct button to register.html)### 1. **Home Page**## ✨ Complete Features List
## ✨ Complete Features List

### 1. **Home Page**
- Registration link (direct button to register.html)
- Login link (direct button to login.html)
- Featured recent items display
- Links to "Find Items" and "Post Item"

### 2. **Upload Item (Post Item Page)**
- Post lost or found items
- Write message/description with items
- Item name (title) field
- Select status: Lost or Found
- Final post button to publish on feed

### 3. **Find Item (Feed - Twitter-like)**
- Browse items in Twitter/feed format
- View user profile pictures next to each post
- Read messages/descriptions posted with items
- User avatars and information
- **Comments System** - Users can write comments to claim or respond to items
- **Claim System** - Click "✓ Claim" to claim you have found/lost the item
- View all comments and claims on each item
- Pagination for browsing

### 4. **Status Tracking**
- **Lost** - Mark items as lost
- **Found** - Mark items as found
- Items show clear visual indicators for Lost (red) or Found (green)

### 5. **User Profile Page**
- **Profile Picture** - Display user's avatar
- **Personal Details:**
  - Name
  - Phone Number
  - Email
  - Address
  - Member since date
- **Education Details:**
  - Branch (program/degree)
  - Semester (1st-8th)
  - Section (A, B, C, etc.)
- **Posted Items Display** - All items posted by this user
- **Send Message Button** - Contact the user directly
- Click on any user's profile picture in feed to view their full profile

## 📁 Project Structure

```
lost_and_found_web/
├── api/
│   ├── db_connection.php              # Database connection config
│   ├── register.php                   # User registration (with profile picture)
│   ├── login.php                      # User login
│   ├── post_item.php                  # Post new item
│   ├── get_items.php                  # Get items with filters
│   ├── get_item.php                   # Single item details
│   ├── get_comments.php               # Get comments/claims for items
│   ├── add_comment.php                # Add comment/claim to item
│   ├── get_user_profile.php           # Get user profile info
│   ├── messages.php                   # Messaging system
│   └── user_dashboard.php             # User dashboard
├── css/
│   ├── styles.css                     # Main styling
│   ├── feed.css                       # Twitter-like feed styles
│   └── profile.css                    # User profile styling
├── js/
│   ├── auth.js                        # Authentication utilities
│   ├── login.js                       # Login page logic
│   ├── register.js                    # Register with profile picture
│   ├── home.js                        # Home page logic
│   ├── feed.js                        # Feed/items feed with comments
│   ├── post-item.js                   # Post item form
│   ├── item-detail.js                 # Item detail page
│   ├── user-profile.js                # User profile display
│   └── dashboard.js                   # User dashboard
├── uploads/
│   ├── profiles/                      # User profile pictures
│   └── items/                         # Item images
├── index.html                         # Home page
├── login.html                         # Login page
├── register.html                      # Register with education & profile pic
├── feed.html                          # Find items (Twitter-like)
├── post-item.html                     # Upload/post items
├── item-detail.html                   # Item details page
├── user-profile.html                  # User profile display
├── dashboard.html                     # User dashboard
├── database.sql                       # Database schema
├── README.md                          # Full documentation
├── QUICK_START.md                     # Quick setup guide
└── PROJECT_SUMMARY.md                 # Project overview
```

## 🗄️ Database Schema Updates

### Users Table (Enhanced)
```sql
- id (INT)
- username (VARCHAR)
- email (VARCHAR)
- password (VARCHAR - bcrypt hashed)
- full_name (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- profile_picture (VARCHAR) - NEW
- branch (VARCHAR) - NEW: Course/Program
- semester (VARCHAR) - NEW: 1-8
- section (VARCHAR) - NEW: A, B, C, etc.
- bio (TEXT) - NEW
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Items Table
```sql
- id (INT)
- user_id (INT - Foreign Key)
- title (VARCHAR)
- description (TEXT)
- category (VARCHAR)
- type (ENUM: 'lost', 'found')
- status (ENUM: 'active', 'resolved', 'closed')
- location (VARCHAR)
- date_occurred (DATE)
- image_path (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Responses Table (Comments/Claims) - Enhanced
```sql
- id (INT)
- item_id (INT - Foreign Key)
- user_id (INT - Foreign Key)
- comment_text (TEXT)
- is_claim (BOOLEAN) - NEW: TRUE if user claims to have item
- created_at (TIMESTAMP)
```

### Messages Table
```sql
- id (INT)
- sender_id (INT - Foreign Key)
- receiver_id (INT - Foreign Key)
- item_id (INT - Foreign Key)
- message_text (TEXT)
- read_status (BOOLEAN)
- created_at (TIMESTAMP)
```

## 🚀 Setup Instructions

### Step 1: Database Setup
1. Open phpMyAdmin at `http://localhost/phpmyadmin`
2. Create database: `lost_and_found`
3. Import `database.sql`:
   - Select the database
   - Go to SQL tab
   - Paste contents of `database.sql`
   - Click Go

### Step 2: Create Directories
```bash
mkdir uploads
mkdir uploads/profiles
mkdir uploads/items
```

### Step 3: Start Services
1. Open XAMPP Control Panel
2. Start Apache
3. Start MySQL

### Step 4: Access Website
- Open browser: `http://localhost/lost_and_found_web/`

## 🎯 User Flow

### First Time User:
1. Visit Home Page
2. Click "Register" → Fill registration form with:
   - Full name
   - Username
   - Email
   - Password
   - Phone (optional)
   - Address (optional)
   - Branch (optional)
   - Semester (optional)
   - Section (optional)
   - Profile Picture (optional)
3. Login with credentials
4. Post items or browse items

### Browsing Items (Find Items - Feed):
1. Click "Find Items" in navigation
2. Filter by:
   - Lost/Found type
   - Category
   - Search keywords
3. View items in feed format
4. Click on user profile picture to see full profile
5. Click "✓ Claim" to claim you have the item
6. Click "💬 Comment" to add comments
7. Click "👁️ View" to see full item details

### Posting Items:
1. Click "Post Item"
2. Fill form:
   - Select Lost or Found
   - Add title
   - Write description
   - Select category
   - Choose location
   - Set date
   - Add image (optional)
3. Click "Post Item"
4. Item appears on feed

### Viewing Profiles:
1. Click any user's profile picture in feed
2. See their:
   - Profile picture
   - Name
   - Username
   - Phone & address
   - Education (Branch, Semester, Section)
   - All their posted items
3. Send message button to contact them

## 💬 Comments & Claims System

### Adding Comments:
- Click "💬 Comment" on any item
- Add your message (e.g., "I saw this item at...")
- Post as regular comment

### Claiming Items:
- Click "✓ Claim" on an item
- Check "Mark as claim" if you have the item
- Add message (e.g., "I have this item, how do I return it?")
- Post claim
- Claim appears with green badge

## 🔒 Security Features

- Passwords hashed with bcrypt
- SQL injection protection via escaped queries
- Session-based authentication
- User verification via email (can be added)
- File upload validation (images only)

## 📱 Responsive Design

- Desktop (1200px+): Full sidebar layout
- Tablet (768px-1199px): Adjusted grid
- Mobile (480px-767px): Single column
- Extra Small (<480px): Optimized for phones

## 🎨 Color Scheme

- Primary: #4A90E2 (Blue)
- Secondary: #50C878 (Green)
- Danger: #E74C3C (Red)
- Dark: #2C3E50
- Light: #ECF0F1

## 📝 Categories Available

1. Electronics
2. Documents
3. Jewelry
4. Keys
5. Wallet/Money
6. Phone
7. Bag/Luggage
8. Clothing
9. Other

## 🔄 Status Lifecycle

- **Active** - Item is being searched/offered
- **Resolved** - Item found/returned to owner
- **Closed** - Item no longer available

## 📧 Messaging System

- Direct user-to-user messaging
- Reference items in messages
- Track unread messages
- Message history

## 🎓 Education Fields

- **Branch**: Course or degree program name
- **Semester**: 1st through 8th semester
- **Section**: Class section (A, B, C, etc.)

These fields help students identify others from their class/batch.

## 🚦 File Upload Paths

- **Profile Pictures**: `/uploads/profiles/`
- **Item Images**: `/uploads/items/` (currently uses uploads/ root)

## 📊 Future Enhancements

- Email notifications
- User ratings/reviews
- Advanced search with maps
- Multiple images per item
- Admin dashboard
- Email verification
- Password recovery
- Two-factor authentication
- Dark theme
- Notifications system
- Item tracking history

## ⚙️ API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/register.php` | POST | Create new account |
| `/api/login.php` | POST | User login |
| `/api/post_item.php` | POST | Post new item |
| `/api/get_items.php` | GET | List items with filters |
| `/api/get_item.php` | GET | Get single item |
| `/api/get_comments.php` | GET | Get item comments |
| `/api/add_comment.php` | POST | Add comment/claim |
| `/api/get_user_profile.php` | GET | Get user profile |
| `/api/messages.php` | GET/POST | Send/receive messages |
| `/api/user_dashboard.php` | GET | User dashboard data |

## 🎉 Ready to Use!

All features are fully implemented and ready for:
- Local development on XAMPP
- Testing and customization
- Deployment to production server
- Further feature additions

Enjoy your Lost & Found website!
