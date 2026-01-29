# NotePad App - REST API Documentation

Base URL: `http://localhost:5000/api`

---

## **API Endpoints**

### **1. User Authentication**

#### **POST** `/users/login`
Login or create a new user.

**Request Body:**
```json
{
  "username": "john_doe"
}
```

**Success Response (200/201):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "createdAt": "2026-01-28T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "message": "Username already exists"
}
```

---

### **2. Get All Notes**

#### **GET** `/notes/:username`
Get all active notes for a user (excludes deleted notes).

**Example:** `/notes/john_doe`

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "title": "Shopping List",
    "content": "Buy milk, eggs, bread",
    "isDeleted": false,
    "createdAt": "2026-01-28T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:35:00.000Z"
  }
]
```

---

### **3. Get Recycle Bin**

#### **GET** `/notes/:username/recycle`
Get all deleted notes in recycle bin.

**Example:** `/notes/john_doe/recycle`

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "username": "john_doe",
    "title": "Old Note",
    "content": "This was deleted",
    "isDeleted": true,
    "deletedAt": "2026-01-28T10:40:00.000Z",
    "expiresAt": "2026-02-27T10:40:00.000Z",
    "createdAt": "2026-01-20T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:40:00.000Z"
  }
]
```

---

### **4. Create Note**

#### **POST** `/notes`
Create a new note.

**Request Body:**
```json
{
  "username": "john_doe",
  "title": "Meeting Notes",
  "content": "Discuss project timeline and budget"
}
```

**Success Response (201):**
```json
{
  "message": "Note created",
  "note": {
    "_id": "507f1f77bcf86cd799439013",
    "username": "john_doe",
    "title": "Meeting Notes",
    "content": "Discuss project timeline and budget",
    "isDeleted": false,
    "createdAt": "2026-01-28T11:00:00.000Z",
    "updatedAt": "2026-01-28T11:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "message": "All fields are required"
}
```

---

### **5. Update Note**

#### **PUT** `/notes/:id`
Update an existing note.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content here"
}
```

**Success Response (200):**
```json
{
  "message": "Note updated",
  "note": {
    "_id": "507f1f77bcf86cd799439013",
    "username": "john_doe",
    "title": "Updated Title",
    "content": "Updated content here",
    "updatedAt": "2026-01-28T11:05:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "message": "Note not found"
}
```

---

### **6. Delete Note (Move to Recycle Bin)**

#### **DELETE** `/notes/:id`
Soft delete - moves note to recycle bin for 30 days.

**Success Response (200):**
```json
{
  "message": "Note moved to recycle bin",
  "note": {
    "_id": "507f1f77bcf86cd799439013",
    "isDeleted": true,
    "deletedAt": "2026-01-28T11:10:00.000Z",
    "expiresAt": "2026-02-27T11:10:00.000Z"
  }
}
```

---

### **7. Restore Note**

#### **PUT** `/notes/:id/restore`
Restore a note from recycle bin.

**Success Response (200):**
```json
{
  "message": "Note restored",
  "note": {
    "_id": "507f1f77bcf86cd799439013",
    "isDeleted": false,
    "deletedAt": null,
    "expiresAt": null
  }
}
```

---

### **8. Health Check**

#### **GET** `/health`
Check if server is running.

**Success Response (200):**
```json
{
  "status": "Server is running",
  "timestamp": "2026-01-28T11:15:00.000Z"
}
```

---

## **Error Codes**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid data) |
| 404 | Not Found |
| 500 | Server Error |

---

## **Data Models**

### **User Model**
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  createdAt: Date
}
```

### **Note Model**
```javascript
{
  _id: ObjectId,
  username: String (required, indexed),
  title: String (required),
  content: String (required),
  isDeleted: Boolean (default: false),
  deletedAt: Date,
  expiresAt: Date (auto-deletes after 30 days),
  createdAt: Date,
  updatedAt: Date
}
```

---

## **Testing with cURL**

```bash
# 1. Login/Register
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe"}'

# 2. Create Note
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","title":"Test","content":"Hello World"}'

# 3. Get Notes
curl http://localhost:5000/api/notes/john_doe

# 4. Delete Note
curl -X DELETE http://localhost:5000/api/notes/NOTE_ID_HERE

# 5. Get Recycle Bin
curl http://localhost:5000/api/notes/john_doe/recycle
```

---

## **Testing with Postman**

1. Import these endpoints into Postman
2. Set base URL to `http://localhost:5000/api`
3. Test each endpoint with sample data
4. Check MongoDB to verify data persistence
