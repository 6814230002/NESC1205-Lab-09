// js/auth.js
async function checkGlobalStatus() {
    const token = localStorage.getItem('accessToken');
    const statusText = document.getElementById('authStatusText');

    if (token) {
        // ถ้ามี Token ให้เปลี่ยนสถานะใน Navbar หรือแสดงชื่อ User
        console.log("Logged In");
    }
}

// เรียกใช้เมื่อโหลดหน้า
window.onload = checkGlobalStatus;