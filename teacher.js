const content = document.getElementById("teacher-content");
const navButtons = document.querySelectorAll(".nav-btn");
const logoutBtn = document.getElementById("logout-btn");

// Check login
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if(!currentUser || currentUser.role !== "teacher") {
    alert("Access denied. Please login as teacher.");
    window.location.href = "login.html";
}

// Logout
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
});

// Navigation clicks
navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const section = btn.getAttribute("data-section");
        showSection(section);
    });
});

// Show section
function showSection(section) {
    switch(section) {
        case "profile":
            renderProfile();
            break;
        case "upload-attendance":
            renderUploadAttendance();
            break;
        case "upload-result":
            renderUploadResult();
            break;
        case "notifications":
            renderNotifications();
            break;
        default:
            content.innerHTML = "";
    }
}

// Profile
function renderProfile() {
    content.innerHTML = `
        <h3>Profile</h3>
        <table class="profile-table">
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Name</td><td>${currentUser.name}</td></tr>
            <tr><td>Role</td><td>Teacher</td></tr>
            <tr><td>Courses Assigned</td><td>${getCourses()
                .filter(c => c.courses.some(course => course.teacher === currentUser.name))
                .map(c => c.courses.map(course => `${course.name} (${c.section})`).join(", "))
                .join("; ") || "No courses assigned"}
            </td></tr>
        </table>
    `;
}

// ========== UPLOAD ATTENDANCE SECTION ==========
function renderUploadAttendance() {
    const sectionsCourses = getCourses().filter(c =>
        c.courses.some(course => course.teacher === currentUser.name)
    );

    if(sectionsCourses.length === 0){
        content.innerHTML = "<p>No courses assigned yet.</p>";
        return;
    }

    content.innerHTML = `
        <h3>Upload Attendance</h3>
        <select id="attendance-course">
            <option value="">--Select Course--</option>
            ${sectionsCourses.map(c => 
                c.courses.filter(course => course.teacher === currentUser.name)
                 .map(course => `<option value="${c.section}-${course.name}">${course.name} (${c.section})</option>`).join("")
            ).join("")}
        </select>
        <button id="load-attendance-history">View History</button>
        <div id="attendance-history"></div>
    `;

    document.getElementById("load-attendance-history").addEventListener("click", () => {
        const selected = document.getElementById("attendance-course").value;
        if(!selected) return alert("Select a course");

        const [section, courseName] = selected.split("-");
        showAttendanceHistory(section, courseName);
    });
}

function showAttendanceHistory(section, courseName) {
    const attendance = getAttendance();
    const historyKey = `${section}-${courseName}`;
    
    // Get all attendance dates for this course
    const dates = {};
    for (const key in attendance) {
        if (key.startsWith(historyKey + "-date-")) {
            const dateStr = key.replace(historyKey + "-date-", "");
            dates[dateStr] = attendance[key];
        }
    }

    let html = `
        <div class="history-section">
            <h4>Attendance History for ${courseName} (${section})</h4>
            <button id="add-new-attendance" class="add-new-btn">+ Add New Attendance</button>
            <div class="history-list">
    `;

    const sortedDates = Object.keys(dates).sort().reverse(); // newest first

    if(sortedDates.length === 0) {
        html += `<p class="no-data">No attendance records yet.</p>`;
    } else {
        sortedDates.forEach(date => {
            html += `
                <div class="history-item" onclick="editAttendance('${section}', '${courseName}', '${date}')">
                    <div class="history-date">${formatDate(date)}</div>
                    <div class="history-action">Click to View/Edit →</div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    document.getElementById("attendance-history").innerHTML = html;

    document.getElementById("add-new-attendance").addEventListener("click", () => {
        createNewAttendance(section, courseName);
    });
}

function createNewAttendance(section, courseName) {
    const dateInput = prompt("Enter date (DD-MM-YYYY):", getTodayDate());
    if(!dateInput) return;

    // Validate date format
    if(!/^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
        alert("Invalid date format! Use DD-MM-YYYY");
        return;
    }

    loadAttendanceForm(section, courseName, dateInput, {});
}

function editAttendance(section, courseName, date) {
    const attendance = getAttendance();
    const historyKey = `${section}-${courseName}-date-${date}`;
    const existingData = attendance[historyKey] || {};
    
    loadAttendanceForm(section, courseName, date, existingData);
}

function loadAttendanceForm(section, courseName, date, existingData) {
    const students = getUsers().filter(u => u.role === "student" && u.section === section);
    
    let html = `
        <div class="form-section">
            <h4>Attendance for ${courseName} (${section}) - ${formatDate(date)}</h4>
            <table class='profile-table attendance-table'>
                <tr><th>Student Name</th><th>Status</th></tr>
    `;

    students.forEach(s => {
        const status = existingData[s.name] || "P";
        html += `
            <tr>
                <td>${s.name}</td>
                <td>
                    <select class="att-select" data-student="${s.name}">
                        <option value="P" ${status === "P" ? "selected" : ""}>Present</option>
                        <option value="A" ${status === "A" ? "selected" : ""}>Absent</option>
                    </select>
                </td>
            </tr>
        `;
    });

    html += `
            </table>
            <div class="button-group">
                <button id="save-attendance" class="save-btn">Save Attendance</button>
                <button id="cancel-attendance" class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    document.getElementById("attendance-history").innerHTML = html;

    document.getElementById("save-attendance").addEventListener("click", () => {
        saveAttendanceForDate(section, courseName, date);
    });

    document.getElementById("cancel-attendance").addEventListener("click", () => {
        showAttendanceHistory(section, courseName);
    });
}

function saveAttendanceForDate(section, courseName, date) {
    const attendance = getAttendance();
    const historyKey = `${section}-${courseName}-date-${date}`;
    const dateData = {};

    document.querySelectorAll(".att-select").forEach(sel => {
        const student = sel.dataset.student;
        dateData[student] = sel.value;
        
        // Update cumulative attendance for student view
        const studentKey = `${section}-${courseName}-${student}`;
        if(!attendance[studentKey]) {
            attendance[studentKey] = { present: 0, total: 0 };
        }
        
        // Only increment if this is new data
        if(!attendance[historyKey] || !attendance[historyKey][student]) {
            attendance[studentKey].total += 1;
            if(sel.value === "P") attendance[studentKey].present += 1;
        } else {
            // Update existing record
            const oldStatus = attendance[historyKey][student];
            if(oldStatus === "A" && sel.value === "P") {
                attendance[studentKey].present += 1;
            } else if(oldStatus === "P" && sel.value === "A") {
                attendance[studentKey].present -= 1;
            }
        }
    });

    attendance[historyKey] = dateData;
    saveAttendance(attendance);
    alert("Attendance saved successfully!");
    showAttendanceHistory(section, courseName);
}

// ========== UPLOAD RESULT SECTION ==========
function renderUploadResult() {
    const sectionsCourses = getCourses().filter(c =>
        c.courses.some(course => course.teacher === currentUser.name)
    );

    if(sectionsCourses.length === 0){
        content.innerHTML = "<p>No courses assigned yet.</p>";
        return;
    }

    content.innerHTML = `
        <h3>Upload Result</h3>
        <select id="result-course">
            <option value="">--Select Course--</option>
            ${sectionsCourses.map(c => 
                c.courses.filter(course => course.teacher === currentUser.name)
                 .map(course => `<option value="${c.section}-${course.name}">${course.name} (${c.section})</option>`).join("")
            ).join("")}
        </select>
        <button id="load-result-history">View Evaluations</button>
        <div id="result-history"></div>
    `;

    document.getElementById("load-result-history").addEventListener("click", () => {
        const selected = document.getElementById("result-course").value;
        if(!selected) return alert("Select a course");

        const [section, courseName] = selected.split("-");
        showResultHistory(section, courseName);
    });
}

function showResultHistory(section, courseName) {
    const results = getResults();
    const historyKey = `${section}-${courseName}`;
    
    // Get all evaluations for this course
    const evaluations = {};
    for (const key in results) {
        if (key.startsWith(historyKey + "-eval-")) {
            const evalName = key.replace(historyKey + "-eval-", "");
            evaluations[evalName] = results[key];
        }
    }

    let html = `
        <div class="history-section">
            <h4>Evaluations for ${courseName} (${section})</h4>
            <button id="add-new-evaluation" class="add-new-btn">+ Add New Evaluation</button>
            <div class="history-list">
    `;

    const evalNames = Object.keys(evaluations).sort();

    if(evalNames.length === 0) {
        html += `<p class="no-data">No evaluations yet.</p>`;
    } else {
        evalNames.forEach(evalName => {
            const evalData = evaluations[evalName];
            html += `
                <div class="history-item" onclick="editEvaluation('${section}', '${courseName}', '${evalName}')">
                    <div class="eval-name">${evalName}</div>
                    <div class="eval-details">Total Marks: ${evalData.totalMarks || 100}</div>
                    <div class="history-action">Click to View/Edit →</div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    document.getElementById("result-history").innerHTML = html;

    document.getElementById("add-new-evaluation").addEventListener("click", () => {
        createNewEvaluation(section, courseName);
    });
}

function createNewEvaluation(section, courseName) {
    const evalName = prompt("Enter evaluation name (e.g., Quiz 1, Mid Term, Final):");
    if(!evalName || evalName.trim() === "") return;

    const totalMarks = prompt("Enter total marks for this evaluation:", "100");
    if(!totalMarks || isNaN(totalMarks)) {
        alert("Invalid total marks!");
        return;
    }

    loadResultForm(section, courseName, evalName.trim(), parseInt(totalMarks), {});
}

function editEvaluation(section, courseName, evalName) {
    const results = getResults();
    const historyKey = `${section}-${courseName}-eval-${evalName}`;
    const existingData = results[historyKey] || {};
    const totalMarks = existingData.totalMarks || 100;
    
    loadResultForm(section, courseName, evalName, totalMarks, existingData.students || {});
}

function loadResultForm(section, courseName, evalName, totalMarks, existingData) {
    const students = getUsers().filter(u => u.role === "student" && u.section === section);
    
    let html = `
        <div class="form-section">
            <h4>${evalName} - ${courseName} (${section})</h4>
            <p class="total-marks-display">Total Marks: ${totalMarks}</p>
            <table class='profile-table result-table'>
                <tr><th>Student Name</th><th>Marks Obtained</th></tr>
    `;

    students.forEach(s => {
        const marks = existingData[s.name] || "";
        html += `
            <tr>
                <td>${s.name}</td>
                <td>
                    <input type="number" class="res-input" data-student="${s.name}" 
                           value="${marks}" min="0" max="${totalMarks}" placeholder="Enter marks">
                </td>
            </tr>
        `;
    });

    html += `
            </table>
            <div class="button-group">
                <button id="save-results" class="save-btn">Save Results</button>
                <button id="cancel-results" class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    document.getElementById("result-history").innerHTML = html;

    document.getElementById("save-results").addEventListener("click", () => {
        saveResultForEvaluation(section, courseName, evalName, totalMarks);
    });

    document.getElementById("cancel-results").addEventListener("click", () => {
        showResultHistory(section, courseName);
    });
}

function saveResultForEvaluation(section, courseName, evalName, totalMarks) {
    const results = getResults();
    const historyKey = `${section}-${courseName}-eval-${evalName}`;
    const evalData = {
        totalMarks: totalMarks,
        students: {}
    };

    document.querySelectorAll(".res-input").forEach(inp => {
        const student = inp.dataset.student;
        const marks = parseInt(inp.value) || 0;
        evalData.students[student] = marks;

        // Update student's cumulative result
        const studentKey = `${section}-${courseName}-${student}`;
        if(!results[studentKey]) {
            results[studentKey] = { marks: 0, total: 0 };
        }
        
        // Only add if this is new data
        if(!results[historyKey] || !results[historyKey].students || !results[historyKey].students[student]) {
            results[studentKey].marks += marks;
            results[studentKey].total += totalMarks;
        } else {
            // Update existing record
            const oldMarks = results[historyKey].students[student];
            results[studentKey].marks = results[studentKey].marks - oldMarks + marks;
        }
    });

    results[historyKey] = evalData;
    saveResults(results);
    alert("Results saved successfully!");
    showResultHistory(section, courseName);
}

// ========== NOTIFICATIONS ==========
function renderNotifications(){
    const attendance = getAttendance();
    let html = "<h3>Notifications</h3>";
    let hasNotification = false;

    for(const key in attendance){
        // Only check cumulative attendance records (not date-specific ones)
        if(!key.includes("-date-") && !key.includes("-eval-")) {
            const att = attendance[key];
            if(att.present !== undefined && att.total !== undefined) {
                const percent = (att.present / att.total * 100).toFixed(2);
                if(percent < 80){
                    hasNotification = true;
                    const parts = key.split("-");
                    const studentName = parts[parts.length - 1];
                    const courseName = parts[parts.length - 2];
                    html += `<p class="notification-item">⚠️ Student <b>${studentName}</b> has low attendance in <b>${courseName}</b>: ${percent}%</p>`;
                }
            }
        }
    }

    if(!hasNotification){
        html += `<p class="no-notifications">✓ No notifications. All students have good attendance!</p>`;
    }

    content.innerHTML = html;
}

// ========== UTILITY FUNCTIONS ==========
function getTodayDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatDate(dateStr) {
    // Convert DD-MM-YYYY to readable format
    const parts = dateStr.split("-");
    if(parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = parseInt(parts[1]) - 1;
        return `${parts[0]} ${months[monthIndex]} ${parts[2]}`;
    }
    return dateStr;
}

// Show profile by default
showSection("profile");