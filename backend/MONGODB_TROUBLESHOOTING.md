# MongoDB Connection Troubleshooting Guide

## Quick Fix Commands

### 1. Check MongoDB Status
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
sudo systemctl status mongod
```

### 2. Check Connection
```bash
cd backend
npm run check-mongo
```

### 3. Run Seeding
```bash
cd backend
npm run seed
```

## Common Issues & Solutions

### Issue 1: Connection Refused (ECONNREFUSED)

**Error Message:**
```
Database connection error: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

#### A. Start MongoDB Service
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### B. Check if MongoDB is Running
```bash
# Windows
netstat -an | findstr 27017

# macOS/Linux
netstat -an | grep 27017
```

#### C. Use Correct Connection String
Create or update your `.env` file:
```env
MONGODB_URI_PROD=mongodb://127.0.0.1:27017/chalo_sawari
# or
MONGODB_URI=mongodb://127.0.0.1:27017/chalo_sawari
```

**Note:** 
- The script prioritizes `MONGODB_URI_PROD` first, then falls back to `MONGODB_URI`
- Use `127.0.0.1` instead of `localhost` to avoid IPv6 issues

### Issue 2: MongoDB Not Installed

**Solution: Install MongoDB**

#### Windows
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run installer as Administrator
3. Install MongoDB Compass (GUI tool)
4. Add MongoDB to system PATH

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Linux (Ubuntu)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Issue 3: Permission Denied

**Solutions:**

#### A. Run as Administrator (Windows)
- Right-click Command Prompt/PowerShell
- Select "Run as Administrator"

#### B. Check MongoDB Data Directory
```bash
# Windows (default)
C:\Program Files\MongoDB\Server\6.0\data

# macOS/Linux (default)
/var/lib/mongodb
```

#### C. Fix Directory Permissions
```bash
# Linux/macOS
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chmod 755 /var/lib/mongodb
```

### Issue 4: Port Already in Use

**Check what's using port 27017:**
```bash
# Windows
netstat -ano | findstr 27017

# macOS/Linux
lsof -i :27017
```

**Kill the process:**
```bash
# Windows (replace PID with actual process ID)
taskkill /PID <PID> /F

# macOS/Linux
sudo kill -9 <PID>
```

### Issue 5: Firewall Blocking

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Find MongoDB and ensure it's allowed

**macOS Firewall:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add MongoDB to allowed applications

## Alternative Solutions

### Option 1: Use MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update `.env` file:
```env
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/chalo_sawari
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chalo_sawari
```

### Option 2: Use Docker
```bash
# Pull MongoDB image
docker pull mongo:6.0

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Check if running
docker ps
```

### Option 3: Use Different Port
If port 27017 is busy, use a different port:
```bash
# Start MongoDB on different port
mongod --port 27018

# Update .env
MONGODB_URI=mongodb://127.0.0.1:27018/chalo_sawari
```

## Verification Steps

### 1. Test Connection
```bash
cd backend
npm run check-mongo
```

**Expected Output:**
```
🔍 Checking MongoDB Connection Status...

📍 Connection String: mongodb://127.0.0.1:27017/chalo_sawari
🔌 Attempting to connect...
✅ MongoDB Connection Successful!
📊 Database: chalo_sawari
🔌 Connection State: 1
🌐 Host: 127.0.0.1
🔢 Port: 27017
📚 Collections found: X
   - collection1
   - collection2
```

**Note:** The connection string will show the value from `MONGODB_URI_PROD` if available, otherwise from `MONGODB_URI`.

### 2. Test Seeding
```bash
cd backend
npm run seed
```

**Expected Output:**
```
🚀 Starting comprehensive pricing data seeding...
🧹 Cleared existing pricing data
✅ Successfully inserted 32 pricing records

=== SEEDING SUMMARY ===
Total pricing records: 32
Auto rickshaw: 2 records
Cars: 18 records
Buses: 12 records
```

## Environment File Setup

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGODB_URI_PROD=mongodb://127.0.0.1:27017/chalo_sawari
# or
MONGODB_URI=mongodb://127.0.0.1:27017/chalo_sawari

# Other configurations...
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key_here
```

## Still Having Issues?

### 1. Check MongoDB Logs
```bash
# Windows
type "C:\Program Files\MongoDB\Server\6.0\log\mongod.log"

# macOS/Linux
sudo tail -f /var/log/mongodb/mongod.log
```

### 2. Restart MongoDB Service
```bash
# Windows
net stop MongoDB
net start MongoDB

# macOS/Linux
sudo systemctl restart mongod
```

### 3. Check System Resources
- Ensure you have enough disk space
- Check if antivirus is blocking MongoDB
- Verify system memory is sufficient

### 4. Get Help
- Check [MongoDB Documentation](https://docs.mongodb.com/)
- Visit [MongoDB Community Forums](https://developer.mongodb.com/community/forums/)
- Check [Stack Overflow](https://stackoverflow.com/questions/tagged/mongodb)

## Quick Commands Reference

```bash
# Check MongoDB status
npm run check-mongo

# Run seeding
npm run seed

# Start MongoDB (Windows)
net start MongoDB

# Start MongoDB (macOS/Linux)
sudo systemctl start mongod

# Check MongoDB process
netstat -an | findstr 27017  # Windows
netstat -an | grep 27017      # macOS/Linux

# Kill process on port 27017
# First find PID, then:
taskkill /PID <PID> /F        # Windows
sudo kill -9 <PID>            # macOS/Linux
```
