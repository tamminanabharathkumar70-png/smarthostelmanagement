# 🏠 HostelPulse — Smart Hostel Management System
### *Role-Based Campus Living with Boys/Girls Separation, Daily Attendance, Mess Operations & Directorate Audit*

> **🏆 Built for Hackathon Problem Statement: Smart Hostel Management System**

---

## 🔑 Login Accounts & Credentials Roster

Use these accounts to test every role in the system (or use the 1-click quick login buttons on the login screen):

| Role | Username | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| 👦 **Student (Boy)** | `aarav` | `pass123` | **Boys Hostel side only**: File complaints, view personal attendance, rate mess food, request sick meals |
| 👧 **Student (Girl)** | `ananya` | `pass123` | **Girls Hostel side only**: File complaints, view personal attendance, rate mess food, request sick meals |
| 👨‍💼 **Boys Hostel Warden** | `warden_boys` | `warden123` | **Dr. Rajesh Gupta**: Marks daily Boys attendance (Present/Absent/Leave), assigns technicians to Boys complaints |
| 👩‍💼 **Girls Hostel Warden** | `warden_girls` | `warden123` | **Dr. Priya Nair**: Marks daily Girls attendance (Present/Absent/Leave), assigns technicians to Girls complaints |
| 👨‍🍳 **Mess Contractor** | `mess_owner` | `mess123` | **Chef Vikram Rathore**: Edits daily menu (Breakfast, Lunch, Snacks, Dinner), sets crowd rush gauge, fulfills sick meals |
| 🎓 **Principal / Director** | `principal` | `admin123` | **Prof. V. K. Suryavanshi**: Master Directorate Audit across BOTH hostels, attendance compliance, all complaints & mess ratings |

---

## ⚡ What Was Updated & Enhanced

1. **🔐 Authentication & Role Detection**:
   - Secure login portal with username & password verification.
   - When a student enters their login, the system automatically detects whether they are a **Boy** or a **Girl**, routing them strictly to the **Boys Hostel** or **Girls Hostel** portal!
   - 1-Click quick login buttons for effortless hackathon judging demonstrations.

2. **📅 Daily Attendance System (Marked ONLY by Wardens)**:
   - **Boys Warden**: Exclusively marks daily evening attendance for Boys Hostel residents.
   - **Girls Warden**: Exclusively marks daily evening attendance for Girls Hostel residents.
   - **Interactive Status Toggles**: `✓ Present` (Green), `✕ Absent` (Red), `Leave` (Yellow), plus a `Mark All Present` shortcut.
   - **Students (Read-Only)**: Students can view their personal attendance record, percentage (e.g. 96%), and history, but cannot modify records.
   - **Principal Directorate Audit**: Inspects attendance rates and absentee alerts across both hostels.

3. **🍲 Mess Contractor & Dining Hub (`mess_owner`)**:
   - **Menu Editor**: Chef Vikram can update today's courses (Breakfast, Lunch, Snacks, Dinner) and mark special items.
   - **Crowd Rush Gauge**: Mess owner can toggle the dining hall status (Low Wait, Moderate, Peak Rush).
   - **Student Food Reviews**: Direct visibility into student star ratings and suggestions.
   - **Sick Meal Deliveries**: Process light diet orders for unwell students (Khichdi, Dalia, Boiled Eggs) and mark them delivered.

4. **🎓 Principal Executive Command Center ("Principal Can See Anything")**:
   - Master institutional dashboard with filter toggle:
     `🏢 Whole Campus (Both Hostels)` | `👦 Boys Hostel Only` | `👧 Girls Hostel Only`
   - Real-time institutional KPIs: Total residents (230), complaint resolution rate (%), mess quality score (91%), and active wardens.
   - Master Attendance Audit across all students.
   - Master Maintenance Audit across all rooms.
   - 1-Click Export of the Institutional Directorate Report (CSV).

5. **🚫 Removed Gate Pass**:
   - Gate pass / outpass module has been completely removed as requested.

6. **🏢 Strict Boys vs Girls Hostel Separation**:
   - Only 2 hostels: **Boys Hostel** and **Girls Hostel**.
   - Boys cannot see Girls Hostel issues; Girls cannot see Boys Hostel issues.
   - Separate wardens for each hostel.
   - Principal oversees both.

---

## 🚀 How to Run the Application

### Option A: Local Server (Currently Running)
Open **`http://localhost:8000`** in your browser.

### Option B: 1-Click Windows Launcher
Double-click [`run_system.bat`](run_system.bat).

### Option C: Standalone Browser Mode (No Server Needed)
Double-click [`index.html`](index.html) directly in any web browser.
