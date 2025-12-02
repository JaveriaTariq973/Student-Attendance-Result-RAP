// signup.js
const roleSelect = document.getElementById("role");
const signupBtn = document.getElementById("signup-btn");
const sectionContainer = document.getElementById("section-container");

// Show section select only if role is student
roleSelect.addEventListener("change", () => {
    if(roleSelect.value === "student"){
        sectionContainer.style.display = "block";
    } else {
        sectionContainer.style.display = "none";
    }
});

signupBtn.addEventListener("click", () => {
    const role = roleSelect.value;
    const name = document.getElementById("signup-name").value.trim();
    const pass = document.getElementById("signup-pass").value.trim();
    const section = document.getElementById("signup-section").value;

    // Validation
    if(!name || !pass) {
        alert("Please fill in all fields!");
        return;
    }

    if(role === "student" && !section) {
        alert("Please select a section!");
        return;
    }

    const users = getUsers();
    
    // Check if user already exists
    if(users.find(u => u.name === name && u.role === role)){
        alert("User already exists with this username and role!");
        return;
    }

    const newUser = { role, name, password: pass };
    if(role === "student") newUser.section = section;

    saveUser(newUser);
    alert("Signup successful! Redirecting to login...");
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
});