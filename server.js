const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data storage paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data files
function initializeDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        const defaultAdmin = {
            id: uuidv4(),
            email: 'admin@company.com',
            password: bcrypt.hashSync('admin123', 10),
            name: 'System Administrator',
            role: 'admin',
            employeeId: 'EMP001',
            department: 'IT',
            createdAt: new Date().toISOString()
        };
        fs.writeFileSync(USERS_FILE, JSON.stringify([defaultAdmin], null, 2));
    }
    
    if (!fs.existsSync(ATTENDANCE_FILE)) {
        fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify([], null, 2));
    }
}

// Helper functions
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readAttendance() {
    return JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8'));
}

function writeAttendance(attendance) {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendance, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Authentication
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            employeeId: user.employeeId,
            department: user.department
        }
    });
});

// User management
app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = readUsers();
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

app.post('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, name, role = 'employee', employeeId, department } = req.body;
    const users = readUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = {
        id: uuidv4(),
        email,
        password: bcrypt.hashSync(password, 10),
        name,
        role,
        employeeId,
        department,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
});

// Attendance tracking
app.post('/api/attendance/checkin', authenticateToken, (req, res) => {
    const attendance = readAttendance();
    const today = moment().format('YYYY-MM-DD');
    
    // Check if already checked in today
    const existingRecord = attendance.find(
        record => record.userId === req.user.id && record.date === today
    );

    if (existingRecord && existingRecord.checkIn) {
        return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInRecord = {
        id: uuidv4(),
        userId: req.user.id,
        date: today,
        checkIn: moment().toISOString(),
        checkOut: null,
        totalHours: null,
        status: 'present'
    };

    attendance.push(checkInRecord);
    writeAttendance(attendance);

    res.json(checkInRecord);
});

app.post('/api/attendance/checkout', authenticateToken, (req, res) => {
    const attendance = readAttendance();
    const today = moment().format('YYYY-MM-DD');
    
    const recordIndex = attendance.findIndex(
        record => record.userId === req.user.id && record.date === today
    );

    if (recordIndex === -1) {
        return res.status(400).json({ error: 'No check-in record found for today' });
    }

    const record = attendance[recordIndex];
    if (record.checkOut) {
        return res.status(400).json({ error: 'Already checked out today' });
    }

    const checkOutTime = moment();
    const checkInTime = moment(record.checkIn);
    const totalHours = checkOutTime.diff(checkInTime, 'hours', true);

    attendance[recordIndex] = {
        ...record,
        checkOut: checkOutTime.toISOString(),
        totalHours: Math.round(totalHours * 100) / 100
    };

    writeAttendance(attendance);
    res.json(attendance[recordIndex]);
});

// Get attendance records
app.get('/api/attendance', authenticateToken, (req, res) => {
    const { startDate, endDate, userId } = req.query;
    let attendance = readAttendance();

    // Filter by user if not admin
    if (req.user.role !== 'admin') {
        attendance = attendance.filter(record => record.userId === req.user.id);
    } else if (userId) {
        attendance = attendance.filter(record => record.userId === userId);
    }

    // Filter by date range
    if (startDate) {
        attendance = attendance.filter(record => record.date >= startDate);
    }
    if (endDate) {
        attendance = attendance.filter(record => record.date <= endDate);
    }

    // Add user information
    const users = readUsers();
    const enrichedAttendance = attendance.map(record => {
        const user = users.find(u => u.id === record.userId);
        return {
            ...record,
            userName: user ? user.name : 'Unknown',
            employeeId: user ? user.employeeId : 'Unknown'
        };
    });

    res.json(enrichedAttendance);
});

// Get attendance status for today
app.get('/api/attendance/today', authenticateToken, (req, res) => {
    const attendance = readAttendance();
    const today = moment().format('YYYY-MM-DD');
    
    const todayRecord = attendance.find(
        record => record.userId === req.user.id && record.date === today
    );

    res.json({
        hasCheckedIn: !!todayRecord?.checkIn,
        hasCheckedOut: !!todayRecord?.checkOut,
        record: todayRecord || null
    });
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const users = readUsers();
    const attendance = readAttendance();
    const today = moment().format('YYYY-MM-DD');
    
    const totalEmployees = users.filter(u => u.role === 'employee').length;
    const presentToday = attendance.filter(
        record => record.date === today && record.checkIn
    ).length;
    
    const thisMonth = moment().format('YYYY-MM');
    const monthlyAttendance = attendance.filter(
        record => record.date.startsWith(thisMonth)
    );
    
    const avgHoursThisMonth = monthlyAttendance
        .filter(record => record.totalHours)
        .reduce((sum, record) => sum + record.totalHours, 0) / 
        (monthlyAttendance.filter(record => record.totalHours).length || 1);

    res.json({
        totalEmployees,
        presentToday,
        absentToday: totalEmployees - presentToday,
        avgHoursThisMonth: Math.round(avgHoursThisMonth * 100) / 100
    });
});

// Initialize data and start server
initializeDataFiles();

app.listen(PORT, () => {
    console.log(`Attendance System Server running on port ${PORT}`);
    console.log(`Default admin login: admin@company.com / admin123`);
});
