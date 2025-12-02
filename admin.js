// admin.js

const content = document.getElementById("admin-content");
const navButtons = document.querySelectorAll(".nav-btn");
const logoutBtn = document.getElementById("logout-btn");

// Check if admin is logged in
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if(!currentUser || currentUser.role !== "admin"){
    alert("Access denied. Please login as admin.");
    window.location.href = "login.html";
}

// Logout
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
});

// Navigation button clicks
navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const section = btn.getAttribute("data-section");
        showSection(section);
    });
});

// Show section
function showSection(section) {
    switch(section){
        case "profile":
            renderProfile();
            break;
        case "add-teacher":
            renderAddTeacher();
            break;
        case "add-section":
            renderAddSection();
            break;
        case "assign-courses":
            renderAssignCourses();
            break;
        case "notifications":
            renderNotifications();
            break;
        default:
            content.innerHTML = "";
    }
}

// Sections implementations

function renderProfile(){
    content.innerHTML = `
    <h3>Profile</h3>
    <table class="profile-table">
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Name</td><td>${currentUser.name}</td></tr>
        <tr><td>Role</td><td>Admin</td></tr>
    </table>
    `;
}


function renderAddTeacher(){
    content.innerHTML = `
    <h3>Add Teacher</h3>
    <input type="text" id="teacher-name" placeholder="Teacher Name">
    <input type="password" id="teacher-pass" placeholder="Password">
    <button id="add-teacher-btn">Add Teacher</button>
    `;

    document.getElementById("add-teacher-btn").addEventListener("click", () => {
        const name = document.getElementById("teacher-name").value.trim();
        const pass = document.getElementById("teacher-pass").value.trim();
        
        // Validation
        if(!name || !pass) {
            alert("Please fill in both name and password!");
            return;
        }

        const users = getUsers();
        if(users.find(u => u.name === name && u.role === "teacher")){
            alert("Teacher already exists with this username!");
            return;
        }
        
        // Save teacher - now they can login directly
        saveUser({role: "teacher", name, password: pass});
        alert("Teacher added successfully! They can now login with these credentials.");
        renderAddTeacher();
    });
}

function renderAddSection(){
    content.innerHTML = `
    <h3>Add Section</h3>
    <input type="text" id="section-name" placeholder="Section Name (e.g. A)">
    <button id="add-section-btn">Add Section</button>
    `;

    document.getElementById("add-section-btn").addEventListener("click", () => {
        const name = document.getElementById("section-name").value.trim();
        
        // Validation
        if(!name) {
            alert("Please enter a section name!");
            return;
        }

        const courses = getCourses();
        if(courses.find(c => c.section === name)){
            alert("Section already exists!");
            return;
        }
        // Save section as a course placeholder (will link courses later)
        saveCourse({section: name, teachers: [], courses: []});
        alert("Section added successfully!");
        renderAddSection();
    });
}

function renderAssignCourses(){
    const teachers = getUsers().filter(u => u.role === "teacher");
    const sections = getCourses().map(c => c.section);

    content.innerHTML = `
    <h3>Assign Courses</h3>
    <input type="text" id="course-name" placeholder="Course Name">
    <select id="select-teacher">
        <option value="">--Select Teacher--</option>
        ${teachers.map(t => `<option value="${t.name}">${t.name}</option>`).join("")}
    </select>
    <select id="select-section">
        <option value="">--Select Section--</option>
        ${sections.map(s => `<option value="${s}">${s}</option>`).join("")}
    </select>
    <button id="assign-btn">Assign Course</button>
    `;

    document.getElementById("assign-btn").addEventListener("click", () => {
        const courseName = document.getElementById("course-name").value.trim();
        const teacher = document.getElementById("select-teacher").value;
        const section = document.getElementById("select-section").value;

        if(!courseName || !teacher || !section){
            alert("Please fill all fields!");
            return;
        }

        const courses = getCourses();
        const sectionObj = courses.find(c => c.section === section);
        if(!sectionObj.courses) sectionObj.courses = [];
        sectionObj.courses.push({name: courseName, teacher});
        
        // Update the section in storage
        const updatedCourses = courses.map(c => 
            c.section === section ? sectionObj : c
        );
        localStorage.setItem(COURSES_KEY, JSON.stringify(updatedCourses));
        
        alert("Course assigned successfully!");
        renderAssignCourses();
    });
}

function renderNotifications(){
    const attendance = getAttendance();
    const results = getResults();
    let html = "<h3>Notifications</h3>";
    let hasNotification = false;

    // Check for low attendance
    for(const key in attendance){
        // Only check cumulative attendance records
        if(!key.includes("-date-") && !key.includes("-eval-")) {
            const att = attendance[key];
            if(att.present !== undefined && att.total !== undefined && att.total > 0) {
                const percent = (att.present / att.total * 100).toFixed(2);
                
                if(percent < 80){
                    hasNotification = true;
                    const parts = key.split("-");
                    const studentName = parts[parts.length - 1];
                    const courseName = parts[parts.length - 2];
                    const section = parts[0];
                    
                    html += `<p class="notification-item">⚠️ <b>${studentName}</b> (Section ${section}) has low attendance in <b>${courseName}</b>: ${percent}%</p>`;
                }
            }
        }
    }

    // Check for low grades
    for(const key in results){
        // Only check cumulative result records
        if(!key.includes("-eval-")) {
            const res = results[key];
            if(res.marks !== undefined && res.total !== undefined && res.total > 0) {
                const percent = (res.marks / res.total * 100).toFixed(2);
                
                if(percent < 60){
                    hasNotification = true;
                    const parts = key.split("-");
                    const studentName = parts[parts.length - 1];
                    const courseName = parts[parts.length - 2];
                    const section = parts[0];
                    
                    html += `<p class="notification-item">⚠️ <b>${studentName}</b> (Section ${section}) has low marks in <b>${courseName}</b>: ${percent}%</p>`;
                }
            }
        }
    }

    if(!hasNotification){
        html += `<p class="no-notifications">✓ No notifications. All students are performing well!</p>`;
    }

    content.innerHTML = html;
}

// Show profile by default
showSection("profile");