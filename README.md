# 🚀 SocialHub Management

<div align="center">

![SocialHub Management](https://img.shields.io/badge/socialhub-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**A powerful full-stack dashboard for managing social media interactions, orders, and webhooks with real-time updates**

</div>


---

## 🌟 Overview

**SocialHub Management** is a modern, full-stack web application designed to streamline the management of social media interactions, e-commerce orders, and webhook integrations. Built with the latest technologies, it provides real-time updates, comprehensive analytics, and powerful automation capabilities.

### Why SocialHub Management?

- ✅ **Centralized Control** - Manage all social media interactions from one dashboard
- ✅ **Real-time Updates** - Socket.IO integration for instant notifications
- ✅ **Webhook Automation** - Trigger n8n workflows or external services automatically
- ✅ **User Management** - Ban/unban users with detailed logging
- ✅ **Order Tracking** - Complete e-commerce order lifecycle management
- ✅ **Mobile Responsive** - Works seamlessly on all devices
- ✅ **Secure** - JWT authentication with role-based access control

---


## 🚀 Installation

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local installation)
- **npm** or **yarn**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Moajjem404/socialhub.git
   cd socialhub
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Configure environment variables**

   **Backend Configuration** (`/server/.env`):
   ```env
   PORT=3001
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/socialhub?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this
   NODE_ENV=development
   ```

   **Frontend Configuration** (`/client/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Start the application**
   
   **Development Mode:**
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

   **Production Deployment:**
   
   *Linux/Mac/VPS:*
   ```bash
   chmod +x deploy-full.sh
   ./deploy-full.sh  # Full deployment
   
   # Or deploy separately:
   chmod +x deploy-client.sh && ./deploy-client.sh  # Frontend only
   chmod +x deploy-server.sh && ./deploy-server.sh  # Backend only
   ```
   
   *Windows:*
   ```cmd
   deploy-full.bat  # Full deployment
   
   REM Or deploy separately:
   deploy-client.bat  # Frontend only
   deploy-server.bat  # Backend only
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

6. **Create owner account**
   - Navigate to http://localhost:3000/login
   - First time setup will prompt you to create an owner account
   - Use this account to access all features

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`/server/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Backend server port | Yes | 3001 |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |

#### Frontend (`/client/.env.local`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | http://localhost:3001 |

### MongoDB Setup

**Option 1: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGO_URI` in `/server/.env`

**Option 2: Local MongoDB**
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt install mongodb

# Start MongoDB
mongod

# Update MONGO_URI
MONGO_URI=mongodb://localhost:27017/socialhub
```

---

## 📖 Usage

### First Time Setup

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Create Owner Account**
   - Navigate to http://localhost:3000/login
   - Fill in username and password
   - Click "Create Owner Account"

3. **Login**
   - Use the credentials you just created
   - You'll be redirected to the dashboard

### Managing Webhooks

1. **Navigate to Webhooks** (Owner only)
2. **Click "Create New Webhook"**
3. **Fill in details:**
   - Name: Descriptive name
   - URL: Your webhook endpoint (e.g., n8n webhook URL)
   - Type: Select event type (ORDER, COMMENT, REACTION, etc.)
   - Headers: Optional custom headers
   - Description: Optional notes

4. **Test your webhook** by triggering an event
5. **Monitor webhook logs** in server console

### Creating Products

1. Navigate to **Products** page
2. Click **"Add New Product"**
3. Fill in product details:
   - Product name
   - Brand name
   - Price
   - Discount percentage
   - Stock quantity
   - Status (ACTIVE/INACTIVE/OUT_OF_STOCK)
4. Click **"Create Product"**

### Managing Users

**Ban a User:**
1. Go to Reactions or Comments page
2. Click **"Ban User"** on any item
3. Select ban type (REACTION, COMMENT, ALL)
4. Enter reason
5. Optionally check **"Remove All Data"**
6. Click **"Ban User"**

**Unban a User:**
1. Go to **Banned Users** page
2. Find the user
3. Click **"Unban"**
4. Confirm action

### Creating Admins (Owner Only)

1. Navigate to **Admin Management**
2. Click **"Create New Admin"**
3. Enter username and password
4. Admin will have access to all features except:
   - Creating/deleting other admins
   - Managing webhooks
   - Viewing API documentation

---


## 🔗 Webhook Integration with n8n

**Webhooks automatically send data to external services when events happen.**

### Supported Events:
- 📊 **REACTION** - User reacts to posts
- 💬 **COMMENT** - User comments
- 📦 **ORDER** - New order created/updated
- 🚫 **USER_BAN** - User banned/unbanned
- 🧹 **DATA_CLEANUP** - Data cleaned

### Quick Setup:

1. **In n8n:** Create Webhook node → Copy URL
2. **In SocialHub:** Webhooks page → Create → Paste URL → Select event type
3. **Done!** Events will now trigger your n8n workflow automatically

**📖 For detailed guide, see:** [WEBHOOK_GUIDE.md](./WEBHOOK_GUIDE.md)

---

## 📜 License

MIT License - Free to use, modify, and distribute.

## ❓ Need Help?

**Common Issues:**

🔴 **Cannot connect to MongoDB:**
- Check `MONGO_URI` in `/server/.env`
- Verify MongoDB Atlas IP whitelist settings

🔴 **Port already in use:**
- Change `PORT` in `/server/.env` to different number

🔴 **Webhook not working:**
- Ensure webhook is marked as "Active"
- Check server console for error logs

**Get Support:**
- 🐛 [Report Issues](https://github.com/Moajjem404/socialhub/issues)
- 💬 [Ask Questions](https://github.com/Moajjem404/socialhub/discussions)

---

<div align="center">

**Made with ❤️ by [Moajjem Hossain](https://github.com/Moajjem404)**

**Star ⭐ this repository if you find it helpful!**

</div>
