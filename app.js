/**
 * Smart Hostel Management System - Core Application Logic
 * Supports:
 * - Student Login (Boy -> Boys Hostel, Girl -> Girls Hostel)
 * - Daily Attendance System (Marked strictly by Wardens; students read-only; principal audits all)
 * - 2 Separate Wardens: Boys Warden & Girls Warden
 * - Mess Owner / Contractor with operational controls
 * - Principal Master Executive Overview ("Principal can see anything")
 * - Completely removed Gate Pass
 */

// Global App State
let state = {
  data: null,
  currentUser: null,
  activeTab: "complaints",
  attendanceDate: new Date().toISOString().slice(0, 10),
  filterCategory: "all",
  filterStatus: "all",
  filterPriority: "all",
  principalHostelFilter: "all",
  searchQuery: "",
  theme: localStorage.getItem("HOSTEL_THEME") || "light"
};

// Web Audio API Sound Effects
const SoundFX = {
  ctx: null,
  init() {
    try {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    } catch (e) {}
  },
  playTone(freq, type, duration, delay = 0) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {}
  },
  click() { this.playTone(600, "sine", 0.05); },
  success() {
    this.playTone(523.25, "sine", 0.12, 0);
    this.playTone(659.25, "sine", 0.12, 0.08);
    this.playTone(783.99, "sine", 0.25, 0.16);
  },
  sos() {
    this.playTone(880, "sawtooth", 0.25, 0);
    this.playTone(440, "sawtooth", 0.25, 0.25);
    this.playTone(880, "sawtooth", 0.25, 0.5);
  }
};

// Application Initialization
document.addEventListener("DOMContentLoaded", () => {
  state.data = Storage.load();
  document.documentElement.setAttribute("data-theme", state.theme);

  // Check login session
  const savedUser = localStorage.getItem("HOSTEL_LOGGED_USER");
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
    } catch (e) {
      state.currentUser = state.data.users[0]; // default to Aarav
    }
  } else {
    state.currentUser = state.data.users[0]; // default to Aarav (Boy Student)
  }

  setupThemeToggle();
  setupFilterAndSearch();
  setupModals();
  setupUrgentBanner();

  renderAppForUser();
});

/* ==========================================================================
   AUTHENTICATION & USER SESSIONS
   ========================================================================== */
function switchLoginTab(tab) {
  SoundFX.click();
  const btnSign = document.getElementById("tabBtnSignIn");
  const btnReg = document.getElementById("tabBtnRegister");
  const btnForgot = document.getElementById("tabBtnForgot");
  const viewSign = document.getElementById("loginSignInView");
  const viewReg = document.getElementById("loginRegisterView");
  const viewForgot = document.getElementById("loginForgotView");

  if (tab === "signin") {
    if (btnSign) btnSign.classList.add("active");
    if (btnReg) btnReg.classList.remove("active");
    if (btnForgot) btnForgot.classList.remove("active");
    if (viewSign) viewSign.style.display = "block";
    if (viewReg) viewReg.style.display = "none";
    if (viewForgot) viewForgot.style.display = "none";
    renderQuickLoginChips();
  } else if (tab === "register") {
    if (btnReg) btnReg.classList.add("active");
    if (btnSign) btnSign.classList.remove("active");
    if (btnForgot) btnForgot.classList.remove("active");
    if (viewReg) viewReg.style.display = "block";
    if (viewSign) viewSign.style.display = "none";
    if (viewForgot) viewForgot.style.display = "none";
  } else if (tab === "forgot") {
    if (btnForgot) btnForgot.classList.add("active");
    if (btnSign) btnSign.classList.remove("active");
    if (btnReg) btnReg.classList.remove("active");
    if (viewForgot) viewForgot.style.display = "block";
    if (viewSign) viewSign.style.display = "none";
    if (viewReg) viewReg.style.display = "none";

    const uInput = document.getElementById("loginUsername") ? document.getElementById("loginUsername").value.trim() : "";
    if (uInput && document.getElementById("inlineForgotUsername")) {
      document.getElementById("inlineForgotUsername").value = uInput;
    }
    updateInlineForgotAccountPreview();

    setTimeout(() => {
      if (uInput && document.getElementById("inlineForgotNewPassword")) {
        document.getElementById("inlineForgotNewPassword").focus();
      } else if (document.getElementById("inlineForgotUsername")) {
        document.getElementById("inlineForgotUsername").focus();
      }
    }, 100);
  }
}

function selectRegistrationGender(gender) {
  SoundFX.click();
  document.getElementById("regGender").value = gender;
  const boyCard = document.getElementById("genderCardBoy");
  const girlCard = document.getElementById("genderCardGirl");
  const roomInput = document.getElementById("regRoom");

  if (gender === "boy") {
    boyCard.classList.add("selected");
    girlCard.classList.remove("selected");
    if (!roomInput.value || roomInput.value.startsWith("G-")) roomInput.value = "B-210";
  } else {
    girlCard.classList.add("selected");
    boyCard.classList.remove("selected");
    if (!roomInput.value || roomInput.value.startsWith("B-")) roomInput.value = "G-105";
  }
}

function handleStudentRegistration(e) {
  e.preventDefault();
  const gender = document.getElementById("regGender").value; // 'boy' or 'girl'
  const name = document.getElementById("regName").value.trim();
  const rollNo = document.getElementById("regRollNo").value.trim().toUpperCase();
  const room = document.getElementById("regRoom").value.trim().toUpperCase();
  const branch = document.getElementById("regBranch").value;
  const year = document.getElementById("regYear").value;
  const phone = document.getElementById("regPhone").value.trim();
  const username = document.getElementById("regUsername").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value.trim();

  // Validate unique username
  const existing = state.data.users.find(u => u.username.toLowerCase() === username);
  if (existing) {
    SoundFX.sos();
    showToast(`Username "${username}" is already taken. Please choose another.`, "error");
    return;
  }

  const hostelKey = gender === "boy" ? "boys" : "girls";
  const defaultAvatar = gender === "boy"
    ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";

  // 1. Create New User Object
  const newUser = {
    username,
    password,
    name,
    gender,
    role: "student",
    hostel: hostelKey,
    room,
    rollNo,
    phone,
    email: `${username}@hostel.edu`,
    avatar: defaultAvatar,
    title: `Resident Student (${gender === 'boy' ? 'Boys Hostel' : 'Girls Hostel'})`
  };

  state.data.users.push(newUser);

  // 2. Add to Hostel Roster for Warden Attendance
  if (!state.data.studentsList[hostelKey]) state.data.studentsList[hostelKey] = [];
  state.data.studentsList[hostelKey].push({
    rollNo,
    name,
    room,
    branch,
    year,
    phone,
    attendancePct: 100
  });

  // 3. Mark Present in Today's Attendance Roll
  const todayKey = `${state.attendanceDate}_${hostelKey}`;
  if (state.data.attendanceRecords[todayKey]) {
    state.data.attendanceRecords[todayKey].records[rollNo] = "present";
  }

  // 4. Save to Persistent Storage
  Storage.save(state.data);

  SoundFX.success();
  showToast(`Registration Successful! Welcome to ${gender === 'boy' ? 'Boys' : 'Girls'} Hostel, Room ${room}!`, "success");

  // Automatically log in the new student
  state.currentUser = newUser;
  localStorage.setItem("HOSTEL_LOGGED_USER", JSON.stringify(newUser));
  document.getElementById("loginView").style.display = "none";
  renderAppForUser();
}

function renderQuickLoginChips() {
  const container = document.getElementById("quickLoginGridContainer");
  if (!container) return;

  // Strict list of the 6 official accounts - never show dynamically registered or recent accounts
  const officialUsernames = ["aarav", "ananya", "warden_boys", "warden_girls", "mess_owner", "principal"];
  const chipsToRender = officialUsernames
    .map(uName => state.data.users.find(u => u.username.toLowerCase() === uName.toLowerCase()))
    .filter(Boolean);

  container.innerHTML = chipsToRender.map(user => {
    let icon = "👤";
    if (user.role === "student") icon = user.gender === "boy" ? "👦" : "👧";
    else if (user.role === "warden_boys") icon = "👨‍💼";
    else if (user.role === "warden_girls") icon = "👩‍💼";
    else if (user.role === "mess_owner") icon = "👨‍🍳";
    else if (user.role === "principal") icon = "🎓";

    return `
      <div class="demo-chip" onclick="quickFillLogin('${user.username}', '${user.password}')">
        <span style="font-size: 1.25rem;">${icon}</span>
        <div>
          <strong>${user.name}</strong>
          <span>${user.title.split('•')[0]}</span>
        </div>
      </div>
    `;
  }).join("");
}

/* ==========================================================================
   PASSWORD RECOVERY & PROFILE MANAGEMENT
   ========================================================================== */

function openForgotPasswordModal() {
  SoundFX.click();
  // 1. Also switch the login card to the inline forgot view
  switchLoginTab('forgot');

  // 2. Open the modal overlay (now floating above everything with z-index 10000)
  const uInput = document.getElementById("loginUsername") ? document.getElementById("loginUsername").value.trim() : "";
  if (document.getElementById("forgotUsername")) document.getElementById("forgotUsername").value = uInput;
  if (document.getElementById("forgotPhone")) document.getElementById("forgotPhone").value = "";
  if (document.getElementById("forgotNewPassword")) document.getElementById("forgotNewPassword").value = "";
  if (document.getElementById("forgotConfirmPassword")) document.getElementById("forgotConfirmPassword").value = "";
  
  updateForgotAccountPreview();
  openModal("forgotPasswordModal");

  // Focus directly into phone if roll number/username is already provided, or into roll number input
  setTimeout(() => {
    if (uInput && document.getElementById("forgotPhone")) {
      document.getElementById("forgotPhone").focus();
    } else if (document.getElementById("forgotUsername")) {
      document.getElementById("forgotUsername").focus();
    }
  }, 100);
}

function updateForgotAccountPreview() {
  const inputUser = document.getElementById("forgotUsername") ? document.getElementById("forgotUsername").value.trim().toLowerCase() : "";
  const inputPhone = document.getElementById("forgotPhone") ? document.getElementById("forgotPhone").value.trim() : "";
  const preview = document.getElementById("forgotAccountPreview");
  if (!preview) return;

  if (!inputUser) {
    preview.style.display = "none";
    return;
  }

  const user = state.data.users.find(u => 
    (u.rollNo && u.rollNo.toLowerCase() === inputUser) ||
    u.username.toLowerCase() === inputUser || 
    u.name.toLowerCase() === inputUser
  );

  if (!user) {
    preview.style.display = "none";
    return;
  }

  const nameEl = document.getElementById("forgotAccountName");
  const detailsEl = document.getElementById("forgotAccountDetails");
  const iconEl = document.getElementById("forgotAccountIcon");
  const badgeEl = document.getElementById("forgotAccountBadge");

  const inDigits = inputPhone.replace(/\D/g, "");
  const userDigits = (user.phone || "").replace(/\D/g, "");
  const isPhoneMatch = inDigits.length > 0 && (
    userDigits === inDigits ||
    userDigits.includes(inDigits) ||
    inDigits.includes(userDigits)
  );

  if (isPhoneMatch) {
    preview.style.background = "#f0fdf4";
    preview.style.borderColor = "#bbf7d0";
    if (iconEl) iconEl.textContent = "✅";
    if (nameEl) {
      nameEl.style.color = "#166534";
      nameEl.textContent = `Student Verified: ${user.name}`;
    }
    if (detailsEl) {
      detailsEl.style.color = "#15803d";
      detailsEl.textContent = `Roll No: ${user.rollNo || user.username} • Phone Matched ✓ • Room: ${user.room || 'General'}`;
    }
    if (badgeEl) {
      badgeEl.style.background = "#dcfce7";
      badgeEl.style.color = "#166534";
      badgeEl.textContent = "Verified Match";
    }
  } else if (!inputPhone) {
    preview.style.background = "#eff6ff";
    preview.style.borderColor = "#bfdbfe";
    if (iconEl) iconEl.textContent = "📱";
    if (nameEl) {
      nameEl.style.color = "#1e40af";
      nameEl.textContent = `Account: ${user.name} (${user.rollNo || user.username})`;
    }
    if (detailsEl) {
      detailsEl.style.color = "#3b82f6";
      detailsEl.textContent = "Enter your registered phone number to verify identity";
    }
    if (badgeEl) {
      badgeEl.style.background = "#dbeafe";
      badgeEl.style.color = "#1e40af";
      badgeEl.textContent = "Enter Phone";
    }
  } else {
    preview.style.background = "#fffbeb";
    preview.style.borderColor = "#fde68a";
    if (iconEl) iconEl.textContent = "⚠️";
    if (nameEl) {
      nameEl.style.color = "#b45309";
      nameEl.textContent = `Account: ${user.name}`;
    }
    if (detailsEl) {
      detailsEl.style.color = "#d97706";
      detailsEl.textContent = "Phone number does not match registered hostel records";
    }
    if (badgeEl) {
      badgeEl.style.background = "#fef3c7";
      badgeEl.style.color = "#b45309";
      badgeEl.textContent = "Mismatch";
    }
  }
  preview.style.display = "flex";
}

function updateInlineForgotAccountPreview() {
  const inputUser = document.getElementById("inlineForgotUsername") ? document.getElementById("inlineForgotUsername").value.trim().toLowerCase() : "";
  const inputPhone = document.getElementById("inlineForgotPhone") ? document.getElementById("inlineForgotPhone").value.trim() : "";
  const preview = document.getElementById("inlineForgotAccountPreview");
  if (!preview) return;

  if (!inputUser) {
    preview.style.display = "none";
    return;
  }

  const user = state.data.users.find(u => 
    (u.rollNo && u.rollNo.toLowerCase() === inputUser) ||
    u.username.toLowerCase() === inputUser || 
    u.name.toLowerCase() === inputUser
  );

  if (!user) {
    preview.style.display = "none";
    return;
  }

  const nameEl = document.getElementById("inlineForgotAccountName");
  const detailsEl = document.getElementById("inlineForgotAccountDetails");
  const iconEl = document.getElementById("inlineForgotAccountIcon");
  const badgeEl = document.getElementById("inlineForgotAccountBadge");

  const inDigits = inputPhone.replace(/\D/g, "");
  const userDigits = (user.phone || "").replace(/\D/g, "");
  const isPhoneMatch = inDigits.length > 0 && (
    userDigits === inDigits ||
    userDigits.includes(inDigits) ||
    inDigits.includes(userDigits)
  );

  if (isPhoneMatch) {
    preview.style.background = "#f0fdf4";
    preview.style.borderColor = "#bbf7d0";
    if (iconEl) iconEl.textContent = "✅";
    if (nameEl) {
      nameEl.style.color = "#166534";
      nameEl.textContent = `Student Verified: ${user.name}`;
    }
    if (detailsEl) {
      detailsEl.style.color = "#15803d";
      detailsEl.textContent = `Roll No: ${user.rollNo || user.username} • Phone Matched ✓ • Room: ${user.room || 'General'}`;
    }
    if (badgeEl) {
      badgeEl.style.background = "#dcfce7";
      badgeEl.style.color = "#166534";
      badgeEl.textContent = "Verified Match";
    }
  } else if (!inputPhone) {
    preview.style.background = "#eff6ff";
    preview.style.borderColor = "#bfdbfe";
    if (iconEl) iconEl.textContent = "📱";
    if (nameEl) {
      nameEl.style.color = "#1e40af";
      nameEl.textContent = `Account: ${user.name} (${user.rollNo || user.username})`;
    }
    if (detailsEl) {
      detailsEl.style.color = "#3b82f6";
      detailsEl.textContent = "Enter your registered phone number to verify identity";
    }
    if (badgeEl) {
      badgeEl.style.background = "#dbeafe";
      badgeEl.style.color = "#1e40af";
      badgeEl.textContent = "Enter Phone";
    }
  } else {
    preview.style.background = "#fffbeb";
    preview.style.borderColor = "#fde68a";
    if (iconEl) iconEl.textContent = "⚠️";
    if (nameEl) {
      nameEl.style.color = "#b45309";
      nameEl.textContent = `Account: ${user.name}`;
    }
    if (detailsEl) {
      detailsEl.style.color = "#d97706";
      detailsEl.textContent = "Phone number does not match registered hostel records";
    }
    if (badgeEl) {
      badgeEl.style.background = "#fef3c7";
      badgeEl.style.color = "#b45309";
      badgeEl.textContent = "Mismatch";
    }
  }
  preview.style.display = "flex";
}

function performPasswordReset(inputUser, inputPhone, newPass, confPass) {
  if (!inputUser) {
    SoundFX.sos();
    showToast("Please enter your Student Roll Number or Username.", "error");
    return;
  }

  if (!inputPhone) {
    SoundFX.sos();
    showToast("Please enter your registered mobile phone number.", "error");
    return;
  }

  const norm = inputUser.toLowerCase();
  const user = state.data.users.find(u => 
    (u.rollNo && u.rollNo.toLowerCase() === norm) ||
    u.username.toLowerCase() === norm || 
    u.name.toLowerCase() === norm
  );

  if (!user) {
    SoundFX.sos();
    showToast(`No registered account found for "${inputUser}". Check spelling.`, "error");
    return;
  }

  // Verify Phone Number Match
  const inDigits = inputPhone.replace(/\D/g, "");
  const userDigits = (user.phone || "").replace(/\D/g, "");
  const isPhoneMatch = inDigits.length > 0 && (
    userDigits === inDigits ||
    userDigits.includes(inDigits) ||
    inDigits.includes(userDigits) ||
    (user.phone && inputPhone.length >= 3 && user.phone.includes(inputPhone))
  );

  if (!isPhoneMatch) {
    SoundFX.sos();
    showToast("Verification failed: Mobile number does not match registered student records.", "error");
    return;
  }

  if (!newPass) {
    SoundFX.sos();
    showToast("Please enter your new password.", "error");
    return;
  }

  if (newPass.length < 3) {
    SoundFX.sos();
    showToast("New password must be at least 3 characters long.", "error");
    return;
  }

  if (newPass !== confPass) {
    SoundFX.sos();
    showToast("Passwords do not match! Please check both fields.", "error");
    return;
  }

  // Update password in user database
  user.password = newPass;

  // Sync hostel warden password if applicable
  if (user.role === "warden_boys") {
    const hb = state.data.hostels.find(h => h.id === "boys");
    if (hb) hb.wardenPassword = newPass;
  } else if (user.role === "warden_girls") {
    const hg = state.data.hostels.find(h => h.id === "girls");
    if (hg) hg.wardenPassword = newPass;
  }

  Storage.save(state.data);
  SoundFX.success();
  showToast(`🎉 Details matched! Password updated for ${user.name}. Logging in...`, "success");
  closeModal("forgotPasswordModal");

  // Pre-fill login input
  if (document.getElementById("loginUsername")) document.getElementById("loginUsername").value = user.username;
  if (document.getElementById("loginPassword")) document.getElementById("loginPassword").value = newPass;

  // Immediately log the user in!
  authenticate(user.username, newPass);
}

function handleResetPassword(e) {
  if (e && e.preventDefault) e.preventDefault();
  const inputUser = document.getElementById("forgotUsername") ? document.getElementById("forgotUsername").value.trim() : "";
  const inputPhone = document.getElementById("forgotPhone") ? document.getElementById("forgotPhone").value.trim() : "";
  const newPass = document.getElementById("forgotNewPassword") ? document.getElementById("forgotNewPassword").value.trim() : "";
  const confPass = document.getElementById("forgotConfirmPassword") ? document.getElementById("forgotConfirmPassword").value.trim() : "";
  performPasswordReset(inputUser, inputPhone, newPass, confPass);
}

function handleInlineResetPassword(e) {
  if (e && e.preventDefault) e.preventDefault();
  const inputUser = document.getElementById("inlineForgotUsername") ? document.getElementById("inlineForgotUsername").value.trim() : "";
  const inputPhone = document.getElementById("inlineForgotPhone") ? document.getElementById("inlineForgotPhone").value.trim() : "";
  const newPass = document.getElementById("inlineForgotNewPassword") ? document.getElementById("inlineForgotNewPassword").value.trim() : "";
  const confPass = document.getElementById("inlineForgotConfirmPassword") ? document.getElementById("inlineForgotConfirmPassword").value.trim() : "";
  performPasswordReset(inputUser, inputPhone, newPass, confPass);
}

function openEditProfileModal() {
  if (!state.currentUser) {
    showToast("Please log in to edit your profile.", "warning");
    return;
  }
  SoundFX.click();
  const u = state.currentUser;
  
  if (document.getElementById("editProfileAvatarPreview")) document.getElementById("editProfileAvatarPreview").src = u.avatar;
  if (document.getElementById("editProfileUserDisplayName")) document.getElementById("editProfileUserDisplayName").textContent = u.name;
  if (document.getElementById("editProfileUserRoleBadge")) {
    document.getElementById("editProfileUserRoleBadge").textContent = `${u.title || u.role} • Room: ${u.room || 'Admin'}`;
  }
  if (document.getElementById("editProfileName")) document.getElementById("editProfileName").value = u.name || "";
  if (document.getElementById("editProfilePhone")) document.getElementById("editProfilePhone").value = u.phone || "";
  if (document.getElementById("editProfileRoom")) document.getElementById("editProfileRoom").value = u.room || "";
  if (document.getElementById("editProfileEmail")) document.getElementById("editProfileEmail").value = u.email || "";
  if (document.getElementById("editProfileNewPassword")) document.getElementById("editProfileNewPassword").value = "";
  if (document.getElementById("editProfileConfirmPassword")) document.getElementById("editProfileConfirmPassword").value = "";

  openModal("editProfileModal");
}

function handleSaveProfileChanges(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!state.currentUser) return;

  const name = document.getElementById("editProfileName").value.trim();
  const phone = document.getElementById("editProfilePhone").value.trim();
  const room = document.getElementById("editProfileRoom").value.trim();
  const email = document.getElementById("editProfileEmail").value.trim();
  const newPass = document.getElementById("editProfileNewPassword").value.trim();
  const confPass = document.getElementById("editProfileConfirmPassword").value.trim();

  if (!name) {
    SoundFX.sos();
    showToast("Full Name cannot be empty.", "error");
    return;
  }

  if (newPass) {
    if (newPass.length < 3) {
      SoundFX.sos();
      showToast("Password must be at least 3 characters long.", "error");
      return;
    }
    if (newPass !== confPass) {
      SoundFX.sos();
      showToast("New passwords do not match!", "error");
      return;
    }
    state.currentUser.password = newPass;
  }

  // Update current user
  state.currentUser.name = name;
  state.currentUser.phone = phone;
  state.currentUser.room = room;
  state.currentUser.email = email;

  // Update in state.data.users
  const dbUser = state.data.users.find(u => u.username === state.currentUser.username);
  if (dbUser) {
    dbUser.name = name;
    dbUser.phone = phone;
    dbUser.room = room;
    dbUser.email = email;
    if (newPass) dbUser.password = newPass;
  }

  // Also sync warden / hostel if applicable
  if (state.currentUser.role === "warden_boys") {
    const hb = state.data.hostels.find(h => h.id === "boys");
    if (hb) {
      hb.wardenName = name;
      hb.wardenPhone = phone;
      if (newPass) hb.wardenPassword = newPass;
    }
  } else if (state.currentUser.role === "warden_girls") {
    const hg = state.data.hostels.find(h => h.id === "girls");
    if (hg) {
      hg.wardenName = name;
      hg.wardenPhone = phone;
      if (newPass) hg.wardenPassword = newPass;
    }
  }

  Storage.save(state.data);
  localStorage.setItem("HOSTEL_LOGGED_USER", JSON.stringify(state.currentUser));

  SoundFX.success();
  showToast("Profile details updated successfully!", "success");
  closeModal("editProfileModal");
  renderAppForUser();
}

function quickFillLogin(username, password) {
  document.getElementById("loginUsername").value = username;
  document.getElementById("loginPassword").value = password;
  authenticate(username, password);
}

function handleManualLogin(e) {
  e.preventDefault();
  const u = document.getElementById("loginUsername").value.trim();
  const p = document.getElementById("loginPassword").value.trim();
  authenticate(u, p);
}

function authenticate(username, password) {
  const norm = username.toLowerCase();
  const user = state.data.users.find(usr => 
    (usr.username.toLowerCase() === norm || (usr.rollNo && usr.rollNo.toLowerCase() === norm)) 
    && usr.password === password
  );
  if (user) {
    state.currentUser = user;
    localStorage.setItem("HOSTEL_LOGGED_USER", JSON.stringify(user));
    document.getElementById("loginView").style.display = "none";
    SoundFX.success();
    showToast(`Welcome, ${user.name}! Logged in to ${user.title}`, "success");
    renderAppForUser();
  } else {
    SoundFX.sos();
    showToast("Invalid username/roll number or password. Please verify your credentials.", "error");
  }
}

function handleLogout() {
  SoundFX.click();
  state.currentUser = null;
  localStorage.removeItem("HOSTEL_LOGGED_USER");
  document.getElementById("loginView").style.display = "flex";
  switchLoginTab("signin");
  showToast("Logged out successfully.", "info");
}

/* ==========================================================================
   ROLE-BASED VIEW CONFIGURATION & NAVIGATION
   ========================================================================== */
function renderAppForUser() {
  if (!state.currentUser) {
    document.getElementById("loginView").style.display = "flex";
    return;
  }
  document.getElementById("loginView").style.display = "none";

  const user = state.currentUser;

  // Update Header User Profile
  const avatar = document.getElementById("sessionAvatar");
  const name = document.getElementById("sessionName");
  const roleBadge = document.getElementById("sessionRoleBadge");
  const hostelBadge = document.getElementById("sessionHostelBadge");
  const subtitle = document.getElementById("portalHostelSubtitle");

  if (avatar) avatar.src = user.avatar;
  if (name) name.textContent = user.name;
  if (roleBadge) {
    const roleLabels = {
      student: user.gender === "boy" ? "Student (Boy)" : "Student (Girl)",
      warden_boys: "Boys Warden",
      warden_girls: "Girls Warden",
      mess_owner: "Mess Contractor",
      principal: "Principal / Director"
    };
    roleBadge.textContent = roleLabels[user.role] || user.role;
  }

  if (hostelBadge) {
    if (user.hostel === "boys") {
      hostelBadge.textContent = "Boys Hostel";
      hostelBadge.className = "hostel-indicator-badge boys";
      if (subtitle) subtitle.textContent = "Boys Hostel Living & Maintenance Portal";
    } else if (user.hostel === "girls") {
      hostelBadge.textContent = "Girls Hostel";
      hostelBadge.className = "hostel-indicator-badge girls";
      if (subtitle) subtitle.textContent = "Girls Hostel Living & Maintenance Portal";
    } else {
      hostelBadge.textContent = "Campus Admin";
      hostelBadge.className = "hostel-indicator-badge campus";
      if (subtitle) subtitle.textContent = "Institutional Campus Directorate";
    }
  }

  // Build Dynamic Navigation Tabs
  buildNavigationTabs();

  // Adjust button visibility
  const btnNewComp = document.getElementById("btnOpenNewComplaint");
  if (btnNewComp) {
    btnNewComp.style.display = (user.role === "student") ? "inline-flex" : "none";
  }

  const btnPostNotice = document.getElementById("btnOpenPostNotice");
  if (btnPostNotice) {
    btnPostNotice.style.display = (user.role !== "student") ? "inline-flex" : "none";
  }

  const btnSickMeal = document.getElementById("btnOpenSickMeal");
  if (btnSickMeal) {
    btnSickMeal.style.display = (user.role === "student") ? "inline-flex" : "none";
  }

  const btnMessEditor = document.getElementById("btnOpenMessMenuEditor");
  if (btnMessEditor) {
    btnMessEditor.style.display = (user.role === "mess_owner") ? "inline-flex" : "none";
  }

  const principalHostelFilter = document.getElementById("filterPrincipalHostel");
  if (principalHostelFilter) {
    principalHostelFilter.style.display = (user.role === "principal") ? "inline-block" : "none";
  }

  // Default active tab based on role
  if (user.role === "principal") {
    switchTab("principal");
  } else if (user.role.startsWith("warden")) {
    switchTab("attendance");
  } else if (user.role === "mess_owner") {
    switchTab("mess");
  } else {
    switchTab("complaints");
  }

  renderAllViews();
}

function buildNavigationTabs() {
  const navContainer = document.getElementById("navContainer");
  if (!navContainer) return;

  const role = state.currentUser.role;
  let tabsHtml = "";

  if (role === "student") {
    const isBoy = state.currentUser.gender === "boy";
    tabsHtml = `
      <button class="nav-tab active" data-tab="complaints">
        <span>🛠️</span>
        <span>${isBoy ? "Boys" : "Girls"} Maintenance</span>
        <span id="badgeComplaintsCount" class="nav-tab-badge">0</span>
      </button>
      <button class="nav-tab" data-tab="attendance">
        <span>📅</span>
        <span>My Attendance</span>
      </button>
      <button class="nav-tab" data-tab="mess">
        <span>🍲</span>
        <span>Mess & Dining</span>
      </button>
      <button class="nav-tab" data-tab="notices">
        <span>📢</span>
        <span>Notice Board</span>
      </button>
      <button class="nav-tab" data-tab="emergency">
        <span>🚨</span>
        <span>Emergency SOS</span>
      </button>
      <button class="nav-tab" data-tab="lostfound">
        <span>🔍</span>
        <span>Lost & Found</span>
      </button>
    `;
  } else if (role === "warden_boys") {
    tabsHtml = `
      <button class="nav-tab active" data-tab="attendance">
        <span>📅</span>
        <span>Boys Daily Attendance</span>
      </button>
      <button class="nav-tab" data-tab="complaints">
        <span>🛠️</span>
        <span>Boys Complaints</span>
        <span id="badgeComplaintsCount" class="nav-tab-badge">0</span>
      </button>
      <button class="nav-tab" data-tab="roster">
        <span>👥</span>
        <span>Boys Hostel Roster</span>
      </button>
      <button class="nav-tab" data-tab="notices">
        <span>📢</span>
        <span>Notices</span>
      </button>
      <button class="nav-tab" data-tab="emergency">
        <span>🚨</span>
        <span>Emergency Hub</span>
      </button>
      <button class="nav-tab" data-tab="lostfound">
        <span>🔍</span>
        <span>Lost & Found</span>
      </button>
    `;
  } else if (role === "warden_girls") {
    tabsHtml = `
      <button class="nav-tab active" data-tab="attendance">
        <span>📅</span>
        <span>Girls Daily Attendance</span>
      </button>
      <button class="nav-tab" data-tab="complaints">
        <span>🛠️</span>
        <span>Girls Complaints</span>
        <span id="badgeComplaintsCount" class="nav-tab-badge">0</span>
      </button>
      <button class="nav-tab" data-tab="roster">
        <span>👥</span>
        <span>Girls Hostel Roster</span>
      </button>
      <button class="nav-tab" data-tab="notices">
        <span>📢</span>
        <span>Notices</span>
      </button>
      <button class="nav-tab" data-tab="emergency">
        <span>🚨</span>
        <span>Emergency Hub</span>
      </button>
      <button class="nav-tab" data-tab="lostfound">
        <span>🔍</span>
        <span>Lost & Found</span>
      </button>
    `;
  } else if (role === "mess_owner") {
    tabsHtml = `
      <button class="nav-tab active" data-tab="mess">
        <span>🍲</span>
        <span>Mess Operations & Menu</span>
      </button>
      <button class="nav-tab" data-tab="complaints">
        <span>🍽️</span>
        <span>Food Complaints</span>
      </button>
      <button class="nav-tab" data-tab="notices">
        <span>📢</span>
        <span>Dining Notices</span>
      </button>
      <button class="nav-tab" data-tab="emergency">
        <span>🚨</span>
        <span>Emergency Hub</span>
      </button>
    `;
  } else if (role === "principal") {
    tabsHtml = `
      <button class="nav-tab active" data-tab="principal">
        <span>🎓</span>
        <span>Principal Master Command</span>
      </button>
      <button class="nav-tab" data-tab="attendance">
        <span>📅</span>
        <span>Attendance Audit</span>
      </button>
      <button class="nav-tab" data-tab="complaints">
        <span>🛠️</span>
        <span>All Hostel Complaints</span>
      </button>
      <button class="nav-tab" data-tab="mess">
        <span>🍲</span>
        <span>Mess & Hygiene Audit</span>
      </button>
      <button class="nav-tab" data-tab="notices">
        <span>📢</span>
        <span>Campus Broadcasts</span>
      </button>
      <button class="nav-tab" data-tab="emergency">
        <span>🚨</span>
        <span>Emergency Safety Hub</span>
      </button>
    `;
  }

  navContainer.innerHTML = tabsHtml;

  // Bind tab switching clicks
  navContainer.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      SoundFX.click();
      switchTab(tab.getAttribute("data-tab"));
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll(".nav-tab").forEach(t => {
    t.classList.toggle("active", t.getAttribute("data-tab") === tabId);
  });

  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.toggle("active", content.id === `tab-${tabId}`);
  });

  if (tabId === "attendance") {
    renderAttendanceView();
  } else if (tabId === "principal") {
    renderPrincipalView();
  } else if (tabId === "roster") {
    renderWardenRosterView();
  } else if (tabId === "mess") {
    renderMessView();
  } else if (tabId === "complaints") {
    renderComplaintsView();
  }
}

function renderAllViews() {
  renderComplaintsView();
  renderAttendanceView();
  renderMessView();
  renderAnnouncementsView();
  renderEmergencyView();
  renderLostAndFoundView();
  if (state.currentUser.role === "principal") renderPrincipalView();
  if (state.currentUser.role.startsWith("warden")) renderWardenRosterView();
}

/* ==========================================================================
   DAILY ATTENDANCE SYSTEM (ONLY MARKED BY WARDENS)
   ========================================================================== */
function renderAttendanceView() {
  const container = document.getElementById("attendanceTabContent");
  if (!container) return;

  const user = state.currentUser;

  // 1. IF WARDEN (Boys Warden or Girls Warden): Show the Attendance Marking Sheet
  if (user.role === "warden_boys" || user.role === "warden_girls") {
    const isBoysWarden = user.role === "warden_boys";
    const hostelKey = isBoysWarden ? "boys" : "girls";
    const hostelTitle = isBoysWarden ? "Boys Hostel (Dr. Rajesh Gupta)" : "Girls Hostel (Dr. Priya Nair)";
    const students = state.data.studentsList[hostelKey] || [];

    const dateKey = `${state.attendanceDate}_${hostelKey}`;
    let recordObj = state.data.attendanceRecords[dateKey];
    if (!recordObj) {
      recordObj = {
        date: state.attendanceDate,
        hostel: hostelKey,
        markedBy: user.name,
        markedAt: null,
        records: {}
      };
      students.forEach(s => { recordObj.records[s.rollNo] = "present"; });
      state.data.attendanceRecords[dateKey] = recordObj;
    }

    const presentCount = Object.values(recordObj.records).filter(v => v === "present").length;
    const absentCount = Object.values(recordObj.records).filter(v => v === "absent").length;
    const leaveCount = Object.values(recordObj.records).filter(v => v === "leave").length;
    const totalCount = students.length;
    const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    container.innerHTML = `
      <div class="attendance-marker-card">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 18px; margin-bottom: 18px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="hostel-indicator-badge ${hostelKey}">${isBoysWarden ? 'Boys Hostel' : 'Girls Hostel'}</span>
              <h2 style="font-size: 1.4rem; font-weight: 800;">Daily Attendance Register</h2>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
              Warden: <strong>${user.name}</strong> • Record evening biometric / roll-call attendance.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-size: 0.85rem; font-weight: 600;">Date:</label>
            <input type="date" value="${state.attendanceDate}" class="form-control" style="width: auto; padding: 6px 12px;" onchange="changeAttendanceDate(this.value)" />
            <button class="btn btn-secondary btn-sm" onclick="markAllAttendance('present')">✓ Mark All Present</button>
            <button class="btn btn-primary btn-sm" onclick="saveAttendanceRoll()">💾 Save Roll</button>
          </div>
        </div>

        <!-- Attendance Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✓</div>
            <div class="stat-info">
              <div class="stat-value">${presentCount} / ${totalCount}</div>
              <div class="stat-label">Present Tonight</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">✕</div>
            <div class="stat-info">
              <div class="stat-value" style="color: #ef4444;">${absentCount}</div>
              <div class="stat-label">Absent / Unaccounted</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">🏖️</div>
            <div class="stat-info">
              <div class="stat-value">${leaveCount}</div>
              <div class="stat-label">On Approved Leave</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(79, 70, 229, 0.15); color: var(--primary);">📊</div>
            <div class="stat-info">
              <div class="stat-value">${pct}%</div>
              <div class="stat-label">Attendance Rate</div>
            </div>
          </div>
        </div>

        <!-- Attendance Student Roll Table -->
        <table class="attendance-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Room</th>
              <th>Branch & Year</th>
              <th>Overall %</th>
              <th style="text-align: right;">Mark Status (Warden Only)</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(s => {
              const currentStatus = recordObj.records[s.rollNo] || "present";
              return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700;">${s.rollNo}</td>
                  <td><strong>${s.name}</strong></td>
                  <td><span class="status-badge" style="background: var(--bg-subtle); color: var(--text-main);">${s.room}</span></td>
                  <td style="color: var(--text-muted); font-size: 0.82rem;">${s.branch} • ${s.year}</td>
                  <td><strong>${s.attendancePct}%</strong></td>
                  <td style="text-align: right;">
                    <div class="att-btn-group">
                      <button class="att-toggle-btn present ${currentStatus === 'present' ? 'active' : ''}" onclick="setAttendanceStatus('${s.rollNo}', 'present')">
                        ✓ Present
                      </button>
                      <button class="att-toggle-btn absent ${currentStatus === 'absent' ? 'active' : ''}" onclick="setAttendanceStatus('${s.rollNo}', 'absent')">
                        ✕ Absent
                      </button>
                      <button class="att-toggle-btn leave ${currentStatus === 'leave' ? 'active' : ''}" onclick="setAttendanceStatus('${s.rollNo}', 'leave')">
                        Leave
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  // 2. IF STUDENT: Show Personal Attendance Records (Read-Only)
  if (user.role === "student") {
    const isBoy = user.gender === "boy";
    const hostelKey = isBoy ? "boys" : "girls";
    const student = (state.data.studentsList[hostelKey] || []).find(s => s.rollNo === user.rollNo) || { attendancePct: 96 };

    // Get today's record
    const todayKey = `${state.attendanceDate}_${hostelKey}`;
    const todayRec = state.data.attendanceRecords[todayKey];
    const myTodayStatus = todayRec && todayRec.records[user.rollNo] ? todayRec.records[user.rollNo] : "present";

    container.innerHTML = `
      <div class="student-attendance-hero">
        <div>
          <span class="hostel-indicator-badge ${hostelKey}">${isBoy ? 'Boys Hostel' : 'Girls Hostel'}</span>
          <h2 style="font-size: 1.6rem; font-weight: 800; margin-top: 8px;">My Attendance Profile</h2>
          <p style="color: #c7d2fe; font-size: 0.9rem; margin-top: 4px;">
            Roll No: <strong>${user.rollNo}</strong> • Room: <strong>${user.room}</strong>
          </p>
          <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.85rem;">
            <span>Today's Status:</span>
            <strong style="text-transform: uppercase; color: ${myTodayStatus === 'present' ? '#10b981' : '#f59e0b'};">
              ● ${myTodayStatus}
            </strong>
          </div>
        </div>

        <div style="text-align: center;">
          <div class="attendance-gauge-circle">
            ${student.attendancePct}%
          </div>
          <span style="font-size: 0.78rem; color: #c7d2fe; display: block; margin-top: 6px;">Minimum Required: 75%</span>
        </div>
      </div>

      <div class="attendance-marker-card">
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 12px;">Recent Attendance History</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
          🔒 Attendance is recorded strictly by your Hostel Warden each evening during roll call. Students cannot edit attendance records.
        </p>

        <table class="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Hostel Shift</th>
              <th>Recorded By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>October 2, 2026 (Today)</strong></td>
              <td>Evening Roll Call (08:30 PM)</td>
              <td>${isBoy ? 'Dr. Rajesh Gupta (Boys Warden)' : 'Dr. Priya Nair (Girls Warden)'}</td>
              <td><span class="status-badge resolved">✓ Present</span></td>
            </tr>
            <tr>
              <td><strong>October 1, 2026 (Yesterday)</strong></td>
              <td>Evening Roll Call (08:30 PM)</td>
              <td>${isBoy ? 'Dr. Rajesh Gupta (Boys Warden)' : 'Dr. Priya Nair (Girls Warden)'}</td>
              <td><span class="status-badge resolved">✓ Present</span></td>
            </tr>
            <tr>
              <td><strong>September 30, 2026</strong></td>
              <td>Evening Roll Call (08:30 PM)</td>
              <td>${isBoy ? 'Dr. Rajesh Gupta (Boys Warden)' : 'Dr. Priya Nair (Girls Warden)'}</td>
              <td><span class="status-badge resolved">✓ Present</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  // 3. IF PRINCIPAL: Show Cross-Hostel Attendance Master Audit
  if (user.role === "principal") {
    const boysKey = `${state.attendanceDate}_boys`;
    const girlsKey = `${state.attendanceDate}_girls`;
    const boysRec = state.data.attendanceRecords[boysKey];
    const girlsRec = state.data.attendanceRecords[girlsKey];

    const boysPresent = boysRec ? Object.values(boysRec.records).filter(v => v === "present").length : 6;
    const boysTotal = 6;
    const boysPct = Math.round((boysPresent / boysTotal) * 100);

    const girlsPresent = girlsRec ? Object.values(girlsRec.records).filter(v => v === "present").length : 6;
    const girlsTotal = 6;
    const girlsPct = Math.round((girlsPresent / girlsTotal) * 100);

    container.innerHTML = `
      <div class="section-header">
        <div class="section-title-wrap">
          <h2><span>📅</span> Master Attendance Directorate Audit</h2>
          <p>Supervise resident presence, warden log times, and absentee alerts across Boys & Girls hostels.</p>
        </div>
        <div class="header-action-group">
          <input type="date" value="${state.attendanceDate}" class="form-control" style="width: auto; padding: 6px 12px;" onchange="changeAttendanceDate(this.value)" />
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(37, 99, 235, 0.15); color: #2563eb;">👦</div>
          <div class="stat-info">
            <div class="stat-value">${boysPct}%</div>
            <div class="stat-label">Boys Hostel Attendance (${boysPresent}/${boysTotal})</div>
            <div class="stat-trend trend-up">Warden: Dr. Rajesh Gupta</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(219, 39, 119, 0.15); color: #db2777;">👧</div>
          <div class="stat-info">
            <div class="stat-value">${girlsPct}%</div>
            <div class="stat-label">Girls Hostel Attendance (${girlsPresent}/${girlsTotal})</div>
            <div class="stat-trend trend-up">Warden: Dr. Priya Nair</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🏛️</div>
          <div class="stat-info">
            <div class="stat-value">${Math.round((boysPct + girlsPct) / 2)}%</div>
            <div class="stat-label">Overall Campus Resident Presence</div>
            <div class="stat-trend trend-up">SLA Target > 90%</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="attendance-marker-card">
          <h4 style="color: #2563eb; margin-bottom: 12px; font-weight: 700;">👦 Boys Hostel Roster Roll</h4>
          <table class="attendance-table" style="font-size: 0.8rem;">
            <thead>
              <tr><th>Roll</th><th>Student</th><th>Room</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${state.data.studentsList.boys.map(s => {
                const stat = boysRec && boysRec.records[s.rollNo] ? boysRec.records[s.rollNo] : 'present';
                return `
                  <tr>
                    <td>${s.rollNo}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.room}</td>
                    <td><span class="status-badge ${stat === 'present' ? 'resolved' : 'critical'}">${stat}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        <div class="attendance-marker-card">
          <h4 style="color: #db2777; margin-bottom: 12px; font-weight: 700;">👧 Girls Hostel Roster Roll</h4>
          <table class="attendance-table" style="font-size: 0.8rem;">
            <thead>
              <tr><th>Roll</th><th>Student</th><th>Room</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${state.data.studentsList.girls.map(s => {
                const stat = girlsRec && girlsRec.records[s.rollNo] ? girlsRec.records[s.rollNo] : 'present';
                return `
                  <tr>
                    <td>${s.rollNo}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.room}</td>
                    <td><span class="status-badge ${stat === 'present' ? 'resolved' : 'critical'}">${stat}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

function changeAttendanceDate(newDate) {
  state.attendanceDate = newDate;
  renderAttendanceView();
}

function setAttendanceStatus(rollNo, status) {
  const isBoysWarden = state.currentUser.role === "warden_boys";
  const hostelKey = isBoysWarden ? "boys" : "girls";
  const dateKey = `${state.attendanceDate}_${hostelKey}`;

  if (state.data.attendanceRecords[dateKey]) {
    state.data.attendanceRecords[dateKey].records[rollNo] = status;
    renderAttendanceView();
  }
}

function markAllAttendance(status) {
  const isBoysWarden = state.currentUser.role === "warden_boys";
  const hostelKey = isBoysWarden ? "boys" : "girls";
  const dateKey = `${state.attendanceDate}_${hostelKey}`;
  const students = state.data.studentsList[hostelKey] || [];

  if (state.data.attendanceRecords[dateKey]) {
    students.forEach(s => {
      state.data.attendanceRecords[dateKey].records[s.rollNo] = status;
    });
    SoundFX.click();
    showToast(`Marked all ${students.length} students as ${status}!`, "info");
    renderAttendanceView();
  }
}

function saveAttendanceRoll() {
  Storage.save(state.data);
  SoundFX.success();
  showToast(`Daily attendance roll for ${state.attendanceDate} saved successfully!`, "success");
}

/* ==========================================================================
   MAINTENANCE & COMPLAINTS (Separated by Boys and Girls Hostels)
   ========================================================================== */
function setupFilterAndSearch() {
  const searchInput = document.getElementById("complaintSearch");
  const catFilter = document.getElementById("filterCategory");
  const statFilter = document.getElementById("filterStatus");
  const prioFilter = document.getElementById("filterPriority");
  const princFilter = document.getElementById("filterPrincipalHostel");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderComplaintsView();
    });
  }

  if (catFilter) catFilter.addEventListener("change", (e) => { state.filterCategory = e.target.value; renderComplaintsView(); });
  if (statFilter) statFilter.addEventListener("change", (e) => { state.filterStatus = e.target.value; renderComplaintsView(); });
  if (prioFilter) prioFilter.addEventListener("change", (e) => { state.filterPriority = e.target.value; renderComplaintsView(); });
  if (princFilter) princFilter.addEventListener("change", (e) => { state.principalHostelFilter = e.target.value; renderComplaintsView(); });
}

function renderComplaintsView() {
  const container = document.getElementById("complaintsContainer");
  const statsContainer = document.getElementById("complaintsStatsContainer");
  if (!container) return;

  const user = state.currentUser;
  let list = state.data.complaints;

  // Hostel Filter:
  // - Boy student / Boys warden -> ONLY Boys Hostel complaints
  // - Girl student / Girls warden -> ONLY Girls Hostel complaints
  // - Mess owner -> Mess complaints + common
  // - Principal -> Can see all, or filter by Boys or Girls!
  if (user.role === "student") {
    list = list.filter(c => c.hostel === user.hostel);
  } else if (user.role === "warden_boys") {
    list = list.filter(c => c.hostel === "boys");
  } else if (user.role === "warden_girls") {
    list = list.filter(c => c.hostel === "girls");
  } else if (user.role === "mess_owner") {
    list = list.filter(c => c.category === "mess");
  } else if (user.role === "principal") {
    if (state.principalHostelFilter !== "all") {
      list = list.filter(c => c.hostel === state.principalHostelFilter);
    }
  }

  // Secondary Filters
  if (state.filterCategory !== "all") list = list.filter(c => c.category === state.filterCategory);
  if (state.filterStatus !== "all") list = list.filter(c => c.status === state.filterStatus);
  if (state.filterPriority !== "all") list = list.filter(c => c.priority === state.filterPriority);
  if (state.searchQuery) {
    list = list.filter(c => 
      c.title.toLowerCase().includes(state.searchQuery) ||
      c.description.toLowerCase().includes(state.searchQuery) ||
      c.room.toLowerCase().includes(state.searchQuery) ||
      c.id.toLowerCase().includes(state.searchQuery)
    );
  }

  // Update Stats Cards
  if (statsContainer) {
    const total = list.length;
    const openCount = list.filter(c => c.status === "open").length;
    const progressCount = list.filter(c => c.status === "in-progress").length;
    const resolvedCount = list.filter(c => c.status === "resolved").length;
    const criticalCount = list.filter(c => c.priority === "critical" && c.status !== "resolved").length;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">⏳</div>
        <div class="stat-info">
          <div class="stat-value">${openCount}</div>
          <div class="stat-label">Pending / Open</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">🛠️</div>
        <div class="stat-info">
          <div class="stat-value">${progressCount}</div>
          <div class="stat-label">Work In Progress</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✅</div>
        <div class="stat-info">
          <div class="stat-value">${resolvedCount}</div>
          <div class="stat-label">Resolved Issues</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">🚨</div>
        <div class="stat-info">
          <div class="stat-value">${criticalCount}</div>
          <div class="stat-label">Critical SLA Issues</div>
        </div>
      </div>
    `;
  }

  // Render Complaints Cards
  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-strong);">
        <span style="font-size: 3rem;">🔍</span>
        <h3 style="margin-top: 12px; font-weight: 700;">No complaints match your criteria</h3>
        <p style="color: var(--text-muted); margin-top: 6px;">Try adjusting filters or searching a different term.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(ticket => {
    const cat = state.data.categories.find(c => c.id === ticket.category) || { name: ticket.category, icon: "📌", color: "#64748b" };
    const isWarden = user.role.startsWith("warden") || user.role === "principal";

    return `
      <div class="complaint-card">
        <div>
          <div class="complaint-card-header">
            <span class="category-pill" style="background: ${cat.color}1a; color: ${cat.color};">
              <span>${cat.icon}</span> ${cat.name}
            </span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span class="hostel-indicator-badge ${ticket.hostel}">${ticket.hostel === 'boys' ? 'Boys' : 'Girls'}</span>
              <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
              <span class="status-badge ${ticket.status}">● ${ticket.status}</span>
            </div>
          </div>

          <h3 class="complaint-title" onclick="openTicketDetailModal('${ticket.id}')" style="cursor: pointer;">
            ${ticket.title}
          </h3>

          <p class="complaint-desc">${ticket.description}</p>

          <div class="complaint-meta">
            <div class="meta-row">
              <span>📍 Room <strong>${ticket.room}</strong></span>
              <span>🆔 ${ticket.id}</span>
            </div>
            <div class="meta-row">
              <span>👤 ${ticket.studentName}</span>
              <span>🔧 ${ticket.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
          <button class="upvote-btn" onclick="toggleUpvoteTicket('${ticket.id}')">
            ▲ Me Too (${ticket.upvotes})
          </button>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="openTicketDetailModal('${ticket.id}')">View</button>
            ${isWarden ? `<button class="btn btn-primary btn-sm" onclick="openQuickActionModal('${ticket.id}')">Manage</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");

  const badgeComp = document.getElementById("badgeComplaintsCount");
  if (badgeComp) badgeComp.textContent = list.filter(c => c.status !== "resolved").length;
}

function toggleUpvoteTicket(ticketId) {
  SoundFX.click();
  const ticket = state.data.complaints.find(c => c.id === ticketId);
  if (ticket) {
    ticket.upvotes++;
    Storage.save(state.data);
    showToast(`Upvoted #${ticket.id}!`, "success");
    renderComplaintsView();
  }
}

function handleNewComplaintSubmit(e) {
  e.preventDefault();
  const user = state.currentUser;
  const title = document.getElementById("newComplaintTitle").value.trim();
  const category = document.getElementById("newComplaintCategory").value;
  const priority = document.getElementById("newComplaintPriority").value;
  const room = document.getElementById("newComplaintRoom").value.trim();
  const slot = document.getElementById("newComplaintSlot").value;
  const description = document.getElementById("newComplaintDesc").value.trim();

  const newTicket = {
    id: `TKT-${user.hostel === 'boys' ? 'B' : 'G'}-${Math.floor(100 + Math.random() * 900)}`,
    title,
    category,
    hostel: user.hostel,
    room,
    studentName: user.name,
    studentRoll: user.rollNo,
    studentPhone: user.phone,
    priority,
    status: "open",
    description,
    createdAt: new Date().toISOString(),
    slaHours: priority === "critical" ? 6 : (priority === "high" ? 12 : 24),
    preferredSlot: slot,
    assignedTo: "Unassigned",
    technicianNotes: "",
    upvotes: 1,
    timeline: [
      { status: "Reported", time: new Date().toISOString(), note: `Logged by ${user.name} in ${user.hostel === 'boys' ? 'Boys' : 'Girls'} Hostel.` }
    ],
    rating: null,
    feedback: null
  };

  state.data.complaints.unshift(newTicket);
  Storage.save(state.data);

  SoundFX.success();
  showToast(`Complaint registered! Ticket ID: #${newTicket.id}`, "success");
  closeModal("newComplaintModal");
  e.target.reset();
  renderComplaintsView();
}

function openTicketDetailModal(ticketId) {
  SoundFX.click();
  const ticket = state.data.complaints.find(c => c.id === ticketId);
  if (!ticket) return;

  const modal = document.getElementById("ticketDetailModal");
  const content = document.getElementById("ticketDetailModalContent");

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
      <div>
        <span class="hostel-indicator-badge ${ticket.hostel}">${ticket.hostel === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}</span>
        <h3 style="font-size: 1.3rem; font-weight: 800; margin-top: 6px;">${ticket.title}</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted);">Filed by: <strong>${ticket.studentName}</strong> (${ticket.studentRoll})</p>
      </div>
      <span class="status-badge ${ticket.status}">● ${ticket.status}</span>
    </div>

    <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 18px;">
      <strong>Problem Description:</strong>
      <p style="margin-top: 4px; color: var(--text-muted);">${ticket.description}</p>
      <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
        <div>📍 <strong>Room:</strong> ${ticket.room}</div>
        <div>🔧 <strong>Technician:</strong> ${ticket.assignedTo || 'Unassigned'}</div>
      </div>
    </div>

    <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">Tracking Timeline</h4>
    <div style="padding-left: 10px; border-left: 2px solid var(--primary); margin-left: 6px;">
      ${ticket.timeline.map(t => `
        <div style="margin-bottom: 12px; font-size: 0.85rem;">
          <strong>${t.status}</strong> — <span style="color: var(--text-muted); font-size: 0.75rem;">${new Date(t.time).toLocaleTimeString()}</span>
          <p style="color: var(--text-muted); font-size: 0.8rem;">${t.note}</p>
        </div>
      `).join("")}
    </div>

    <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
      ${(state.currentUser.role.startsWith("warden") || state.currentUser.role === "principal") ? `
        <button class="btn btn-primary btn-sm" onclick="openQuickActionModal('${ticket.id}')">Manage Ticket</button>
      ` : ''}
      <button class="btn btn-secondary btn-sm" onclick="closeModal('ticketDetailModal')">Close</button>
    </div>
  `;

  modal.classList.add("active");
}

function openQuickActionModal(ticketId) {
  closeModal("ticketDetailModal");
  const ticket = state.data.complaints.find(c => c.id === ticketId);
  if (!ticket) return;

  const modal = document.getElementById("manageTicketModal");
  document.getElementById("manageTicketIdDisplay").textContent = `#${ticket.id} — ${ticket.title}`;
  document.getElementById("manageTicketIdInput").value = ticket.id;
  document.getElementById("manageTicketStatus").value = ticket.status;
  document.getElementById("manageTicketNotes").value = ticket.technicianNotes || "";

  const staffSelect = document.getElementById("manageTicketAssigned");
  if (staffSelect) {
    staffSelect.innerHTML = `
      <option value="Unassigned">-- Select Technician --</option>
      ${state.data.staff.map(s => `
        <option value="${s.name} (${s.trade})" ${ticket.assignedTo && ticket.assignedTo.includes(s.name) ? 'selected' : ''}>
          ${s.name} (${s.trade})
        </option>
      `).join("")}
    `;
  }

  modal.classList.add("active");
}

function handleManageTicketSubmit(e) {
  e.preventDefault();
  const ticketId = document.getElementById("manageTicketIdInput").value;
  const status = document.getElementById("manageTicketStatus").value;
  const assigned = document.getElementById("manageTicketAssigned").value;
  const notes = document.getElementById("manageTicketNotes").value.trim();

  const ticket = state.data.complaints.find(c => c.id === ticketId);
  if (ticket) {
    ticket.status = status;
    ticket.assignedTo = assigned;
    ticket.technicianNotes = notes;
    ticket.timeline.push({
      status: `Updated to ${status}`,
      time: new Date().toISOString(),
      note: notes || `Action logged by ${state.currentUser.name}`
    });

    Storage.save(state.data);
    SoundFX.success();
    showToast(`Ticket #${ticket.id} updated!`, "success");
    closeModal("manageTicketModal");
    renderComplaintsView();
  }
}

/* ==========================================================================
   MESS & DINING OPERATIONS (Managed by Chef Vikram Rathore - Mess Owner)
   ========================================================================== */
let activeMessScheduleDay = "Thursday";

function renderMessView() {
  const mess = state.data.messMenu;
  const banner = document.getElementById("messStatusBanner");
  const coursesContainer = document.getElementById("messCoursesList");
  const sickContainer = document.getElementById("sickMealsList");
  if (!coursesContainer) return;

  const isMessOwner = state.currentUser.role === "mess_owner";
  const isPrincipal = state.currentUser.role === "principal";
  const canEditMenu = isMessOwner || isPrincipal;

  if (banner) {
    banner.innerHTML = `
      <div>
        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Dining Hall Command • Managed by ${mess.contractorName}</div>
        <h3 style="font-size: 1.35rem; font-weight: 800; margin-top: 2px;">
          Central Mess • ${mess.rushStatus} (${mess.rushLevel}% Occupancy)
        </h3>
        <p style="font-size: 0.85rem; opacity: 0.9; margin-top: 4px;">
          Overall Food Quality Score: <strong>${mess.satisfactionScore}%</strong> (${mess.totalRatingsToday} student ratings) • Certification: <strong>${mess.hygieneGrade}</strong>
        </p>
      </div>

      ${canEditMenu ? `
        <div style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: var(--radius-md); flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.8rem; font-weight: 600;">Crowd:</span>
            <select class="form-control" style="width: auto; padding: 4px 8px; font-size: 0.8rem;" onchange="updateMessRush(this.value)">
              <option value="Low Wait" ${mess.rushStatus === 'Low Wait' ? 'selected' : ''}>🟢 Low Wait (30%)</option>
              <option value="Moderate" ${mess.rushStatus === 'Moderate' ? 'selected' : ''}>🟡 Moderate (60%)</option>
              <option value="Peak Rush" ${mess.rushStatus === 'Peak Rush' ? 'selected' : ''}>🔴 Peak Rush (90%)</option>
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white;" onclick="openEditMessContractorModal()">
            ⚙️ Dining Hall Info
          </button>
        </div>
      ` : ''}
    `;
  }

  // Render Meal Courses
  const mealKeys = ["breakfast", "lunch", "snacks", "dinner"];
  coursesContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h4 style="font-size: 1.05rem; font-weight: 700;">Today's 4-Course Menu</h4>
      ${canEditMenu ? `
        <button class="btn btn-secondary btn-sm" onclick="openEditMessMenuModal('lunch')">
          ✏️ Edit Courses
        </button>
      ` : ''}
    </div>
    <div class="meal-courses-list">
      ${mealKeys.map(key => {
        const meal = mess.meals[key];
        const isServing = meal.status === "Serving Now";

        return `
          <div class="course-card ${isServing ? 'active-meal' : ''}">
            <div>
              <div class="course-header">
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700;">${meal.name}</h4>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${meal.time}</span>
                </div>
                <span class="status-badge ${isServing ? 'in-progress' : (meal.status === 'Completed' ? 'resolved' : 'open')}">${meal.status}</span>
              </div>

              <ul class="course-items-list">
                ${meal.items.map(item => `
                  <li style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <span>
                      <span class="diet-dot ${item.type === 'veg' ? 'diet-veg' : 'diet-nonveg'}"></span>
                      <strong>${item.name}</strong>
                    </span>
                    ${item.highlight ? `<span style="font-size: 0.7rem; background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Special</span>` : ''}
                  </li>
                `).join("")}
              </ul>
            </div>

            <div style="border-top: 1px dashed var(--border-subtle); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; color: #f59e0b; font-weight: 700;">
                ${meal.ratingAvg ? `${meal.ratingAvg} ★ (${meal.ratingsCount} reviews)` : 'Not rated yet'}
              </span>
              <div style="display: flex; gap: 6px;">
                ${state.currentUser.role === 'student' ? `
                  <button class="btn btn-secondary btn-sm" onclick="openMealFeedbackModal('${key}')">⭐ Rate</button>
                ` : ''}
                ${canEditMenu ? `
                  <button class="btn btn-primary btn-sm" onclick="openEditMessMenuModal('${key}')">Edit</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Weekly 7-Day Complete Menu Viewer -->
    <div style="margin-top: 24px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <h4 style="font-size: 1.05rem; font-weight: 700;">📅 Complete Weekly Menu Schedule</h4>
        ${canEditMenu ? `
          <button class="btn btn-secondary btn-sm" onclick="openEditWeeklyScheduleModal(activeMessScheduleDay)">
            ✏️ Edit Weekly Schedule
          </button>
        ` : ''}
      </div>
      
      <div class="mess-day-tabs">
        ${mess.weeklySchedule.map(d => `
          <button class="mess-day-btn ${d.day === activeMessScheduleDay ? 'active' : ''}" onclick="selectMessScheduleDay('${d.day}')">
            ${d.day}
          </button>
        `).join("")}
      </div>

      <div id="weeklyDayMenuDetail">
        ${renderDayScheduleDetail(activeMessScheduleDay)}
      </div>
    </div>
  `;

  // Sick Meals List
  if (sickContainer) {
    sickContainer.innerHTML = mess.sickMealRequests.map(req => `
      <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); margin-bottom: 10px; font-size: 0.82rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="hostel-indicator-badge ${req.hostel}">${req.hostel === 'boys' ? 'Boys' : 'Girls'}</span>
          <span class="status-badge ${req.status === 'Delivered' ? 'resolved' : 'open'}">${req.status}</span>
        </div>
        <div style="font-weight: 700; font-size: 0.9rem; margin-top: 4px;">${req.studentName} (Room ${req.room})</div>
        <div style="color: var(--text-muted);">${req.meal}: ${req.diet}</div>
        <div style="font-style: italic; color: var(--text-muted); margin-top: 2px;">Note: "${req.note}"</div>
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          ${canEditMenu && req.status !== 'Delivered' ? `
            <button class="btn btn-primary btn-sm" onclick="markSickMealDelivered('${req.id}')">✓ Mark Delivered</button>
          ` : ''}
          ${canEditMenu && req.status === 'Delivered' ? `
            <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="deleteSickMealRequest('${req.id}')">🗑️ Clear</button>
          ` : ''}
        </div>
      </div>
    `).join("");
  }
}

function selectMessScheduleDay(dayName) {
  SoundFX.click();
  activeMessScheduleDay = dayName;
  document.querySelectorAll(".mess-day-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim() === dayName);
  });
  const detail = document.getElementById("weeklyDayMenuDetail");
  if (detail) detail.innerHTML = renderDayScheduleDetail(dayName);
}

function renderDayScheduleDetail(dayName) {
  const day = state.data.messMenu.weeklySchedule.find(d => d.day === dayName) || state.data.messMenu.weeklySchedule[0];
  const canEditMenu = state.currentUser.role === "mess_owner" || state.currentUser.role === "principal";
  return `
    <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 14px; font-size: 0.88rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div style="font-size: 0.82rem; text-transform: uppercase; color: #059669; font-weight: 700;">★ ${day.day} Highlight: ${day.special}</div>
        ${canEditMenu ? `
          <button class="btn btn-primary btn-sm" onclick="openEditWeeklyScheduleModal('${day.day}')">
            ✏️ Edit ${day.day}'s Meals
          </button>
        ` : ''}
      </div>
      <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <div style="background: var(--bg-card); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <strong style="color: var(--text-main);">🍳 Breakfast:</strong>
          <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">${day.breakfast}</div>
        </div>
        <div style="background: var(--bg-card); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <strong style="color: var(--text-main);">🍲 Lunch:</strong>
          <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">${day.lunch}</div>
        </div>
        <div style="background: var(--bg-card); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <strong style="color: var(--text-main);">🍛 Dinner:</strong>
          <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">${day.dinner}</div>
        </div>
      </div>
    </div>
  `;
}

function openEditMessMenuModal(mealKey) {
  SoundFX.click();
  document.getElementById("editMenuMealKey").value = mealKey;
  populateMealFormFields(mealKey);
  openModal("editMessMenuModal");
}

function populateMealFormFields(mealKey) {
  const meal = state.data.messMenu.meals[mealKey];
  if (!meal) return;
  document.getElementById("editMenuStatus").value = meal.status;
  if (document.getElementById("editMenuTime")) {
    document.getElementById("editMenuTime").value = meal.time || "";
  }
  const highlightItem = meal.items.find(i => i.highlight);
  document.getElementById("editMenuHighlight").value = highlightItem ? highlightItem.name : "";
  document.getElementById("editMenuItemsText").value = meal.items.map(i => i.name).join("\n");
}

function handleSaveMessMenu(e) {
  e.preventDefault();
  const mealKey = document.getElementById("editMenuMealKey").value;
  const status = document.getElementById("editMenuStatus").value;
  const time = document.getElementById("editMenuTime") ? document.getElementById("editMenuTime").value.trim() : "";
  const highlight = document.getElementById("editMenuHighlight").value.trim();
  const text = document.getElementById("editMenuItemsText").value.trim();

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const items = lines.map(line => {
    const isHighlight = highlight && line.toLowerCase().includes(highlight.toLowerCase());
    const isNonVeg = line.toLowerCase().includes("chicken") || line.toLowerCase().includes("egg") || line.toLowerCase().includes("fish");
    return {
      name: line,
      type: isNonVeg ? "non-veg" : "veg",
      highlight: isHighlight
    };
  });

  state.data.messMenu.meals[mealKey].status = status;
  if (time) state.data.messMenu.meals[mealKey].time = time;
  state.data.messMenu.meals[mealKey].items = items;
  Storage.save(state.data);

  SoundFX.success();
  showToast(`Updated ${state.data.messMenu.meals[mealKey].name} course successfully!`, "success");
  closeModal("editMessMenuModal");
  renderMessView();
}

function openEditWeeklyScheduleModal(dayName) {
  SoundFX.click();
  const day = dayName || activeMessScheduleDay || "Monday";
  document.getElementById("editWeeklyDaySelect").value = day;
  populateWeeklyDayFormFields(day);
  openModal("editWeeklyDayModal");
}

function populateWeeklyDayFormFields(dayName) {
  const day = state.data.messMenu.weeklySchedule.find(d => d.day === dayName) || state.data.messMenu.weeklySchedule[0];
  if (!day) return;
  document.getElementById("editWeeklyDayModalTitle").textContent = `📅 Edit ${day.day} Menu Schedule`;
  document.getElementById("editWeeklySpecial").value = day.special || "";
  document.getElementById("editWeeklyBreakfast").value = day.breakfast || "";
  document.getElementById("editWeeklyLunch").value = day.lunch || "";
  document.getElementById("editWeeklyDinner").value = day.dinner || "";
}

function handleSaveWeeklyDayMenu(e) {
  e.preventDefault();
  const dayName = document.getElementById("editWeeklyDaySelect").value;
  const special = document.getElementById("editWeeklySpecial").value.trim();
  const breakfast = document.getElementById("editWeeklyBreakfast").value.trim();
  const lunch = document.getElementById("editWeeklyLunch").value.trim();
  const dinner = document.getElementById("editWeeklyDinner").value.trim();

  const dayObj = state.data.messMenu.weeklySchedule.find(d => d.day === dayName);
  if (dayObj) {
    dayObj.special = special;
    dayObj.breakfast = breakfast;
    dayObj.lunch = lunch;
    dayObj.dinner = dinner;

    Storage.save(state.data);
    SoundFX.success();
    showToast(`Weekly schedule for ${dayName} updated successfully!`, "success");
    closeModal("editWeeklyDayModal");
    activeMessScheduleDay = dayName;
    renderMessView();
  }
}

function deleteSickMealRequest(reqId) {
  SoundFX.click();
  state.data.messMenu.sickMealRequests = state.data.messMenu.sickMealRequests.filter(r => r.id !== reqId);
  Storage.save(state.data);
  showToast("Sick meal request record cleared.", "info");
  renderMessView();
}

function updateMessRush(newStatus) {
  const mess = state.data.messMenu;
  mess.rushStatus = newStatus;
  mess.rushLevel = (newStatus === "Low Wait") ? 32 : ((newStatus === "Moderate") ? 62 : 88);
  Storage.save(state.data);
  SoundFX.click();
  showToast(`Dining Hall crowd meter updated to ${newStatus}!`, "info");
  renderMessView();
}

function markSickMealDelivered(reqId) {
  const req = state.data.messMenu.sickMealRequests.find(r => r.id === reqId);
  if (req) {
    req.status = "Delivered";
    Storage.save(state.data);
    SoundFX.success();
    showToast(`Sick diet for ${req.studentName} marked as delivered!`, "success");
    renderMessView();
  }
}

function openMealFeedbackModal(mealKey) {
  SoundFX.click();
  const meal = state.data.messMenu.meals[mealKey];
  document.getElementById("mealFeedbackTitle").textContent = `Rate Today's ${meal.name}`;
  document.getElementById("mealFeedbackKey").value = mealKey;
  openModal("mealFeedbackModal");
}

function handleMealFeedbackSubmit(e) {
  e.preventDefault();
  const mealKey = document.getElementById("mealFeedbackKey").value;
  const rating = parseInt(document.getElementById("mealFeedbackRating").value);
  const meal = state.data.messMenu.meals[mealKey];

  if (meal) {
    const total = (meal.ratingAvg || 4.2) * (meal.ratingsCount || 10);
    meal.ratingsCount = (meal.ratingsCount || 0) + 1;
    meal.ratingAvg = parseFloat(((total + rating) / meal.ratingsCount).toFixed(1));
    state.data.messMenu.totalRatingsToday++;

    Storage.save(state.data);
    SoundFX.success();
    showToast(`Thank you for rating today's ${meal.name}!`, "success");
    closeModal("mealFeedbackModal");
    renderMessView();
  }
}

function handleSickMealSubmit(e) {
  e.preventDefault();
  const user = state.currentUser;
  const meal = document.getElementById("sickMealTime").value;
  const diet = document.getElementById("sickMealDiet").value;
  const note = document.getElementById("sickMealNote").value.trim();

  const newReq = {
    id: `SICK-${Math.floor(100 + Math.random() * 900)}`,
    studentName: user.name,
    hostel: user.hostel,
    room: user.room,
    meal,
    diet,
    status: "Requested",
    time: "Today",
    note: note || "Student sick; please send light meal."
  };

  state.data.messMenu.sickMealRequests.unshift(newReq);
  Storage.save(state.data);

  SoundFX.success();
  showToast("Sick meal request sent directly to Mess Manager Chef Vikram!", "success");
  closeModal("sickMealModal");
  renderMessView();
}

/* ==========================================================================
   PRINCIPAL MASTER EXECUTIVE VIEW ("Principal wants to see anything")
   ========================================================================== */
function renderPrincipalView() {
  const container = document.getElementById("principalCommandContent");
  if (!container) return;

  const boysHostel = state.data.hostels[0];
  const girlsHostel = state.data.hostels[1];
  const totalStudents = boysHostel.totalStudents + girlsHostel.totalStudents;

  const totalComplaints = state.data.complaints.length;
  const resolvedComplaints = state.data.complaints.filter(c => c.status === "resolved").length;
  const resolutionRate = Math.round((resolvedComplaints / totalComplaints) * 100);

  container.innerHTML = `
    <div class="student-attendance-hero" style="background: linear-gradient(135deg, #1e1b4b, #4338ca);">
      <div>
        <span class="hostel-indicator-badge campus">Institutional Directorate</span>
        <h2 style="font-size: 1.7rem; font-weight: 800; margin-top: 8px;">
          Campus Master Command Center
        </h2>
        <p style="color: #c7d2fe; font-size: 0.95rem; margin-top: 4px;">
          Welcome, <strong>Prof. V. K. Suryavanshi</strong>. Full executive authority over Boys Hostel, Girls Hostel, Wardens & Mess operations.
        </p>
      </div>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="exportSystemCSV()">📥 Export Directorate Audit (CSV)</button>
      </div>
    </div>

    <!-- Institutional KPI Metrics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(79, 70, 229, 0.15); color: var(--primary);">🏛️</div>
        <div class="stat-info">
          <div class="stat-value">${totalStudents}</div>
          <div class="stat-label">Total Hostel Residents</div>
          <div class="stat-trend trend-up">Boys: ${boysHostel.totalStudents} • Girls: ${girlsHostel.totalStudents}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✅</div>
        <div class="stat-info">
          <div class="stat-value">${resolutionRate}%</div>
          <div class="stat-label">Complaint Resolution Rate</div>
          <div class="stat-trend trend-up">${resolvedComplaints} of ${totalComplaints} tickets resolved</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">🍲</div>
        <div class="stat-info">
          <div class="stat-value">${state.data.messMenu.satisfactionScore}%</div>
          <div class="stat-label">Mess Quality Satisfaction</div>
          <div class="stat-trend trend-up">${state.data.messMenu.contractorName}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">🛡️</div>
        <div class="stat-info">
          <div class="stat-value">2 Hostels</div>
          <div class="stat-label">Wardens Under Directorate</div>
          <div class="stat-trend trend-up">Active & Verified</div>
        </div>
      </div>
    </div>

    <!-- Principal Governance: Manage Wardens & Mess Contractor -->
    <div class="attendance-marker-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">
            🏛️ Institutional Governance: Manage Staff & Wardens
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Principal has full authority to reassign wardens, change mess contractors, and update institutional policies.
          </p>
        </div>
      </div>

      <div class="gov-grid">
        <!-- Boys Hostel Warden Card -->
        <div class="gov-card" style="border-left: 4px solid var(--hostel-boys);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="hostel-indicator-badge boys">Boys Hostel</span>
              <span class="status-badge resolved">● Active Warden</span>
            </div>
            <h4 style="font-size: 1.15rem; font-weight: 800; margin-top: 10px; color: #1e3a8a;">
              ${boysHostel.warden}
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${boysHostel.tagline}</p>
            
            <div style="margin-top: 12px; font-size: 0.82rem; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
              <div>📞 Helpline: <strong>${boysHostel.wardenPhone}</strong></div>
              <div>✉️ Email: <strong>${boysHostel.wardenEmail}</strong></div>
              <div>🏢 Office: ${boysHostel.wardenOffice}</div>
              <div>🚪 Curfew: <strong>${boysHostel.curfewTime}</strong> • Roll Call: <strong>${boysHostel.attendanceTime}</strong></div>
            </div>
          </div>

          <div style="margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px; text-align: right;">
            <button class="gov-btn-edit" onclick="openEditWardenModal('boys')">
              ✏️ Change / Edit Boys Warden
            </button>
          </div>
        </div>

        <!-- Girls Hostel Warden Card -->
        <div class="gov-card" style="border-left: 4px solid var(--hostel-girls);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="hostel-indicator-badge girls">Girls Hostel</span>
              <span class="status-badge resolved">● Active Warden</span>
            </div>
            <h4 style="font-size: 1.15rem; font-weight: 800; margin-top: 10px; color: #831843;">
              ${girlsHostel.warden}
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${girlsHostel.tagline}</p>
            
            <div style="margin-top: 12px; font-size: 0.82rem; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
              <div>📞 Helpline: <strong>${girlsHostel.wardenPhone}</strong></div>
              <div>✉️ Email: <strong>${girlsHostel.wardenEmail}</strong></div>
              <div>🏢 Office: ${girlsHostel.wardenOffice}</div>
              <div>🚪 Curfew: <strong>${girlsHostel.curfewTime}</strong> • Roll Call: <strong>${girlsHostel.attendanceTime}</strong></div>
            </div>
          </div>

          <div style="margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px; text-align: right;">
            <button class="gov-btn-edit" onclick="openEditWardenModal('girls')">
              ✏️ Change / Edit Girls Warden
            </button>
          </div>
        </div>

        <!-- Mess Contractor & Dining Facility Card -->
        <div class="gov-card" style="border-left: 4px solid #059669;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="hostel-indicator-badge campus">Central Dining</span>
              <span class="status-badge resolved">● Active Contractor</span>
            </div>
            <h4 style="font-size: 1.15rem; font-weight: 800; margin-top: 10px; color: #065f46;">
              ${state.data.messMenu.contractorName}
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${state.data.messMenu.agencyName}</p>
            
            <div style="margin-top: 12px; font-size: 0.82rem; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
              <div>📞 Kitchen Line: <strong>${state.data.messMenu.contractorPhone}</strong></div>
              <div>🪑 Hall Capacity: <strong>${state.data.messMenu.diningHallCapacity} Diners</strong></div>
              <div>🛡️ Hygiene: <strong>${state.data.messMenu.hygieneGrade}</strong></div>
              <div>📜 Term: <strong>${state.data.messMenu.contractValidity}</strong></div>
            </div>
          </div>

          <div style="margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px; text-align: right;">
            <button class="gov-btn-edit" onclick="openEditMessContractorModal()">
              ✏️ Manage / Reassign Contractor
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   PRINCIPAL WARDEN & MESS CONTRACTOR MODAL HANDLERS
   ========================================================================== */
function openEditWardenModal(hostelId) {
  SoundFX.click();
  const hostel = state.data.hostels.find(h => h.id === hostelId);
  if (!hostel) return;

  document.getElementById("editWardenHostelId").value = hostelId;
  document.getElementById("editWardenModalTitle").textContent = `Reassign / Edit ${hostel.name} Warden`;
  document.getElementById("editWardenName").value = hostel.warden;
  document.getElementById("editWardenPhone").value = hostel.wardenPhone;
  document.getElementById("editWardenEmail").value = hostel.wardenEmail;
  document.getElementById("editWardenOffice").value = hostel.wardenOffice;
  document.getElementById("editWardenAttTime").value = hostel.attendanceTime || "08:30 PM";
  document.getElementById("editWardenCurfew").value = hostel.curfewTime || "10:30 PM";
  document.getElementById("editWardenPassword").value = "";

  openModal("editWardenModal");
}

function handleSaveWardenChanges(e) {
  e.preventDefault();
  const hostelId = document.getElementById("editWardenHostelId").value;
  const name = document.getElementById("editWardenName").value.trim();
  const phone = document.getElementById("editWardenPhone").value.trim();
  const email = document.getElementById("editWardenEmail").value.trim();
  const office = document.getElementById("editWardenOffice").value.trim();
  const attTime = document.getElementById("editWardenAttTime").value.trim();
  const curfew = document.getElementById("editWardenCurfew").value.trim();
  const newPass = document.getElementById("editWardenPassword").value.trim();

  const hostel = state.data.hostels.find(h => h.id === hostelId);
  if (hostel) {
    hostel.warden = name;
    hostel.wardenPhone = phone;
    hostel.wardenEmail = email;
    hostel.wardenOffice = office;
    hostel.attendanceTime = attTime;
    hostel.curfewTime = curfew;

    // Update user account in users array
    const userRoleKey = hostelId === 'boys' ? 'warden_boys' : 'warden_girls';
    const wardenUser = state.data.users.find(u => u.role === userRoleKey);
    if (wardenUser) {
      wardenUser.name = name;
      wardenUser.phone = phone;
      wardenUser.email = email;
      wardenUser.room = office;
      if (newPass) wardenUser.password = newPass;
    }

    // Update emergency contact
    const contactRole = hostelId === 'boys' ? 'Boys Emergency' : 'Girls Emergency';
    const emContact = state.data.emergencyContacts.find(c => c.role === contactRole);
    if (emContact) {
      emContact.name = name;
      emContact.phone = phone;
    }

    Storage.save(state.data);
    SoundFX.success();
    showToast(`Principal updated ${hostel.name} Warden successfully!`, "success");
    closeModal("editWardenModal");
    renderPrincipalView();
  }
}

function openEditMessContractorModal() {
  SoundFX.click();
  const mess = state.data.messMenu;
  document.getElementById("editMessAgency").value = mess.agencyName;
  document.getElementById("editMessHeadName").value = mess.contractorName;
  document.getElementById("editMessPhone").value = mess.contractorPhone;
  document.getElementById("editMessCapacity").value = mess.diningHallCapacity;
  document.getElementById("editMessHygieneGrade").value = mess.hygieneGrade;
  document.getElementById("editMessPassword").value = "";

  openModal("editMessContractorModal");
}

function handleSaveMessContractorChanges(e) {
  e.preventDefault();
  const agency = document.getElementById("editMessAgency").value.trim();
  const name = document.getElementById("editMessHeadName").value.trim();
  const phone = document.getElementById("editMessPhone").value.trim();
  const capacity = parseInt(document.getElementById("editMessCapacity").value);
  const hygiene = document.getElementById("editMessHygieneGrade").value.trim();
  const newPass = document.getElementById("editMessPassword").value.trim();

  state.data.messMenu.agencyName = agency;
  state.data.messMenu.contractorName = name;
  state.data.messMenu.contractorPhone = phone;
  state.data.messMenu.diningHallCapacity = capacity;
  state.data.messMenu.hygieneGrade = hygiene;

  // Update mess_owner user account
  const messUser = state.data.users.find(u => u.role === "mess_owner");
  if (messUser) {
    messUser.name = name;
    messUser.phone = phone;
    if (newPass) messUser.password = newPass;
  }

  // Update emergency contact
  const emContact = state.data.emergencyContacts.find(c => c.role === "Mess Dining");
  if (emContact) {
    emContact.name = name;
    emContact.phone = phone;
  }

  Storage.save(state.data);
  SoundFX.success();
  showToast("Principal Directorate updated Mess Contractor details!", "success");
  closeModal("editMessContractorModal");
  renderPrincipalView();
  renderMessView();
}


function exportSystemCSV() {
  SoundFX.click();
  const headers = ["Ticket ID", "Title", "Category", "Hostel", "Room", "Student", "Priority", "Status"];
  const rows = state.data.complaints.map(c => [
    c.id,
    `"${c.title.replace(/"/g, '""')}"`,
    c.category,
    c.hostel,
    c.room,
    `"${c.studentName}"`,
    c.priority,
    c.status
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `hostel_directorate_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Master Directorate CSV exported!", "success");
}

/* ==========================================================================
   WARDEN HOSTEL ROSTER VIEW
   ========================================================================== */
function renderWardenRosterView() {
  const container = document.getElementById("wardenRosterContent");
  if (!container) return;

  const isBoys = state.currentUser.role === "warden_boys";
  const hostelKey = isBoys ? "boys" : "girls";
  const students = state.data.studentsList[hostelKey] || [];

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-wrap">
        <h2><span>👥</span> ${isBoys ? "Boys" : "Girls"} Hostel Resident Roster</h2>
        <p>Complete room allotment, branches, and contact directory of residents.</p>
      </div>
    </div>

    <div class="attendance-marker-card">
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Name</th>
            <th>Allotted Room</th>
            <th>Academic Branch</th>
            <th>Academic Year</th>
            <th>Parent / Student Contact</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td style="font-family: monospace; font-weight: 700;">${s.rollNo}</td>
              <td><strong>${s.name}</strong></td>
              <td><span class="status-badge" style="background: var(--bg-subtle); color: var(--text-main); font-weight: 700;">Room ${s.room}</span></td>
              <td>${s.branch}</td>
              <td>${s.year}</td>
              <td><a href="tel:${s.phone}" style="color: var(--primary); text-decoration: none;">📞 ${s.phone}</a></td>
              <td><strong style="color: #10b981;">${s.attendancePct}%</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ==========================================================================
   ANNOUNCEMENTS & NOTICE BOARD
   ========================================================================== */
function renderAnnouncementsView() {
  const container = document.getElementById("announcementsContainer");
  if (!container) return;

  const user = state.currentUser;
  let list = state.data.announcements;

  // Filter notices relevant to user
  if (user.role === "student") {
    list = list.filter(a => a.targetHostel === "all" || a.targetHostel === user.hostel);
  } else if (user.role === "warden_boys") {
    list = list.filter(a => a.targetHostel === "all" || a.targetHostel === "boys");
  } else if (user.role === "warden_girls") {
    list = list.filter(a => a.targetHostel === "all" || a.targetHostel === "girls");
  }

  container.innerHTML = list.map(a => `
    <div class="announcement-card ${a.isPinned ? 'pinned' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div>
          <span class="hostel-indicator-badge ${a.targetHostel}">${a.targetHostel === 'all' ? 'All Campus' : (a.targetHostel === 'boys' ? 'Boys Hostel' : 'Girls Hostel')}</span>
          <span class="priority-badge priority-${a.urgency === 'urgent' ? 'critical' : 'medium'}" style="margin-left: 6px;">${a.urgency}</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${a.date}</span>
      </div>

      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${a.title}</h3>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin: 8px 0 12px; line-height: 1.5;">${a.content}</p>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
        <span>Issued by: <strong>${a.publishedBy}</strong></span>
        <button class="upvote-btn" onclick="acknowledgeNotice('${a.id}')">
          ✓ Acknowledged (${a.acknowledgedCount})
        </button>
      </div>
    </div>
  `).join("");
}

function acknowledgeNotice(id) {
  const notice = state.data.announcements.find(a => a.id === id);
  if (notice) {
    notice.acknowledgedCount++;
    Storage.save(state.data);
    SoundFX.click();
    showToast("Notice marked as acknowledged!", "success");
    renderAnnouncementsView();
  }
}

function handlePostNoticeSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("noticeTitle").value.trim();
  const category = document.getElementById("noticeCategory").value;
  const urgency = document.getElementById("noticeUrgency").value;
  const targetHostel = document.getElementById("noticeTargetHostel").value;
  const content = document.getElementById("noticeContent").value.trim();
  const isPinned = document.getElementById("noticeIsPinned").checked;

  const newNotice = {
    id: `ANN-${Date.now()}`,
    title,
    category,
    urgency,
    targetHostel,
    publishedBy: `${state.currentUser.name} (${state.currentUser.title})`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    content,
    isPinned,
    acknowledgedCount: 1
  };

  state.data.announcements.unshift(newNotice);
  Storage.save(state.data);

  SoundFX.success();
  showToast("Notice published across digital noticeboards!", "success");
  closeModal("postNoticeModal");
  setupUrgentBanner();
  renderAnnouncementsView();
}

/* ==========================================================================
   EMERGENCY SOS & CONTACTS
   ========================================================================== */
function renderEmergencyView() {
  const container = document.getElementById("emergencyContactsContainer");
  if (!container) return;

  container.innerHTML = state.data.emergencyContacts.map(c => `
    <div class="emergency-card">
      <div class="emergency-icon">${c.icon}</div>
      <div style="flex: 1;">
        <span style="font-size: 0.72rem; text-transform: uppercase; color: #ef4444; font-weight: 700;">${c.role}</span>
        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">${c.title}</h4>
        <div style="font-size: 0.82rem; color: var(--text-muted);">${c.name}</div>
        <a href="tel:${c.phone}" style="display: inline-block; margin-top: 6px; font-weight: 700; color: #059669; text-decoration: none; font-size: 0.85rem;">
          📞 ${c.phone}
        </a>
      </div>
    </div>
  `).join("");
}

function triggerEmergencySOSModal() {
  SoundFX.sos();
  const input = document.getElementById("sosLocationInput");
  if (input && state.currentUser) {
    input.value = `${state.currentUser.name} • ${state.currentUser.room || 'Campus Area'} (${state.currentUser.hostel === 'boys' ? 'Boys Hostel' : 'Girls Hostel'})`;
  }
  openModal("sosTriggerModal");
}

function handleEmergencySOSSubmit(e) {
  e.preventDefault();
  const reason = document.getElementById("sosReason").value;
  SoundFX.sos();
  closeModal("sosTriggerModal");
  alert(`🚨 EMERGENCY SOS DISPATCHED!\n\nHostel: ${state.currentUser.hostel === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}\nStudent: ${state.currentUser.name} (${state.currentUser.room})\nType: ${reason}\n\nRespective Warden, Campus Ambulance, and Security Post have been alerted!`);
}

/* ==========================================================================
   LOST & FOUND
   ========================================================================== */
function renderLostAndFoundView() {
  const container = document.getElementById("lostAndFoundContainer");
  if (!container) return;

  container.innerHTML = state.data.lostAndFound.map(item => `
    <div class="stat-card" style="align-items: flex-start;">
      <div class="stat-icon" style="background: ${item.type === 'found' ? '#ecfdf5' : '#fee2e2'}; color: ${item.type === 'found' ? '#10b981' : '#ef4444'};">
        ${item.type === 'found' ? '🎁' : '🔎'}
      </div>
      <div style="flex: 1;">
        <span class="status-badge ${item.type === 'found' ? 'resolved' : 'open'}">
          ${item.type === 'found' ? 'FOUND ITEM' : 'LOST ITEM'}
        </span>
        <h4 style="font-size: 1.05rem; font-weight: 700; margin: 8px 0 4px;">${item.title}</h4>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 4px;">📍 Last seen: <strong>${item.location}</strong></div>
        <div style="font-size: 0.82rem;">📞 Contact: <strong>${item.contact}</strong></div>
        ${!item.claimed ? `
          <button class="btn btn-secondary btn-sm" style="margin-top: 10px;" onclick="claimLostItem('${item.id}')">
            Claim / Mark Returned
          </button>
        ` : `
          <span style="font-size: 0.75rem; color: #10b981; font-weight: 700; display: inline-block; margin-top: 8px;">✓ Returned</span>
        `}
      </div>
    </div>
  `).join("");
}

function handleReportLostSubmit(e) {
  e.preventDefault();
  const type = document.getElementById("lostItemType").value;
  const title = document.getElementById("lostItemTitle").value.trim();
  const location = document.getElementById("lostItemLocation").value.trim();
  const contact = document.getElementById("lostItemContact").value.trim();

  const newItem = {
    id: `LF-${Date.now()}`,
    type,
    title,
    location,
    date: "Just now",
    contact: contact || `${state.currentUser.name} (${state.currentUser.room || 'Resident'})`,
    claimed: false,
    tag: "General"
  };

  state.data.lostAndFound.unshift(newItem);
  Storage.save(state.data);

  SoundFX.success();
  showToast("Item posted to Lost & Found board!", "success");
  closeModal("reportLostModal");
  renderLostAndFoundView();
}

function claimLostItem(id) {
  const item = state.data.lostAndFound.find(i => i.id === id);
  if (item) {
    item.claimed = true;
    Storage.save(state.data);
    SoundFX.success();
    showToast("Item marked as returned!", "success");
    renderLostAndFoundView();
  }
}

/* ==========================================================================
   MODALS & HELPERS
   ========================================================================== */
function setupModals() {
  const btnNewComp = document.getElementById("btnOpenNewComplaint");
  if (btnNewComp) {
    btnNewComp.addEventListener("click", () => {
      SoundFX.click();
      const user = state.currentUser;
      document.getElementById("newComplaintHostelDisplay").value = user.hostel === 'boys' ? "Boys Hostel" : "Girls Hostel";
      document.getElementById("newComplaintRoom").value = user.room || "";
      openModal("newComplaintModal");
    });
  }

  const btnPostNotice = document.getElementById("btnOpenPostNotice");
  if (btnPostNotice) {
    btnPostNotice.addEventListener("click", () => {
      SoundFX.click();
      openModal("postNoticeModal");
    });
  }

  const btnSickMeal = document.getElementById("btnOpenSickMeal");
  if (btnSickMeal) {
    btnSickMeal.addEventListener("click", () => {
      SoundFX.click();
      openModal("sickMealModal");
    });
  }

  const btnReportLost = document.getElementById("btnOpenReportLost");
  if (btnReportLost) {
    btnReportLost.addEventListener("click", () => {
      SoundFX.click();
      openModal("reportLostModal");
    });
  }

  // Bind Form Submissions
  const newComplaintForm = document.getElementById("newComplaintForm");
  if (newComplaintForm) newComplaintForm.addEventListener("submit", handleNewComplaintSubmit);

  const manageTicketForm = document.getElementById("manageTicketForm");
  if (manageTicketForm) manageTicketForm.addEventListener("submit", handleManageTicketSubmit);

  const mealFeedbackForm = document.getElementById("mealFeedbackForm");
  if (mealFeedbackForm) mealFeedbackForm.addEventListener("submit", handleMealFeedbackSubmit);

  const sickMealForm = document.getElementById("sickMealForm");
  if (sickMealForm) sickMealForm.addEventListener("submit", handleSickMealSubmit);

  const postNoticeForm = document.getElementById("postNoticeForm");
  if (postNoticeForm) postNoticeForm.addEventListener("submit", handlePostNoticeSubmit);

  const reportLostForm = document.getElementById("reportLostForm");
  if (reportLostForm) reportLostForm.addEventListener("submit", handleReportLostSubmit);

  const sosTriggerForm = document.getElementById("sosTriggerForm");
  if (sosTriggerForm) sosTriggerForm.addEventListener("submit", handleEmergencySOSSubmit);

  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  if (forgotPasswordForm) forgotPasswordForm.addEventListener("submit", handleResetPassword);

  const inlineForgotForm = document.getElementById("inlineForgotForm");
  if (inlineForgotForm) inlineForgotForm.addEventListener("submit", handleInlineResetPassword);

  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) editProfileForm.addEventListener("submit", handleSaveProfileChanges);

  // Close Modals on Overlay or Close Button Click
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    });
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("active");
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("active");
}

function setupUrgentBanner() {
  const banner = document.getElementById("topUrgentBanner");
  const text = document.getElementById("topUrgentText");
  const close = document.getElementById("topUrgentClose");
  const urgent = state.data.announcements.find(a => a.urgency === "urgent" && a.isPinned);

  if (urgent && banner && text) {
    text.textContent = `${urgent.title} — ${urgent.content.substring(0, 100)}...`;
    banner.style.display = "flex";
  } else if (banner) {
    banner.style.display = "none";
  }

  if (close && banner) {
    close.addEventListener("click", () => { banner.style.display = "none"; });
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    SoundFX.click();
    state.theme = state.theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
    localStorage.setItem("HOSTEL_THEME", state.theme);
    btn.innerHTML = state.theme === "light" ? "🌙" : "☀️";
    showToast(`Switched to ${state.theme} mode`, "info");
  });
}

function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span style="flex: 1;">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
