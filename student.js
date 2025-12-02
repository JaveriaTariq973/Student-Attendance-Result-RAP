const content = document.getElementById("student-content");
const navButtons = document.querySelectorAll(".nav-btn");
const logoutBtn = document.getElementById("logout-btn");

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if(!currentUser || currentUser.role !== "student"){
    alert("Access denied. Please login as student.");
    window.location.href = "login.html";
}

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
});

navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const section = btn.getAttribute("data-section");
        showSection(section);
    });
});

function showSection(section){
    switch(section){
        case "profile":
            renderProfile();
            break;
        case "attendance":
            renderAttendance();
            break;
        case "results":
            renderResults();
            break;
        case "notifications":
            renderNotifications();
            break;
        default:
            content.innerHTML = "";
    }
}

// Profile
function renderProfile(){
    content.innerHTML = `
    <h3>Profile</h3>
    <table class="profile-table">
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Name</td><td>${currentUser.name}</td></tr>
        <tr><td>Role</td><td>Student</td></tr>
        <tr><td>Section</td><td>${currentUser.section}</td></tr>
    </table>
    `;
}

// Attendance - Show Date-wise Details
function renderAttendance(){
    const allAttendance = getAttendance();
    
    // Group by course
    const courseData = {};

    for (const key in allAttendance) {
        // Look for date-specific records
        if(key.includes("-date-")) {
            const parts = key.split("-date-");
            const [section, course] = parts[0].split("-");
            const date = parts[1];
            
            if(section === currentUser.section) {
                if(!courseData[course]) {
                    courseData[course] = {
                        dates: {},
                        totalPresent: 0,
                        totalClasses: 0
                    };
                }
                
                const dateRecord = allAttendance[key];
                if(dateRecord[currentUser.name]) {
                    const status = dateRecord[currentUser.name];
                    courseData[course].dates[date] = status;
                    courseData[course].totalClasses++;
                    if(status === "P") courseData[course].totalPresent++;
                }
            }
        }
    }

    let html = "<h3>Attendance</h3>";

    if(Object.keys(courseData).length === 0) {
        html += "<p>No attendance records yet.</p>";
    } else {
        for(const course in courseData) {
            const data = courseData[course];
            const percentage = ((data.totalPresent / data.totalClasses) * 100).toFixed(2);
            const statusClass = percentage < 80 ? 'low-attendance-course' : '';
            
            html += `
                <div class="course-section ${statusClass}">
                    <div class="course-header">
                        <h4>${course}</h4>
                        <div class="course-summary">
                            Present: ${data.totalPresent}/${data.totalClasses} 
                            <span class="percentage">(${percentage}%)</span>
                        </div>
                    </div>
                    <table class="detail-table">
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
            `;
            
            // Sort dates (newest first)
            const sortedDates = Object.keys(data.dates).sort().reverse();
            
            sortedDates.forEach(date => {
                const status = data.dates[date];
                const statusText = status === "P" ? "Present" : "Absent";
                const statusClass = status === "P" ? "status-present" : "status-absent";
                
                html += `
                    <tr>
                        <td>${formatDate(date)}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    </tr>
                `;
            });
            
            html += `</table></div>`;
        }
    }

    content.innerHTML = html;
}

// Results - Show Evaluation-wise Details
function renderResults(){
    const allResults = getResults();
    
    // Group by course
    const courseData = {};

    for (const key in allResults) {
        // Look for evaluation-specific records
        if(key.includes("-eval-")) {
            const parts = key.split("-eval-");
            const [section, course] = parts[0].split("-");
            const evalName = parts[1];
            
            if(section === currentUser.section) {
                if(!courseData[course]) {
                    courseData[course] = {
                        evaluations: {},
                        totalObtained: 0,
                        totalMarks: 0
                    };
                }
                
                const evalRecord = allResults[key];
                if(evalRecord.students && evalRecord.students[currentUser.name] !== undefined) {
                    const obtained = evalRecord.students[currentUser.name];
                    const total = evalRecord.totalMarks;
                    
                    courseData[course].evaluations[evalName] = {
                        obtained: obtained,
                        total: total
                    };
                    courseData[course].totalObtained += obtained;
                    courseData[course].totalMarks += total;
                }
            }
        }
    }

    let html = "<h3>Results</h3>";

    if(Object.keys(courseData).length === 0) {
        html += "<p>No results uploaded yet.</p>";
    } else {
        for(const course in courseData) {
            const data = courseData[course];
            const percentage = ((data.totalObtained / data.totalMarks) * 100).toFixed(2);
            const grade = 
                percentage >= 80 ? "A" :
                percentage >= 70 ? "B" :
                percentage >= 60 ? "C" : 
                percentage >= 50 ? "D" : "F";
            
            html += `
                <div class="course-section">
                    <div class="course-header">
                        <h4>${course}</h4>
                        <div class="course-summary">
                            Total: ${data.totalObtained}/${data.totalMarks} 
                            <span class="percentage">(${percentage}%)</span>
                            <span class="grade-badge grade-${grade}">${grade}</span>
                        </div>
                    </div>
                    <table class="detail-table">
                        <tr>
                            <th>Evaluation</th>
                            <th>Obtained</th>
                            <th>Total</th>
                            <th>Percentage</th>
                        </tr>
            `;
            
            // Sort evaluations alphabetically
            const sortedEvals = Object.keys(data.evaluations).sort();
            
            sortedEvals.forEach(evalName => {
                const evalData = data.evaluations[evalName];
                const evalPercent = ((evalData.obtained / evalData.total) * 100).toFixed(2);
                
                html += `
                    <tr>
                        <td><strong>${evalName}</strong></td>
                        <td>${evalData.obtained}</td>
                        <td>${evalData.total}</td>
                        <td>${evalPercent}%</td>
                    </tr>
                `;
            });
            
            html += `</table></div>`;
        }
    }

    content.innerHTML = html;
}

// Notifications
function renderNotifications(){
    const attendance = getAttendance();
    let html = "<h3>Notifications</h3>";
    let has = false;

    for (const key in attendance) {
        // Only check cumulative attendance records
        if(key.includes("-date-") || key.includes("-eval-")) continue;

        const parts = key.split("-");
        const student = parts[parts.length - 1];
        const course = parts[parts.length - 2];

        if(student === currentUser.name) {
            const att = attendance[key];
            if(att.present !== undefined && att.total !== undefined) {
                const percent = (att.present / att.total * 100).toFixed(2);

                if(percent < 80) {
                    has = true;
                    html += `<p class="notification-warning">⚠️ Low attendance in <b>${course}</b>: ${percent}%</p>`;
                }
            }
        }
    }

    if(!has) {
        html += `<p class="no-notifications">✓ Great! You have good attendance in all courses.</p>`;
    }

    content.innerHTML = html;
}

// Utility function to format date
function formatDate(dateStr) {
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