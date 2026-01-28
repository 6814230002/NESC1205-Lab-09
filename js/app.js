const API_BASE = "http://localhost:8000";

/**
 * ฟังก์ชันกลางสำหรับเรียก API
 */
async function apiCall(endpoint, options = {}) {
    let accessToken = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
        let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

        if (response.status === 401 && !endpoint.includes('/auth/login')) {
            const success = await handleRefreshToken();
            if (success) {
                accessToken = localStorage.getItem('accessToken');
                headers['Authorization'] = `Bearer ${accessToken}`;
                response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
            } else {
                logout();
                return;
            }
        }

        const data = await response.json();
        return { ok: response.ok, data, status: response.status };
    } catch (error) {
        return { ok: false, data: { detail: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" } };
    }
}

async function handleRefreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('accessToken', data.access_token);
            return true;
        }
    } catch (e) { console.error(e); }
    return false;
}

// --- ฟังก์ชันสำหรับหน้า Register ---
async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const responseBox = document.getElementById('registerResponse');

    const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password })
    });

    if (res.ok) {
        responseBox.innerHTML = `<p style="color: #10b981;">สมัครสมาชิกสำเร็จ! กำลังไปหน้า Login...</p>`;
        setTimeout(() => window.location.href = 'login.html', 2000);
    } else {
        responseBox.innerHTML = `<p style="color: #ef4444;">${res.data.detail || "สมัครสมาชิกไม่สำเร็จ"}</p>`;
    }
}

// --- ฟังก์ชันสำหรับหน้า Login ---
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = event.target.querySelector('button');

    btn.disabled = true;
    btn.innerText = "Checking...";

    const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (res.ok) {
        localStorage.setItem('accessToken', res.data.access_token);
        localStorage.setItem('refreshToken', res.data.refresh_token);
        window.location.href = 'profile.html';
    } else {
        alert(res.data.detail || "Login Failed");
        btn.disabled = false;
        btn.innerText = "Login";
    }
}

// --- ฟังก์ชันสำหรับหน้า Profile ---
async function getProfile() {
    const res = await apiCall('/users/me');
    if (res.ok) {
        if(document.getElementById('displayUsername')) {
            document.getElementById('displayUsername').innerText = res.data.username;
            document.getElementById('displayEmail').innerText = res.data.email;
        }
        return res.data;
    } else {
        window.location.href = 'login.html';
    }
}

// --- ฟังก์ชันตรวจสอบสถานะ Server (Index Page) ---
async function healthCheck() {
    const statusBadge = document.getElementById('serverStatus');
    if (!statusBadge) return;

    statusBadge.innerText = "Checking...";
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            statusBadge.innerText = "Server Online";
            statusBadge.className = "status-badge online";
        } else {
            throw new Error();
        }
    } catch (e) {
        statusBadge.innerText = "Server Offline";
        statusBadge.className = "status-badge offline";
    }
}

// --- Security Tools ---
function decodeJWT() {
    const token = localStorage.getItem('accessToken');
    const display = document.getElementById('jwtPayload');
    if (!token || !display) return;

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        display.innerText = JSON.stringify(JSON.parse(jsonPayload), null, 4);
    } catch (e) {
        display.innerText = "Invalid Token";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// เรียกใช้ฟังก์ชันเบื้องต้นเมื่อโหลดหน้า
window.onload = () => {
    if (document.getElementById('serverStatus')) healthCheck();
    if (document.getElementById('jwtPayload')) decodeJWT();
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }
};