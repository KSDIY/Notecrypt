# MongoDB Database Setup Guide

## **Option 1: Local MongoDB (Recommended for Development)**

### **Step 1: Install MongoDB**

#### **Windows:**
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer (.msi file)
3. Choose "Complete" installation
4. Install as a Windows Service (check the box)
5. Install MongoDB Compass (GUI tool - optional but helpful)

#### **Mac (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### **Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### **Step 2: Verify MongoDB is Running**

Open terminal/command prompt:
```bash
mongosh
```

You should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017
✓ Connected successfully
```

Type `exit` to quit mongosh.

### **Step 3: Connect to MongoDB from Backend**

Your backend is already configured! Just make sure MongoDB is running.

The connection string in your `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/notepad-app
```

---

## **Option 2: MongoDB Atlas (Cloud - FREE)**

### **Step 1: Create Atlas Account**

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email or Google account

### **Step 2: Create a Cluster**

1. Choose **FREE** tier (M0 Sandbox)
2. Select cloud provider: **AWS**
3. Choose region closest to you
4. Click "Create Cluster" (takes 3-5 minutes)

### **Step 3: Create Database User**

1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `notepad-admin`
5. Password: Generate a strong password (save it!)
6. User Privileges: "Atlas admin"
7. Click "Add User"

### **Step 4: Whitelist IP Address**

1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - *Note: For production, use specific IPs*
4. Click "Confirm"

### **Step 5: Get Connection String**

1. Go to "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string:
   ```
   mongodb+srv://notepad-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. Replace `<password>` with your actual password
6. Add database name: `/notepad-app` before the `?`

Final string example:
```
mongodb+srv://notepad-admin:MyPass123@cluster0.xxxxx.mongodb.net/notepad-app?retryWrites=true&w=majority
```

### **Step 6: Update Backend .env File**

```env
MONGODB_URI=mongodb+srv://notepad-admin:MyPass123@cluster0.xxxxx.mongodb.net/notepad-app?retryWrites=true&w=majority
PORT=5000
```

---

## **How to Connect Backend to Database**

### **Already Done in Code!**

The backend (`server.js`) already has this connection code:

```javascript
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notepad-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));
```

**This means:**
- It reads connection string from `.env` file
- Falls back to local MongoDB if `.env` is missing
- Shows success/error messages

---

## **Database Structure**

Your app will automatically create:

### **Database:** `notepad-app`

### **Collections:**

#### **1. users**
```javascript
{
  _id: ObjectId("..."),
  username: "john_doe",
  createdAt: ISODate("2026-01-28T10:30:00Z")
}
```

#### **2. notes**
```javascript
{
  _id: ObjectId("..."),
  username: "john_doe",
  title: "My First Note",
  content: "Hello World!",
  isDeleted: false,
  deletedAt: null,
  expiresAt: null,
  createdAt: ISODate("2026-01-28T10:30:00Z"),
  updatedAt: ISODate("2026-01-28T10:35:00Z")
}
```

**Important:** Notes with `expiresAt` date will auto-delete after 30 days!

---

## **Testing Database Connection**

### **Method 1: Using MongoDB Compass (GUI)**

1. Open MongoDB Compass
2. Connect to:
   - Local: `mongodb://localhost:27017`
   - Atlas: Use your Atlas connection string
3. You should see `notepad-app` database after running the app
4. Browse collections: `users` and `notes`

### **Method 2: Using mongosh (Terminal)**

```bash
# Connect to local MongoDB
mongosh

# Or connect to Atlas
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net" --username notepad-admin

# List databases
show dbs

# Use notepad-app database
use notepad-app

# Show collections
show collections

# View all users
db.users.find()

# View all notes
db.notes.find()

# View deleted notes
db.notes.find({ isDeleted: true })

# Count notes
db.notes.countDocuments()
```

---

## **Common Issues & Solutions**

### **Issue 1: "MongoServerError: Authentication failed"**
**Solution:** Check username/password in connection string

### **Issue 2: "ECONNREFUSED 127.0.0.1:27017"**
**Solution:** MongoDB service is not running
```bash
# Mac
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### **Issue 3: "Cannot connect to Atlas"**
**Solution:** 
- Check IP whitelist settings
- Verify username/password
- Ensure cluster is active (not paused)

### **Issue 4: Notes not auto-deleting after 30 days**
**Solution:** TTL index is set in schema - MongoDB checks every 60 seconds

---

## **Monitoring Your Database**

### **Check Database Size:**
```bash
mongosh
use notepad-app
db.stats()
```

### **View Recent Notes:**
```bash
db.notes.find().sort({ createdAt: -1 }).limit(5)
```

### **Clean Up Test Data:**
```bash
db.users.deleteMany({})
db.notes.deleteMany({})
```

---

## **Production Considerations**

1. **Security:**
   - Use specific IP whitelisting (not 0.0.0.0/0)
   - Rotate database passwords regularly
   - Use environment variables for credentials

2. **Backup:**
   - Atlas provides automatic backups
   - For local: Use `mongodump` command

3. **Scaling:**
   - Atlas M0 (free) supports up to 512MB
   - Upgrade to M10+ for production workloads

4. **Monitoring:**
   - Use Atlas monitoring dashboard
   - Set up alerts for high usage

---

## **Quick Start Checklist**

- [ ] MongoDB installed (local) OR Atlas account created
- [ ] Database user created (Atlas only)
- [ ] IP whitelisted (Atlas only)
- [ ] `.env` file created with connection string
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend server running (`npm start`)
- [ ] Check console for "✅ MongoDB Connected"
- [ ] Test with MongoDB Compass or mongosh

---

**You're all set!** Your database is ready to store notes. 🎉
