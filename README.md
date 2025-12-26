# AIXILCOILS Management Suite (AMS)

A comprehensive enterprise management system with modules for employee performance tracking, HR management, task/project management, workflow automation, and analytics. Available as **Web**, **Desktop**, and **Mobile** applications.

![AMS](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Platforms](https://img.shields.io/badge/Platforms-Web%20|%20Desktop%20|%20Mobile-purple)

## 🚀 Features

### Employee Onboarding
- Step-by-step onboarding wizard for new employees
- Profile completion with photo upload
- Department and role assignment review
- Notification preferences setup
- Progress tracking with visual indicators

### Employee Performance Tracking
- KPI dashboard per employee
- OKRs (Objectives and Key Results)
- Weekly/monthly performance reviews
- Supervisor scoring
- Peer feedback system
- Automated reminders

### HR Management
- Employee directory
- Leave/absence requests with approval workflow
- Attendance tracking
- HR documents storage
- Employee profiles management

### Task & Project Management
- Project creation and tracking
- Kanban board view
- Task assignment and deadlines
- File attachments
- Progress tracking
- Comments on tasks

### Workflow Automation
- Custom workflow builder
- Multi-step approval workflows
- Automated notifications
- Audit logs

### Admin Dashboard
- Company-wide analytics
- Productivity metrics
- Department performance charts
- Project health indicators

## 📱 Platform Support

### Web Application
- Access through any modern browser
- Responsive design for all screen sizes
- Real-time updates via WebSocket

### Desktop Application (Electron)
- Windows, macOS, and Linux support
- System tray integration
- Auto-updates
- Native notifications

### Mobile Application (Capacitor)
- iOS and Android support
- Push notifications
- Offline support
- Native device features

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Zustand (State Management)
- Socket.io-client (Real-time)
- Chart.js (Analytics)
- React Router v6

### Desktop
- Electron
- electron-builder (Distribution)
- electron-updater (Auto-updates)

### Mobile
- Capacitor (iOS/Android)
- Push Notifications
- Local Notifications

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication + RBAC
- Socket.io (WebSocket)
- Redis (Caching)
- Nodemailer (Emails)

## 📁 Project Structure

```
aixilcoils-management-suite/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Zustand stores
│   │   ├── services/         # API services
│   │   ├── styles/           # Global styles
│   │   └── utils/            # Utility functions
│   ├── capacitor.config.json # Mobile app config
│   ├── package.json
│   └── vite.config.js
├── desktop/                   # Electron desktop app
│   ├── main.js               # Main process
│   ├── preload.js            # Preload script
│   ├── assets/               # App icons
│   └── package.json
├── server/                    # Backend API
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   ├── websocket/        # WebSocket server
│   │   └── index.js          # Entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Database seeder
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Environment Variables

Create `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/ams_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
```

### Installation

1. **Clone the repository**
```bash
cd aixilcoils-management-suite
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Setup database**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed
```

4. **Install frontend dependencies**
```bash
cd ../client
npm install
```

5. **Start development servers**

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Demo Credentials
- **Admin:** admin@aixilcoils.com / Password123!
- **HR:** hr@aixilcoils.com / Password123!
- **Manager:** manager@aixilcoils.com / Password123!
- **Employee:** dev1@aixilcoils.com / Password123!

## 💻 Desktop App (Electron)

### Development
```bash
cd desktop
npm install
npm start
```

### Build for Distribution
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

The built applications will be in `desktop/dist/`.

## 📱 Mobile App (Capacitor)

### Setup
```bash
cd client
npm install

# Add platforms
npm run mobile:add:android
npm run mobile:add:ios
```

### Development
```bash
# Sync changes to mobile platforms
npm run mobile:sync

# Open in Android Studio
npm run mobile:open:android

# Open in Xcode (macOS only)
npm run mobile:open:ios
```

### Run on Device
```bash
# Run on Android device/emulator
npm run mobile:run:android

# Run on iOS device/simulator (macOS only)
npm run mobile:run:ios
```

## 📚 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get user by ID |
| PUT | /api/users/me | Update current user profile |
| POST | /api/users/me/complete-onboarding | Complete onboarding |
| GET | /api/users/directory | Employee directory |

### Projects & Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create project |
| GET | /api/tasks/kanban/:projectId | Kanban board |
| POST | /api/tasks | Create task |

### HR
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/leave | Get leave requests |
| POST | /api/leave | Create leave request |
| POST | /api/leave/:id/approve | Approve leave |
| GET | /api/attendance | Get attendance |

### Performance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/kpis/dashboard | KPI dashboard |
| GET | /api/okrs/my-okrs | User's OKRs |
| GET | /api/performance/reviews | Get reviews |

## 👥 User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full system access |
| ADMIN | Administrative access |
| MANAGER | Department management |
| EMPLOYEE | Standard employee |
| HR_OFFICER | HR management access |
| FINANCE | Financial access |
| VIEWER | Read-only access |

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation

## 📊 Database Schema

See `server/prisma/schema.prisma` for the complete database schema including:
- Users, Departments
- Projects, Tasks
- Performance Reviews, KPIs, OKRs
- Leave Requests, Attendance
- Documents, Workflows
- Notifications, Audit Logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ by AIXILCOILS
