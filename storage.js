// storage.js

// Users stored as {role: 'admin/teacher/student', name: '', password:'', section:'' (for student)}
const USERS_KEY = "users";
const COURSES_KEY = "courses";
const ATTENDANCE_KEY = "attendance";
const RESULTS_KEY = "results";

// Get users from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

// Save new user
function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get courses
function getCourses() {
    return JSON.parse(localStorage.getItem(COURSES_KEY)) || [];
}

// Save course (update or add)
function saveCourse(course) {
    const courses = getCourses();
    const existingIndex = courses.findIndex(c => c.section === course.section);
    
    if(existingIndex !== -1) {
        // Update existing section
        courses[existingIndex] = course;
    } else {
        // Add new section
        courses.push(course);
    }
    
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

// Attendance
function getAttendance() {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEY)) || {};
}

function saveAttendance(attendanceData) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceData));
}

// Results
function getResults() {
    return JSON.parse(localStorage.getItem(RESULTS_KEY)) || {};
}

function saveResults(resultData) {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(resultData));
}

// ---- ATTENDANCE HISTORY (datewise record) ----
const ATTENDANCE_HISTORY_KEY = "attendanceHistory";

function getAttendanceHistory() {
    return JSON.parse(localStorage.getItem(ATTENDANCE_HISTORY_KEY)) || {};
}

function saveAttendanceHistory(historyData) {
    localStorage.setItem(ATTENDANCE_HISTORY_KEY, JSON.stringify(historyData));
}

// ---- RESULT HISTORY (evaluation-wise record) ----
const RESULT_HISTORY_KEY = "resultHistory";

function getResultHistory() {
    return JSON.parse(localStorage.getItem(RESULT_HISTORY_KEY)) || {};
}

function saveResultHistory(historyData) {
    localStorage.setItem(RESULT_HISTORY_KEY, JSON.stringify(historyData));
}