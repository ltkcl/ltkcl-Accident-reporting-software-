/* =================================================================
   GLOBAL VARIABLES & ELEMENTS
   ================================================================= */
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const userView = document.getElementById('user-view-container');
const adminView = document.getElementById('admin-view-container');

// User Elements
const userNameDisplay = document.querySelector('.user-status');
const gpsStatusBar = document.getElementById('gps-status-bar');
const gpsText = document.getElementById('gps-text');
const sosBtn = document.getElementById('sos-btn');
const incidentForm = document.getElementById('incident-form');
const userReportsList = document.getElementById('user-reports-list');

// API Configuration
const API_BASE_URL = window.location.origin + '/api/users';

// State
let currentLocation = null;
let currentUser = { name: "Anonymous", phone: "N/A", role: "user", email: "" };

/* =================================================================
   INITIALIZATION & LOGIN LOGIC
   ================================================================= */
window.addEventListener('load', () => {
    // Check if session exists
    const session = JSON.parse(localStorage.getItem('resq_session') || 'null');

    if (session) {
        currentUser = session;
        loginOverlay.style.display = 'none';

        // Route based on role
        if (currentUser.role === 'admin') {
            initAdminView();
        } else {
            initUserView();
        }
    }
});

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('inp-email').value.toLowerCase();
        const name = document.getElementById('inp-name').value;
        const phone = document.getElementById('inp-phone').value;

        if (name && phone && email) {
            // Determine Role based on Email
            let role = 'user';
            if (email.includes('admin') || email === 'admin@resq.com') {
                role = 'admin';
            }

            // Save Session
            currentUser = { name, phone, role, email };
            localStorage.setItem('resq_session', JSON.stringify(currentUser));

            // Redirect
            loginOverlay.classList.add('hidden');
            setTimeout(() => {
                loginOverlay.style.display = 'none';
                if (role === 'admin') {
                    initAdminView();
                } else {
                    initUserView();
                }
            }, 500);
        }
    });
}

function logout() {
    localStorage.removeItem('resq_session');
    location.reload();
}

/* =================================================================
   USER VIEW FUNCTIONS
   ================================================================= */
function initUserView() {
    userView.style.display = 'block';
    adminView.style.display = 'none';

    // Update Name in Navbar
    const nameSpan = document.getElementById('user-display-name');
    if (nameSpan) nameSpan.innerText = currentUser.name;
    else if (userNameDisplay) userNameDisplay.innerHTML = `<span class="dot"></span> ${currentUser.name}`;

    initGeolocation();
    loadUserReports();
}

function initGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateGPSStatus(true, `GPS Locked: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
            },
            (error) => {
                console.warn("GPS Access Denied. Using Demo Location.");
                useDummyLocation();
            }, { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        useDummyLocation();
    }
}

function useDummyLocation() {
    currentLocation = { lat: 28.6139, lng: 77.2090 };
    updateGPSStatus(true, "⚠️ GPS Simulation Mode (New Delhi)");
}

function updateGPSStatus(isSuccess, text) {
    if (gpsText) gpsText.innerText = text;
    if (gpsStatusBar) {
        if (isSuccess) gpsStatusBar.classList.add('active');
        else gpsStatusBar.classList.remove('active');
    }
}

// File upload handler
const mediaUpload = document.getElementById('media-upload');
const fileName = document.querySelector('label[for="media-upload"]');
if (mediaUpload && fileName) {
    mediaUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileName.innerHTML = `<i class="fa-solid fa-camera"></i> ${file.name}`;
        } else {
            fileName.innerHTML = '<i class="fa-solid fa-camera"></i> Tap to Attach';
        }
    });
}

// User Report Logic
if (incidentForm) {
    incidentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentLocation) { 
            alert("Waiting for GPS..."); 
            return; 
        }

        const formData = new FormData(incidentForm);
        const mediaFile = document.getElementById('media-upload')?.files[0];
        const details = document.getElementById('details').value;

        const result = await saveReportToDB(
            formData.get('type'),
            "High",
            details,
            mediaFile
        );

        if (result) {
            incidentForm.reset();
            if (fileName) fileName.innerHTML = '<i class="fa-solid fa-camera"></i> Tap to Attach';
            alert("✅ Report Submitted! Help is on the way.");
        }
    });
}

if (sosBtn) {
    sosBtn.addEventListener('click', async () => {
        if (!currentLocation) { 
            alert("Waiting for GPS..."); 
            return; 
        }
        sosBtn.style.transform = "scale(0.9)";
        setTimeout(() => sosBtn.style.transform = "scale(1)", 200);

        const result = await saveReportToDB("SOS PANIC", "CRITICAL", "User pressed Panic Button");
        if (result) {
            alert("🚨 SOS SENT! Admin Notified.");
        }
    });
}

async function saveReportToDB(type, priority, details, mediaFile = null) {
    if (!currentLocation) {
        alert("Waiting for GPS...");
        return null;
    }

    try {
        // Map frontend incident types to backend enum values
        const incidentMap = {
            'accident': 'Medical',
            'medical': 'Medical',
            'fire': 'Fire',
            'crime': 'Ilegal',
            'SOS PANIC': 'Medical'
        };
        const mappedIncident = incidentMap[type.toLowerCase()] || 'Medical';

        const formData = new FormData();
        formData.append('username', currentUser.name);
        formData.append('phoneNumber', currentUser.phone);
        formData.append('description', details || 'No details provided');
        formData.append('Incident', mappedIncident);
        formData.append('location', `${currentLocation.lat},${currentLocation.lng}`);
        formData.append('severity', priority || 'High');
        formData.append('status', false);
        if (currentUser.email) {
            formData.append('email', currentUser.email);
        }
        
        if (mediaFile) {
            formData.append('image', mediaFile);
        }

        const response = await fetch(`${API_BASE_URL}/createuser`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success !== false && result.data) {
            loadUserReports();
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save report');
        }
    } catch (error) {
        console.error('Error saving report:', error);
        alert('Failed to submit report: ' + error.message);
        return null;
    }
}

async function loadUserReports() {
    if (!currentUser.phone || currentUser.phone === "N/A") {
        if (userReportsList) {
            userReportsList.innerHTML = '<p style="color:#888; text-align:center; padding:10px;">Please login to view reports.</p>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/phone/${currentUser.phone}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load reports: ${response.status}`);
        }
        
        const result = await response.json();
        const reports = result.data || [];
        
        if (!userReportsList) return;
        
        userReportsList.innerHTML = "";

        if (reports.length === 0) {
            userReportsList.innerHTML = '<p style="color:#888; text-align:center; padding:10px;">No active reports.</p>';
            return;
        }

        reports.forEach(report => {
            const div = document.createElement('div');
            div.className = `report-item ${report.status ? 'solved' : ''}`;
            div.style.cssText = "border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:8px; background:#fff;";

            const reportDate = new Date(report.createdAt || report.updatedAt).toLocaleString();
            const statusText = report.status ? 'Solved' : 'Open';
            const statusColor = report.status ? 'green' : 'red';

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${(report.Incident || report.type || 'INCIDENT').toUpperCase()}</strong>
                        <div style="font-size:0.8rem; color:#666;">${reportDate}</div>
                        <div style="font-size:0.9rem; margin-top:5px;">Status: <span style="font-weight:bold; color:${statusColor}">${statusText}</span></div>
                    </div>
                    ${!report.status ? `<button onclick="markSolved('${report._id}')" style="background:#2ecc71; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Mark Safe</button>` : '<i class="fa-solid fa-check-circle" style="color:green; font-size:1.5rem;"></i>'}
                </div>
            `;
            userReportsList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading reports:', error);
        if (userReportsList) {
            userReportsList.innerHTML = '<p style="color:#888; text-align:center; padding:10px;">Error loading reports.</p>';
        }
    }
}

window.markSolved = async function(id) {
    try {
        const updateResponse = await fetch(`${API_BASE_URL}/updateStatus`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _id: id,
                status: true
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({ message: 'Update failed' }));
            throw new Error(errorData.message || 'Failed to update status');
        }

        const updateResult = await updateResponse.json();
        if (updateResult.success !== false && updateResult.data) {
            loadUserReports();
        } else {
            alert(updateResult.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error marking as solved:', error);
        alert(error.message || 'Failed to update status');
    }
};

/* =================================================================
   ADMIN VIEW FUNCTIONS
   ================================================================= */
function initAdminView() {
    adminView.style.display = 'block';
    userView.style.display = 'none';
    refreshAdminData();
}

window.switchAdminView = function(viewName, menuElement) {
    // Tab switching UI
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (menuElement) menuElement.classList.add('active');

    // Hide all sections
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');

    // Show target section
    const viewId = `view-${viewName}`;
    const selectedView = document.getElementById(viewId);
    if (selectedView) selectedView.style.display = 'block';

    // Update Header
    const titles = {
        'dashboard': 'Live Incident Monitor',
        'units': 'Active Units Status',
        'analytics': 'Performance Analytics'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.innerText = titles[viewName] || 'Admin Panel';

    // Load Data specific to view
    if (viewName === 'dashboard') loadAdminReports();
    if (viewName === 'units') loadUnitsData();
    if (viewName === 'analytics') loadAnalyticsData();

    // Close sidebar on mobile
    if (window.innerWidth <= 768) toggleSidebar();
};

window.refreshAdminData = function() {
    loadAdminReports();
    // Also refresh other tabs if active
    const activeView = document.querySelector('.view-section[style*="block"]');
    if (activeView && activeView.id === 'view-units') loadUnitsData();
    if (activeView && activeView.id === 'view-analytics') loadAnalyticsData();
};

async function loadAdminReports() {
    try {
        const response = await fetch(`${API_BASE_URL}/all`);
        
        if (!response.ok) {
            throw new Error(`Failed to load reports: ${response.status}`);
        }
        
        const result = await response.json();
        const reports = result.data || [];

        // Update Stats
        const statTotal = document.getElementById('stat-total');
        const statActive = document.getElementById('stat-active');
        const statSolved = document.getElementById('stat-solved');
        
        if (statTotal) statTotal.innerText = reports.length;
        if (statActive) statActive.innerText = reports.filter(r => !r.status).length;
        if (statSolved) statSolved.innerText = reports.filter(r => r.status).length;

        const tbody = document.querySelector('#reports-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = "";

        if (reports.length === 0) {
            tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding: 20px;'>No incidents reported yet.</td></tr>";
            return;
        }

        reports.forEach(report => {
            const row = document.createElement('tr');

            // Parse location (format: "lat,lng" or object)
            let lat, lng;
            if (typeof report.location === 'string') {
                const coords = report.location.split(',');
                lat = coords[0];
                lng = coords[1];
            } else if (report.location && report.location.lat) {
                lat = report.location.lat;
                lng = report.location.lng;
            }

            // Generate Maps Link
            const mapLink = lat && lng ?
                `https://www.google.com/maps?q=${lat},${lng}` :
                "#";

            const badgeClass = !report.status ? 'bg-red' : 'bg-green';
            const statusText = report.status ? 'Solved' : 'Open';
            const reportDate = new Date(report.createdAt || report.updatedAt).toLocaleString();

            row.innerHTML = `
                <td>${reportDate.split(',')[1]?.trim() || reportDate}</td>
                <td><strong>${report.username || 'N/A'}</strong></td>
                <td>${report.phoneNumber || 'N/A'}</td>
                <td><span style="text-transform:capitalize">${report.Incident || 'N/A'}</span></td>
                <td style="max-width: 200px; overflow:hidden; text-overflow:ellipsis;">${report.description || "N/A"}</td>
                <td>
                    <a href="${mapLink}" target="_blank" class="btn-loc">Map</a>
                </td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    ${!report.status 
                        ? `<button onclick="resolveReport('${report._id}')" class="btn-solve">Resolve</button>` 
                        : '<span style="color:#aaa; font-size:0.85rem;">Closed</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading admin reports:', error);
        const tbody = document.querySelector('#reports-table tbody');
        if (tbody) {
            tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding: 20px; color:red;'>Error loading reports. Please refresh.</td></tr>";
        }
    }
}

window.resolveReport = async function(id) {
    try {
        const updateResponse = await fetch(`${API_BASE_URL}/updateStatus`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _id: id,
                status: true
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({ message: 'Update failed' }));
            throw new Error(errorData.message || 'Failed to update status');
        }

        const updateResult = await updateResponse.json();
        if (updateResult.success !== false && updateResult.data) {
            refreshAdminData();
        } else {
            alert(updateResult.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error resolving report:', error);
        alert(error.message || 'Failed to update status');
    }
};

function loadUnitsData() {
    const units = [
        { id: "P-101", type: "Police Patrol", status: "Busy", loc: "Sector 4", eta: "5 min" },
        { id: "A-202", type: "Ambulance", status: "Available", loc: "Hospital HQ", eta: "0 min" },
        { id: "F-305", type: "Fire Engine", status: "Available", loc: "Fire Station 1", eta: "0 min" }
    ];
    const tbody = document.getElementById('units-body');
    if (!tbody) return;
    
    tbody.innerHTML = units.map(u => `
        <tr>
            <td><b>${u.id}</b></td>
            <td>${u.type}</td>
            <td><span style="color:${u.status === 'Available' ? 'green' : 'red'}; font-weight:bold;">${u.status}</span></td>
            <td>${u.loc}</td>
            <td>${u.eta}</td>
        </tr>
    `).join('');
}

async function loadAnalyticsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/all`);
        
        if (!response.ok) {
            throw new Error(`Failed to load analytics: ${response.status}`);
        }
        
        const result = await response.json();
        const reports = result.data || [];
        
        // Count Types
        let counts = { "accident": 0, "medical": 0, "fire": 0, "crime": 0, "SOS PANIC": 0 };
        reports.forEach(r => {
            const type = (r.Incident || '').toLowerCase();
            if (type.includes('medical')) counts["medical"]++;
            else if (type.includes('fire')) counts["fire"]++;
            else if (type.includes('crime') || type.includes('ilegal')) counts["crime"]++;
            else if (type.includes('accident')) counts["accident"]++;
            else if (type.includes('sos') || type.includes('panic')) counts["SOS PANIC"]++;
        });

        const total = reports.length || 1; 
        const chartDiv = document.getElementById('chart-types');
        if (!chartDiv) return;
        
        chartDiv.innerHTML = "";

        for (const [type, count] of Object.entries(counts)) {
            if (count === 0) continue;
            const percentage = Math.round((count / total) * 100);
            
            let color = '#3498db';
            if(type === 'fire') color = '#e74c3c';
            if(type === 'medical') color = '#2ecc71';
            if(type === 'crime') color = '#9b59b6';
            if(type === 'SOS PANIC') color = '#e74c3c';

            chartDiv.innerHTML += `
                <div class="bar-wrapper">
                    <div class="bar-header">
                        <span style="text-transform:capitalize; font-weight:600;">${type}</span>
                        <span>${count} (${percentage}%)</span>
                    </div>
                    <div class="bar-bg">
                        <div class="bar-fill" style="width:${percentage}%; background:${color};"></div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        const chartDiv = document.getElementById('chart-types');
        if (chartDiv) {
            chartDiv.innerHTML = '<p style="color:red;">Error loading analytics data</p>';
        }
    }
}

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
};
