// Cloud Attendance System - Frontend JavaScript

class AttendanceSystem {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.baseURL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/.netlify/functions/server/api';
        this.init();
    }

    init() {
        if (this.token) {
            this.showDashboard();
            this.loadTodayStatus();
            this.updateClock();
            setInterval(() => this.updateClock(), 1000);
        } else {
            this.showLogin();
        }

        this.setupEventListeners();
        
        // Always update clock even if not logged in
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Add employee form
        document.getElementById('addEmployeeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEmployee();
        });
    }

    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showDashboard();
                this.loadTodayStatus();
                this.updateClock();
                setInterval(() => this.updateClock(), 1000);
                this.showMessage('Login successful!', 'success');
            } else {
                this.showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = {};
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('dashboard').classList.add('d-none');
        document.body.classList.remove('admin');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('dashboard').classList.remove('d-none');
        
        // Update user info
        document.getElementById('userInfo').textContent = 
            `${this.user.name} (${this.user.employeeId})`;
        
        // Show admin elements if user is admin
        if (this.user.role === 'admin') {
            document.body.classList.add('admin');
        }
    }

    showSection(sectionName, clickedElement = null) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Remove active class from all nav items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }
        
        // Add active class to clicked nav item
        if (clickedElement) {
            clickedElement.classList.add('active');
        }

        // Load section-specific data
        console.log('Loading section:', sectionName);
        switch(sectionName) {
            case 'attendance':
                this.loadTodayStatus();
                break;
            case 'reports':
                this.setDefaultDateRange();
                break;
            case 'employees':
                this.loadEmployees();
                break;
        }
    }

    async loadTodayStatus() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/today`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            this.updateAttendanceStatus(data);
        } catch (error) {
            console.error('Error loading today status:', error);
        }
    }

    updateAttendanceStatus(data) {
        const statusDiv = document.getElementById('attendanceStatus');
        const checkInBtn = document.getElementById('checkInBtn');
        const checkOutBtn = document.getElementById('checkOutBtn');

        if (data.hasCheckedIn && data.hasCheckedOut) {
            statusDiv.innerHTML = `
                <div class="status-badge status-checked-out">
                    <i class="fas fa-check-circle"></i> Checked Out
                </div>
                <div class="mt-2">
                    <small>Check-in: ${this.formatTime(data.record.checkIn)}</small><br>
                    <small>Check-out: ${this.formatTime(data.record.checkOut)}</small><br>
                    <small>Total Hours: ${data.record.totalHours}</small>
                </div>
            `;
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
        } else if (data.hasCheckedIn) {
            statusDiv.innerHTML = `
                <div class="status-badge status-checked-in">
                    <i class="fas fa-clock"></i> Checked In
                </div>
                <div class="mt-2">
                    <small>Check-in: ${this.formatTime(data.record.checkIn)}</small>
                </div>
            `;
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
        } else {
            statusDiv.innerHTML = `
                <div class="status-badge status-not-checked-in">
                    <i class="fas fa-exclamation-circle"></i> Not Checked In
                </div>
            `;
            checkInBtn.disabled = false;
            checkOutBtn.disabled = true;
        }
    }

    async checkIn() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/checkin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Checked in successfully!', 'success');
                this.loadTodayStatus();
            } else {
                this.showMessage(data.error || 'Check-in failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async checkOut() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Checked out successfully!', 'success');
                this.loadTodayStatus();
            } else {
                this.showMessage(data.error || 'Check-out failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('currentDate').textContent = dateString;
    }

    setDefaultDateRange() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('startDate').value = this.formatDate(firstDay);
        document.getElementById('endDate').value = this.formatDate(today);
    }

    async loadReports() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        try {
            const response = await fetch(
                `${this.baseURL}/attendance?startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                }
            );

            const data = await response.json();
            this.displayReports(data);
        } catch (error) {
            this.showMessage('Error loading reports', 'error');
        }
    }

    displayReports(data) {
        const tableDiv = document.getElementById('reportsTable');
        
        if (data.length === 0) {
            tableDiv.innerHTML = '<p class="text-muted">No attendance records found for the selected period.</p>';
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            ${this.user.role === 'admin' ? '<th>Employee</th>' : ''}
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Total Hours</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(record => {
            html += `
                <tr>
                    <td>${this.formatDate(new Date(record.date))}</td>
                    ${this.user.role === 'admin' ? `<td>${record.userName} (${record.employeeId})</td>` : ''}
                    <td>${record.checkIn ? this.formatTime(record.checkIn) : '-'}</td>
                    <td>${record.checkOut ? this.formatTime(record.checkOut) : '-'}</td>
                    <td>${record.totalHours ? record.totalHours + ' hrs' : '-'}</td>
                    <td>
                        <span class="badge ${record.checkOut ? 'bg-success' : 'bg-warning'}">
                            ${record.checkOut ? 'Complete' : 'Incomplete'}
                        </span>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        tableDiv.innerHTML = html;
    }

    async loadEmployees() {
        if (this.user.role !== 'admin') return;

        try {
            const response = await fetch(`${this.baseURL}/users`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            this.displayEmployees(data);
        } catch (error) {
            this.showMessage('Error loading employees', 'error');
        }
    }

    displayEmployees(employees) {
        const tableDiv = document.getElementById('employeesTable');
        
        let html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        employees.forEach(emp => {
            html += `
                <tr>
                    <td>${emp.employeeId}</td>
                    <td>${emp.name}</td>
                    <td>${emp.email}</td>
                    <td>${emp.department}</td>
                    <td>
                        <span class="badge ${emp.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                            ${emp.role}
                        </span>
                    </td>
                    <td>${this.formatDate(new Date(emp.createdAt))}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        tableDiv.innerHTML = html;
    }

    async loadDashboardStats() {
        if (this.user.role !== 'admin') return;

        try {
            const response = await fetch(`${this.baseURL}/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            this.displayDashboardStats(data);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    displayDashboardStats(stats) {
        document.getElementById('totalEmployees').textContent = stats.totalEmployees;
        document.getElementById('presentToday').textContent = stats.presentToday;
        document.getElementById('absentToday').textContent = stats.absentToday;
        document.getElementById('avgHours').textContent = stats.avgHoursThisMonth;
    }

    showAddEmployeeModal() {
        const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
        modal.show();
    }

    async addEmployee() {
        const formData = {
            name: document.getElementById('empName').value,
            email: document.getElementById('empEmail').value,
            password: document.getElementById('empPassword').value,
            employeeId: document.getElementById('empId').value,
            department: document.getElementById('empDepartment').value,
            role: document.getElementById('empRole').value
        };

        try {
            const response = await fetch(`${this.baseURL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Employee added successfully!', 'success');
                document.getElementById('addEmployeeForm').reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
                modal.hide();
                this.loadEmployees();
            } else {
                this.showMessage(data.error || 'Failed to add employee', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at the top of the current content section
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection) {
            activeSection.insertBefore(messageDiv, activeSection.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

// Global functions for HTML onclick events
function logout() {
    app.logout();
}

function showSection(section, event) {
    if (event) {
        event.preventDefault();
        app.showSection(section, event.target);
    } else {
        app.showSection(section);
    }
}

function checkIn() {
    app.checkIn();
}

function checkOut() {
    app.checkOut();
}

function loadReports() {
    app.loadReports();
}

function showAddEmployeeModal() {
    app.showAddEmployeeModal();
}

// Initialize the application
const app = new AttendanceSystem();
