# Cloud-Based Attendance Tracking System

A comprehensive web-based attendance management system designed to automate record-keeping and simplify attendance management for organizations.

## Features

### 🔐 Authentication & Authorization
- Secure login system with JWT tokens
- Role-based access control (Admin/Employee)
- Password encryption with bcrypt

### 👥 Employee Management (Admin Only)
- Add new employees
- View employee directory
- Manage employee roles and departments

### ⏰ Attendance Tracking
- Easy check-in/check-out functionality
- Real-time attendance status
- Automatic calculation of working hours
- Prevention of duplicate check-ins

### 📊 Reporting & Analytics
- Individual attendance reports
- Date range filtering
- Admin dashboard with statistics
- Monthly average hours tracking

### 🎨 Modern UI/UX
- Responsive design for all devices
- Bootstrap-based interface
- Real-time clock display
- Intuitive navigation

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Bootstrap 5, Font Awesome
- **Data Storage**: JSON files (easily upgradeable to databases)

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation Steps

1. **Clone or download the project**
   ```bash
   cd Attendance_system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and go to: `http://localhost:3001`

## Default Login Credentials

- **Email**: admin@company.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/login` - User login

### User Management
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today` - Get today's attendance status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (Admin only)

## File Structure

```
Attendance_system/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── README.md             # This file
├── data/                 # Data storage directory
│   ├── users.json        # User data
│   └── attendance.json   # Attendance records
└── public/               # Frontend files
    ├── index.html        # Main HTML file
    ├── style.css         # Custom styles
    └── app.js           # Frontend JavaScript
```

## Usage Guide

### For Employees
1. **Login** with your credentials
2. **Check In** when you arrive at work
3. **Check Out** when you leave
4. **View Reports** to see your attendance history

### For Administrators
1. **Login** with admin credentials
2. **Add Employees** through the employee management section
3. **View Dashboard** for organization-wide statistics
4. **Generate Reports** for any employee or date range
5. **Monitor Attendance** in real-time

## Features in Detail

### Attendance Tracking
- **Smart Check-in/Check-out**: Prevents duplicate entries for the same day
- **Automatic Time Calculation**: Calculates total working hours
- **Real-time Status**: Shows current attendance status
- **Date Validation**: Ensures data integrity

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Passwords are encrypted using bcrypt
- **Role-based Access**: Different permissions for admins and employees
- **Session Management**: Automatic token expiration

### Reporting System
- **Flexible Date Ranges**: Filter reports by custom date ranges
- **Export Ready**: Data formatted for easy export
- **Multiple Views**: Individual and organization-wide reports
- **Real-time Updates**: Live data without page refresh

## Customization

### Adding New Features
The system is designed to be easily extensible:

1. **New API Endpoints**: Add routes in `server.js`
2. **Frontend Features**: Extend `app.js` and `index.html`
3. **Styling**: Modify `style.css` for custom appearance

### Database Integration
To upgrade from JSON files to a database:

1. Replace file operations in `server.js`
2. Add database connection configuration
3. Update data models as needed

### Cloud Deployment
The system is ready for cloud deployment:

- **Environment Variables**: Use for JWT secrets and database URLs
- **Static Files**: Serve through CDN for better performance
- **Database**: Upgrade to cloud database (MongoDB, PostgreSQL, etc.)

## Security Considerations

- Change the default JWT secret in production
- Use HTTPS in production environments
- Implement rate limiting for API endpoints
- Regular security updates for dependencies
- Consider implementing 2FA for admin accounts

## Support & Maintenance

### Backup
- Regular backup of `data/` directory
- Export attendance data periodically

### Monitoring
- Check server logs for errors
- Monitor disk space for data files
- Track API response times

### Updates
- Keep dependencies updated
- Monitor for security vulnerabilities
- Test new features in development environment

## License

MIT License - Feel free to modify and distribute as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This system uses file-based storage for simplicity. For production use with multiple concurrent users, consider upgrading to a proper database system like MongoDB or PostgreSQL.
