# ⚡ ElectroFlow - Electronics Lab Inventory Management System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://electroflow-iota.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)

> 🔬 *A cutting-edge, AI-powered inventory management platform designed specifically for electronics R&D and manufacturing laboratories.*

## 🎯 Overview

*ElectroFlow* is a comprehensive, web-based inventory management system that revolutionizes how electronics laboratories track, manage, and optimize their component inventory. Built with modern technologies and powered by AI, it transforms manual, error-prone processes into streamlined, intelligent workflows.

### 🔍 Problem Solved
- ❌ Manual inventory tracking leading to errors and inefficiencies
- ❌ Lack of real-time visibility into stock levels and usage patterns
- ❌ Difficulty in component discovery and recommendation
- ❌ Limited role-based access control in laboratory environments
- ❌ Poor mobile accessibility for field technicians

### 💡 Solution Delivered
- ✅ *Real-time inventory tracking* with automated updates
- ✅ *AI-powered smart assistant* for intelligent queries and recommendations
- ✅ *Comprehensive analytics dashboard* with usage insights
- ✅ *Role-based access control* tailored for laboratory hierarchies
- ✅ *Fully responsive design* accessible on desktop, tablet, and mobile
- ✅ *Barcode/QR scanning* for quick component identification

## ✨ Key Features

### 🏠 *Modern Landing Page*
- Professional introduction to platform capabilities
- Clear navigation to features, solutions, and pricing
- Compelling call-to-action for free trial signup
- Responsive design optimized for all devices

### 🔐 *Advanced Authentication & Role Management*
- Secure user registration with email verification
- *5 Distinct User Roles:*
  - 👑 *Admin* - Full system access and user management
  - 👤 *User* - Basic inventory viewing and personal orders
  - 🔬 *Lab Technician* - Component management and quality control
  - 🧪 *Researcher* - Advanced analytics and reporting
  - 🏭 *Manufacturing Engineer* - Production planning and bulk operations
- JWT-based authentication with proper session management
- Comprehensive audit logging for security compliance

### 📊 *Intelligent Dashboard*
- *Real-time Analytics:*
  - Component price trends and cost optimization insights
  - Stock shelf-time analysis for inventory rotation
  - 6-month usage patterns with predictive forecasting
  - Daily inward/outward movement tracking
- *User Activity Monitoring:*
  - Personal usage statistics
  - Team performance metrics
  - System health indicators

### 📦 *Comprehensive Inventory Management*
- *Full CRUD Operations* for component lifecycle management
- *Advanced Search & Filtering:*
  - Multi-parameter search (name, category, specifications)
  - Real-time filtering with instant results
  - Category-based browsing with hierarchical organization
- *Data Export & Reporting:*
  - CSV export functionality for external analysis
  - Custom report generation
  - Automated low-stock alerts

### 📋 *Sophisticated Orders Management*
- Track all inward and outward component movements
- Batch processing for bulk operations
- Integration with supplier systems (planned)
- Order history and analytics
- Lab technician workflow optimization

### 🤖 *AI-Powered Smart Assistant* ⭐
Transform how users interact with inventory data through natural language queries:

*Sample Queries:*
- "What components do I have in stock?"
- "Show me my recent orders from the last week"
- "Help me find all resistors under 1kΩ"
- "What's my current account status and permissions?"
- "Recommend components for Arduino-based IoT projects"
- "Which components are running low and need reordering?"

*AI Capabilities:*
- Natural language processing for intuitive queries
- Contextual recommendations based on project requirements
- Predictive analytics for inventory optimization
- Integration with component databases

### 📱 *Scan-It Technology*
- *Barcode & QR Code Scanning:*
  - Instant component identification
  - Mobile-optimized camera integration
  - Batch scanning for inventory audits
  - Direct management actions from scan results

### ⚙ *User Experience Features*
- *FAQ System* with searchable knowledge base
- *Settings Management* for personalized user experience
- *Responsive Design* ensuring seamless mobile experience
- *Progressive Web App* capabilities for offline functionality

## 🛠 Tech Stack

### *Frontend Excellence*
- *⚛ React.js 18+* - Modern component-based architecture
- *🛣 React Router v6* - Client-side routing with protected routes
- *📊 Chart.js/Recharts* - Interactive data visualizations
- *🎨 Custom CSS/SCSS* - Responsive design with modern UI/UX

### *Backend Powerhouse*
- *🟢 Node.js* - High-performance JavaScript runtime
- *⚡ Express.js* - Fast, minimalist web framework
- *🔐 JWT Authentication* - Stateless, secure token-based auth

### *AI & Intelligence*
- *🧠 Custom AI Assistant* - Natural language processing for inventory queries
- *📊 Analytics Engine* - Real-time data processing and insights
- *🔍 Smart Search* - Fuzzy matching and intelligent filtering

### *Utilities & Integration*
- *📷 Barcode/QR Processing* - Multi-format scanning support
- *📤 CSV Export/Import* - Data interchange capabilities
- *🔔 Real-time Notifications* - WebSocket integration (planned)

## 📂 Project Structure


ElectroFlow/
├── 🖥 backend/
│   ├── 🎮 controllers/        # Business logic handlers
│   ├── 🗂 models/            # Database models (Sequelize)
│   ├── 🛣 routes/            # API endpoint definitions
│   ├── 🛡 middleware/        # Auth, validation, error handling
│   ├── ⚙ config/            # Database and app configuration
│   ├── 🔧 utils/             # Helper functions and utilities
│   ├── 📧 services/          # Email, AI, and external services
│   └── 🚀 server.js          # Application entry point
├── 🌐 frontend/
│   └── 📁 src/
│       ├── 🎨 assets/        # Images, icons, and static files
│       ├── 🧩 components/    # Reusable React components
│       ├── 📄 pages/         # Main application pages
│       ├── 🔄 contexts/      # React context providers
│       ├── 🔧 utils/         # Frontend utility functions
│       ├── 🎯 hooks/         # Custom React hooks
│       └── 📱 App.js         # Main application component
├── 📖 docs/                   # Project documentation
├── 🧪 tests/                 # Test suites
└── 📋 README.md              # Project documentation


## ⚙ Installation & Setup

### 📋 Prerequisites
- *Node.js* (v16.0 or higher)
- *npm* or *yarn* package manager
- *Git* for version control

### 🚀 Quick Start

#### 1️⃣ Clone the Repository
bash
# Clone the project
git clone https://github.com/RiddheshFirake/Electronics-Lab-Inventory-Management-System-LIMS.git
cd Electronics-Lab-Inventory-Management-System-LIMS


#### 2️⃣ Backend Setup
bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env


**Configure your .env file:**
env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/electronics_lab_inventory

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=30d

# Email Configuration (Optional for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Default Credentials
ADMIN_EMAIL=admin@lab.com
ADMIN_PASSWORD=admin123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Configuration
AI_API_KEY=your_ai_service_key


bash
# Start the backend server
npm start
# Server will run on http://localhost:5000


#### 3️⃣ Frontend Setup
bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
# Frontend will run on http://localhost:3000


### 🔧 Development Scripts

*Backend Commands:*
bash
node server.js          # Start production server


*Frontend Commands:*
bash
npm start          # Start development server


## 👤 User Role Management

### 🔐 Default Access
- *New Users* register with User role by default
- *Email verification* required for account activation
- *Profile completion* encouraged for full feature access

### 👑 Admin Controls
Administrators can assign the following roles through the User Management interface:

| Role | Permissions | Key Features |
|------|-------------|--------------|
| 👑 *Admin* | Full system access | User management, system settings, audit logs |
| 👤 *User* | Basic inventory viewing | Personal orders, basic search, FAQ access |
| 🔬 *Lab Technician* | Component management | CRUD operations, barcode scanning, batch processing |
| 🧪 *Researcher* | Advanced analytics | Detailed reports, trend analysis, export capabilities |
| 🏭 *Manufacturing Engineer* | Production planning | Bulk operations, supplier integration, forecasting |

### 🛡 Security Features
- *Role-based route protection* on frontend and backend
- *API endpoint authorization* with middleware validation
- *Audit trail logging* for all role changes and sensitive operations
- *Session management* with automatic logout on inactivity

## 📖 Usage Guide

### 🏁 Getting Started
1. *Visit* the landing page to explore features
2. *Register* for a new account or *sign in* to existing account
3. *Complete* email verification process
4. *Explore* the dashboard to familiarize yourself with the interface

### 💼 Daily Workflows

#### *For Lab Technicians:*
1. *Morning Inventory Check:* Review dashboard for low-stock alerts
2. *Component Entry:* Use barcode scanning for new component registration
3. *Order Processing:* Handle inward/outward movements efficiently
4. *Quality Control:* Update component conditions and specifications

#### *For Researchers:*
1. *Project Planning:* Use AI assistant for component recommendations
2. *Usage Analysis:* Review 6-month trends for research insights
3. *Report Generation:* Export data for research documentation
4. *Collaboration:* Share findings with team members

#### *For Manufacturing Engineers:*
1. *Production Planning:* Analyze component availability for production runs
2. *Bulk Operations:* Process large-scale component movements
3. *Cost Optimization:* Monitor price trends and supplier performance
4. *Forecasting:* Use predictive analytics for future requirements

### 🤖 AI Assistant Usage Examples

*Natural Language Queries:*

"Show me all microcontrollers in stock"
"What components were added last week?"
"I need parts for a temperature monitoring system"
"Which suppliers have the best prices for capacitors?"
"Generate a report of components expiring next month"


*Advanced Queries:*

"Compare usage patterns between Q1 and Q2"
"Recommend components for IoT projects under $500 budget"
"Show me the most frequently ordered components by our team"
"What's the average lead time for electronic components?"


## 📱 Screenshots

### 🏠 Landing Page
![Landing Page](https://github.com/user-attachments/assets/e37af260-f95a-42b3-8732-db4128874889)
Modern, professional introduction with clear call-to-action buttons

### 📊 Dashboard Overview
![Dashboard](https://github.com/user-attachments/assets/012ccb94-5933-4abc-a964-ed01695537f5)
Comprehensive analytics with real-time inventory insights

#### 📈 Analytics View
![Analytics Graph](https://github.com/user-attachments/assets/6ee1204a-5b73-48d6-b8ca-6935647fd223)
Shows 6-month usage trends, daily inward/outward flow, and low-stock alerts

### 📦 Inventory Management
![Inventory Management](https://github.com/user-attachments/assets/fb95072a-658b-4d44-9eda-456e2f461311)
Advanced search, filtering, and CRUD operations interface

### 📋 Orders Management
![Orders Management](https://github.com/user-attachments/assets/74092961-4cf9-4e01-8921-d12572965749)
Streamlined order processing with batch operations

### 🤖 AI Smart Assistant
![Smart Assistant](https://github.com/user-attachments/assets/ae352be4-4f79-4985-b20e-fbb84c3346fa)
Natural language querying with intelligent recommendations

### 📱 Scan-It Technology
![Scan-It Page](https://github.com/user-attachments/assets/80c67ae6-dab8-4a5d-b84d-c6b80c93be01)
Barcode/QR scanning with instant component identification

### 📱 Mobile Responsive Design
![Mobile View](https://github.com/user-attachments/assets/c4740d0d-7adf-415d-8679-34f2d65b7f80)
Fully responsive design optimized for mobile devices

### ⚙ Settings & Profile
![Settings Page](https://github.com/user-attachments/assets/4661f173-5c80-453f-8ed6-caf5587440e6)
User profile management and system configuration

## 🚀 Deployment

### 🌐 Live Demo
*[Visit ElectroFlow Live Demo](https://electroflow-iota.vercel.app/)* 🔗

### 🏗 Deployment Architecture

#### *Frontend (Vercel)*
- *Platform:* Vercel for optimal React.js hosting
- *Features:* Automatic deployments, edge caching, global CDN
- *Configuration:* Environment variables for API endpoints

#### *Backend (Render)*
- *Platform:* Render for reliable Node.js hosting
- *Features:* Auto-scaling, health monitoring, SSL certificates
- *Configuration:* Production environment with optimized settings

#### *Database (MongoDB)*

### 🔧 Deployment Scripts
bash
# Frontend deployment
npm run build
# Deploy to Vercel via GitHub integration

# Backend deployment
npm start
# Auto-deploy to Render via GitHub integration


### 🌍 Environment Variables (Production)
env
# Frontend (.env.production)
REACT_APP_API_URL=https://your-backend-url.render.com

# Backend (.env.production)
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret


### 🔧 Performance Considerations
- *Database Scaling:* Current setup suitable for medium-scale operations
- *File Storage:* Local storage for images, cloud migration planned
- *Search Performance:* Complex queries may have latency with large datasets

## 🔮 Future Improvements

- *🔄 Real-time Sync:* WebSocket implementation for live updates
- *🔍 Advanced Search:* Elasticsearch integration for faster queries
- *🤝 Supplier Integration:* Direct API connections with major suppliers
- *🧠 Predictive AI:* Machine learning for automatic reorder suggestions

### 💡 Feature Requests
- *Use Case:* Describe the problem you're solving
- *Proposed Solution:* Your idea for implementation
- *Alternatives:* Other solutions you've considered
- *Additional Context:* Any relevant information

### 🌟 Star this repository if you found it helpful! 🌟

*Built with ❤ for the Electronics Laboratory Community*
