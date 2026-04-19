# Found Items Auto-Removal Feature

## Overview
When an item is marked as **found/claimed**, it will be automatically removed from the main feed after **2 days**. However, the original poster can still view the item in their own **User Profile** indefinitely.

---

## How It Works

### 1. **Claiming an Item**
When a user clicks the **"✓ Claim"** button on an item:
- A modal appears for them to confirm they have the item
- They can add a message explaining why they believe they have it
- On submission, the system:
  - Inserts a comment/claim into the `responses` table with `is_claim = 1`
  - Updates the item's `status` to `'resolved'`
  - Updates the item's `updated_at` timestamp to current time

### 2. **Feed Display Logic**
The main feed now filters items as follows:
- **Active Items**: Full visibility in feed
- **Resolved Items** (first 2 days): Still visible with "✓ CLAIMED" badge
- **Resolved Items** (after 2 days): **Automatically hidden** from feed

**SQL Query Logic:**
```sql
WHERE (
  i.status = 'active' 
  OR 
  (i.status = 'resolved' AND i.updated_at > DATE_SUB(NOW(), INTERVAL 2 DAY))
)
```

### 3. **Visual Indicators**

#### On the Feed Post:
- **"✓ CLAIMED" Badge** - Green badge showing item is claimed
- **Expiration Countdown** - Shows when item will disappear:
  - "🕐 Will disappear in 2 days"
  - "🕐 Will disappear in 1 day"
  - "🕐 Will disappear in 5 hours"
  - "🕐 Disappearing soon..."
- **Reduced Opacity** - Claimed items appear slightly faded
- **Green Left Border** - Visual indicator for claimed items
- **Disabled Buttons** - Comment and Claim buttons disabled

#### In User Profile:
- **No Changes** - All items remain visible, including resolved ones
- User can see complete history of posted items
- Resolved items still show "✓ CLAIMED" badge

---

## Database Changes

### items Table
Already has required fields:
```sql
status ENUM('active', 'resolved', 'closed') DEFAULT 'active'
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

When an item is claimed:
- `status` → changes from `'active'` to `'resolved'`
- `updated_at` → automatically set to current timestamp

### responses Table
Already has required field:
```sql
is_claim BOOLEAN  -- 1 = claim, 0 = regular comment
```

---

## API Changes

### get_items.php
**Modified** to filter items based on status and age:

```php
// For active status, show only:
// 1. Items with status='active', OR
// 2. Items with status='resolved' less than 2 days old
if ($status === 'active') {
    $where_clauses[] = "(i.status = 'active' OR (i.status = 'resolved' AND i.updated_at > DATE_SUB(NOW(), INTERVAL 2 DAY)))";
}
```

### add_comment.php
**Modified** to update item status when claimed:

```php
if ($conn->query($insert_sql) === TRUE) {
    // If this is a claim, mark the item as resolved
    if ($is_claim) {
        $update_sql = "UPDATE items SET status = 'resolved', updated_at = NOW() WHERE id = $item_id";
        $conn->query($update_sql);
    }
    // ... rest of response
}
```

### get_user_profile.php
**No changes** - Already shows all items regardless of status, so user can always see their posted items including resolved ones.

---

## Frontend Changes

### feed.js Updates

1. **loadFeed()** - Removed hard-coded `&status=active` to allow filtering
2. **createFeedPost()** - Enhanced to:
   - Add `.resolved` class if status is 'resolved'
   - Calculate expiration time (2 days from updated_at)
   - Display expiration countdown
   - Show "✓ CLAIMED" badge
   - Disable Comment and Claim buttons
   - Add visual styling for resolved items

3. **openCommentModal()** & **openClaimModal()** - Added checks to:
   - Prevent interaction with resolved items
   - Show user-friendly alert messages

### feed.css Updates

New styles added:
```css
.post-status.resolved-badge {
    background-color: #D4EDDA;
    color: #155724;
    font-weight: bold;
}

.feed-post.resolved {
    opacity: 0.75;
    border-left: 4px solid #28A745;
}

.post-expiration {
    background-color: #FFF3CD;
    border-left: 4px solid #FFC107;
    /* Countdown notification styling */
}

.post-expiration.expiring-soon {
    background-color: #F8D7DA;
    border-left-color: #DC3545;
    /* When < 1 day left */
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

---

## User Experience Timeline

### When Item is Posted (Day 0):
```
[ACTIVE ITEM]
- Fully interactive
- People can comment
- People can claim
- Appears in main feed
- Appears in poster's profile
```

### When Item is Claimed (Day 0):
```
[CLAIMED ITEM - Within 2 days]
- Still visible in main feed
- "✓ CLAIMED" badge appears
- "🕐 Will disappear in 2 days" message
- Comment/Claim buttons disabled
- Still appears in poster's profile
```

### After 2 Days Since Claim:
```
[CLAIMED ITEM - PAST 2 DAYS]
- HIDDEN from main feed
- NOT visible in feed pagination
- NOT searchable in feed browse
- Still appears in poster's own profile
- User can see item via item-detail.html if they have the direct URL
```

---

## Edge Cases Handled

### 1. **Item Claimed, Then Unclaimed?**
Currently, once claimed (status='resolved'), it cannot be unclaimed through the UI. To reactivate:
- Admin would need to manually update database
- Or feature could be added to allow posters to "reopen" items

### 2. **Multiple Claims**
- First claim marks item as resolved
- Additional claims/comments still save to database
- But item stays resolved and will expire after 2 days

### 3. **Pagination**
- Feed pagination automatically recalculates
- As resolved items disappear, more active items appear
- Page numbers adjust accordingly

### 4. **Search Results**
- Search only returns active + recently claimed items
- Expired resolved items don't appear in search

### 5. **Direct URL Access**
- User can still access item details via direct URL (item-detail.html?id=123)
- Expired items still show their information
- Poster can always access in their profile

---

## Testing the Feature

### Test Case 1: Claim an Item
1. Post a new "Lost" item
2. Login with different user
3. Click "✓ Claim" button
4. Fill in claim message
5. **Expected:** Item shows "✓ CLAIMED" badge with countdown

### Test Case 2: Feed Filtering
1. Post multiple items
2. Claim some items
3. Check main feed
4. **Expected:** Claimed items appear with yellow warning, active items normal

### Test Case 3: Expiration (Requires Time)
1. Manually update database: `UPDATE items SET updated_at = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE id = 123`
2. Reload feed
3. **Expected:** Item disappears from feed

### Test Case 4: User Profile Still Shows
1. Claim an item you posted (for testing, temporarily allow self-claim)
2. Check your user profile
3. **Expected:** Item still visible in profile
4. Revert self-claim restriction for production

---

## Configuration

### To Change Expiration Time
Edit `api/get_items.php` line containing:
```php
AND i.updated_at > DATE_SUB(NOW(), INTERVAL 2 DAY)
```

Change `2 DAY` to your desired interval:
- `INTERVAL 1 DAY` - Disappears after 1 day
- `INTERVAL 7 DAY` - Disappears after 1 week
- `INTERVAL 30 DAY` - Disappears after 1 month
- `INTERVAL 3 HOUR` - Disappears after 3 hours

Also update feed.js countdown messages accordingly.

---

## Future Enhancements

1. **Allow Unclaiming** - Add button for posters to reopen resolved items
2. **Soft Delete** - Archive instead of hiding
3. **Admin Dashboard** - Manage expired items
4. **Notifications** - Notify poster when item claimed
5. **Claim Verification** - Only poster can confirm claim legitimacy
6. **Auto-Repost** - Option to repost expired items
7. **Claim Disputes** - Handle conflicting claims on same item

---

## Summary

✅ Claimed items disappear from feed after 2 days  
✅ Posters can always see items in their profile  
✅ Clear visual indicators for claimed status  
✅ Countdown shows when items will expire  
✅ Disabled interaction with resolved items  
✅ Automatic database updates handle all timing  
✅ User-friendly alerts prevent confusion  

The feature is fully functional and ready for use!
