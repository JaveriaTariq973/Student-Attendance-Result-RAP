// login.js
const roleSelect = document.getElementById("role");
const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", () => {
    const role = roleSelect.value;
    const name = document.getElementById("login-name").value.trim();
    const pass = document.getElementById("login-pass").value.trim();
    
    // Validation
    if(!name || !pass) {
        alert("Please fill in all fields!");
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.name === name && u.password === pass && u.role === role);

    if(user){
        // Save current session
        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location.href = role + "_dashboard.html";
    } else {
        alert("Invalid credentials! Please check username, password, and role.");
    }
});