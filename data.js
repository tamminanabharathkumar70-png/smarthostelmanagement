/**
 * Smart Hostel Management System - Multi-Role Dataset & Storage
 * Supports:
 * - Student Login & New Student Registration (Boy -> Boys Hostel, Girl -> Girls Hostel)
 * - 2 Separate Wardens (Boys Warden & Girls Warden) with daily attendance marking
 * - Mess Owner / Contractor with menu management, crowd gauge & feedback review
 * - Principal with master administrative audit and power to change Wardens, Mess Contractor, and Settings
 * - Removed Gate Pass
 * - Strictly Boys Hostel & Girls Hostel
 */

const INITIAL_DATA = {
  // Current logged in session (defaults to null or demo user)
  currentUser: {
    username: "aarav",
    name: "Aarav Sharma",
    gender: "boy",
    role: "student", // 'student' | 'warden_boys' | 'warden_girls' | 'mess_owner' | 'principal'
    hostel: "boys",  // 'boys' | 'girls' | 'all'
    room: "B-204",
    rollNo: "CS24B1042",
    phone: "+91 98765-43210",
    email: "aarav.sharma@hostel.edu",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
  },

  // Registered credentials for authentication
  users: [
    {
      username: "aarav",
      password: "pass123",
      name: "Aarav Sharma",
      gender: "boy",
      role: "student",
      hostel: "boys",
      room: "B-204",
      rollNo: "CS24B1042",
      phone: "+91 98765-43210",
      email: "aarav.sharma@hostel.edu",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      title: "Resident Student (Boys Hostel)"
    },
    {
      username: "ananya",
      password: "pass123",
      name: "Ananya Iyer",
      gender: "girl",
      role: "student",
      hostel: "girls",
      room: "G-108",
      rollNo: "EC24G2018",
      phone: "+91 98765-44556",
      email: "ananya.iyer@hostel.edu",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      title: "Resident Student (Girls Hostel)"
    },
    {
      username: "warden_boys",
      password: "warden123",
      name: "Dr. Rajesh Gupta",
      gender: "male",
      role: "warden_boys",
      hostel: "boys",
      room: "Warden Office, Boys Block Ground Floor",
      rollNo: "STAFF-WB-01",
      phone: "+91 98765-00001",
      email: "rajesh.gupta@hostel.edu",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
      title: "Boys Hostel Chief Warden"
    },
    {
      username: "warden_girls",
      password: "warden123",
      name: "Dr. Priya Nair",
      gender: "female",
      role: "warden_girls",
      hostel: "girls",
      room: "Warden Office, Girls Block Ground Floor",
      rollNo: "STAFF-WG-02",
      phone: "+91 98765-00002",
      email: "priya.nair@hostel.edu",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
      title: "Girls Hostel Chief Warden"
    },
    {
      username: "mess_owner",
      password: "mess123",
      name: "Chef Vikram Rathore",
      gender: "male",
      role: "mess_owner",
      hostel: "all",
      room: "Central Dining & Kitchen Command",
      rollNo: "MESS-CONTR-01",
      phone: "+91 98765-00005",
      email: "vikram.mess@hostel.edu",
      avatar: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=120&q=80",
      title: "Mess Contractor & Dining Head"
    },
    {
      username: "principal",
      password: "admin123",
      name: "Prof. V. K. Suryavanshi",
      gender: "male",
      role: "principal",
      hostel: "all",
      room: "Directorate Secretariat Room #101",
      rollNo: "INST-DIR-001",
      phone: "+91 98765-00000",
      email: "principal@hostel.edu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      title: "Principal & Institutional Director"
    }
  ],

  // Hostel Information (Editable by Principal)
  hostels: [
    {
      id: "boys",
      name: "Boys Hostel",
      tagline: "Nilgiri & Everest Residence",
      warden: "Dr. Rajesh Gupta",
      wardenPhone: "+91 98765-00001",
      wardenEmail: "rajesh.gupta@hostel.edu",
      wardenOffice: "Boys Hostel Ground Floor Admin Block #01",
      totalStudents: 120,
      totalRooms: 60,
      occupiedRooms: 58,
      accentColor: "#2563eb",
      curfewTime: "10:30 PM",
      attendanceTime: "08:30 PM"
    },
    {
      id: "girls",
      name: "Girls Hostel",
      tagline: "Ganga & Yamuna Residence",
      warden: "Dr. Priya Nair",
      wardenPhone: "+91 98765-00002",
      wardenEmail: "priya.nair@hostel.edu",
      wardenOffice: "Girls Hostel Ground Floor Admin Block #01",
      totalStudents: 110,
      totalRooms: 55,
      occupiedRooms: 53,
      accentColor: "#db2777",
      curfewTime: "10:00 PM",
      attendanceTime: "08:15 PM"
    }
  ],

  // Student Rosters for Attendance Marking
  studentsList: {
    boys: [
      { rollNo: "CS24B1042", name: "Aarav Sharma", room: "B-204", branch: "Computer Science", year: "2nd Year", phone: "+91 98765-43210", attendancePct: 96 },
      { rollNo: "EC23B045", name: "Kunal Mehra", room: "B-110", branch: "Electronics", year: "3rd Year", phone: "+91 98765-11223", attendancePct: 92 },
      { rollNo: "CH24B055", name: "Rohan Vats", room: "B-302", branch: "Chemical Eng", year: "2nd Year", phone: "+91 98765-55667", attendancePct: 88 },
      { rollNo: "ME24B109", name: "Tanmay Joshi", room: "B-215", branch: "Mechanical Eng", year: "2nd Year", phone: "+91 98990-11223", attendancePct: 95 },
      { rollNo: "CS23B078", name: "Aditya Sen", room: "B-105", branch: "Computer Science", year: "3rd Year", phone: "+91 98765-22334", attendancePct: 91 },
      { rollNo: "EE24B033", name: "Siddharth Rao", room: "B-220", branch: "Electrical Eng", year: "2nd Year", phone: "+91 98765-77889", attendancePct: 94 }
    ],
    girls: [
      { rollNo: "EC24G2018", name: "Ananya Iyer", room: "G-108", branch: "Electronics", year: "2nd Year", phone: "+91 98765-44556", attendancePct: 98 },
      { rollNo: "CS23G1099", name: "Sneha Reddy", room: "G-214", branch: "Computer Science", year: "3rd Year", phone: "+91 98765-33445", attendancePct: 94 },
      { rollNo: "ME24G041", name: "Pooja Nair", room: "G-301", branch: "Mechanical Eng", year: "2nd Year", phone: "+91 98765-66778", attendancePct: 90 },
      { rollNo: "CH23G015", name: "Divya Sharma", room: "G-112", branch: "Chemical Eng", year: "3rd Year", phone: "+91 98765-88990", attendancePct: 92 },
      { rollNo: "EE24G082", name: "Riya Kapoor", room: "G-205", branch: "Electrical Eng", year: "2nd Year", phone: "+91 98765-99001", attendancePct: 96 },
      { rollNo: "CS24G067", name: "Meera Patel", room: "G-310", branch: "Computer Science", year: "2nd Year", phone: "+91 98765-12345", attendancePct: 95 }
    ]
  },

  // Daily Attendance Database (Marked strictly by Wardens)
  attendanceRecords: {
    "2026-10-02_boys": {
      date: "2026-10-02",
      hostel: "boys",
      markedBy: "Dr. Rajesh Gupta (Boys Warden)",
      markedAt: "2026-10-02T08:30:00Z",
      records: {
        "CS24B1042": "present",
        "EC23B045": "present",
        "CH24B055": "absent",
        "ME24B109": "present",
        "CS23B078": "present",
        "EE24B033": "leave"
      }
    },
    "2026-10-02_girls": {
      date: "2026-10-02",
      hostel: "girls",
      markedBy: "Dr. Priya Nair (Girls Warden)",
      markedAt: "2026-10-02T08:45:00Z",
      records: {
        "EC24G2018": "present",
        "CS23G1099": "present",
        "ME24G041": "present",
        "CH23G015": "leave",
        "EE24G082": "present",
        "CS24G067": "present"
      }
    },
    "2026-10-01_boys": {
      date: "2026-10-01",
      hostel: "boys",
      markedBy: "Dr. Rajesh Gupta (Boys Warden)",
      markedAt: "2026-10-01T08:30:00Z",
      records: {
        "CS24B1042": "present",
        "EC23B045": "present",
        "CH24B055": "present",
        "ME24B109": "present",
        "CS23B078": "present",
        "EE24B033": "present"
      }
    },
    "2026-10-01_girls": {
      date: "2026-10-01",
      hostel: "girls",
      markedBy: "Dr. Priya Nair (Girls Warden)",
      markedAt: "2026-10-01T08:40:00Z",
      records: {
        "EC24G2018": "present",
        "CS23G1099": "present",
        "ME24G041": "present",
        "CH23G015": "present",
        "EE24G082": "present",
        "CS24G067": "present"
      }
    }
  },

  // Complaint Categories
  categories: [
    { id: "electrical", name: "Electrical", icon: "⚡", color: "#f59e0b", defaultTechnician: "Ramesh Kumar" },
    { id: "plumbing", name: "Plumbing & Water", icon: "💧", color: "#0ea5e9", defaultTechnician: "Suresh Patil" },
    { id: "cleanliness", name: "Cleanliness & Hygiene", icon: "🧹", color: "#10b981", defaultTechnician: "Anita Devi" },
    { id: "carpentry", name: "Carpentry & Furniture", icon: "🪚", color: "#8b5cf6", defaultTechnician: "Dinesh Sharma" },
    { id: "wifi", name: "WiFi & Internet", icon: "📶", color: "#6366f1", defaultTechnician: "Mohan Lal" },
    { id: "mess", name: "Mess & Food Quality", icon: "🍽️", color: "#ec4899", defaultTechnician: "Chef Vikram Rathore" },
    { id: "civil", name: "Civil & General Repair", icon: "🏢", color: "#64748b", defaultTechnician: "Estate Officer" }
  ],

  // Complaints tagged strictly with hostel: 'boys' or 'girls'
  complaints: [
    {
      id: "TKT-B-101",
      title: "Ceiling Fan Regulator Sparking on High Speed",
      category: "electrical",
      hostel: "boys",
      room: "B-204",
      studentName: "Aarav Sharma",
      studentRoll: "CS24B1042",
      studentPhone: "+91 98765-43210",
      priority: "high",
      status: "in-progress",
      description: "Fan regulator in B-204 gives a burning plastic odor and sparks at speeds 4 and 5. Immediate replacement required.",
      createdAt: "2026-10-02T09:15:00Z",
      slaHours: 12,
      preferredSlot: "Evening (04:00 PM - 06:00 PM)",
      assignedTo: "Ramesh Kumar (Electrical)",
      technicianNotes: "Picked up standard 5-step modular regulator from store inventory. Scheduled visit at 4:30 PM.",
      upvotes: 3,
      timeline: [
        { status: "Reported", time: "2026-10-02T09:15:00Z", note: "Complaint logged by student Aarav Sharma." },
        { status: "Assigned", time: "2026-10-02T09:40:00Z", note: "Boys Warden Dr. Rajesh Gupta assigned to Ramesh Kumar." },
        { status: "In Progress", time: "2026-10-02T10:10:00Z", note: "Parts verified in stores." }
      ],
      rating: null,
      feedback: null
    },
    {
      id: "TKT-B-102",
      title: "Boys 2nd Floor Corridor WiFi Access Point Offline",
      category: "wifi",
      hostel: "boys",
      room: "Corridor B-201 to B-215",
      studentName: "Aditya Sen",
      studentRoll: "CS23B078",
      studentPhone: "+91 98765-22334",
      priority: "high",
      status: "resolved",
      description: "SSID 'BoysHostel-2F' offline since morning. 12+ students unable to join coding lab session.",
      createdAt: "2026-10-01T14:20:00Z",
      slaHours: 8,
      preferredSlot: "Immediate",
      assignedTo: "Mohan Lal (WiFi & IT)",
      technicianNotes: "Replaced PoE injector on floor distribution switch. Speed tested 120 Mbps.",
      upvotes: 14,
      timeline: [
        { status: "Reported", time: "2026-10-01T14:20:00Z", note: "Complaint filed by Aditya Sen." },
        { status: "Assigned", time: "2026-10-01T14:35:00Z", note: "Assigned to Mohan Lal." },
        { status: "Resolved", time: "2026-10-01T16:15:00Z", note: "PoE injector replaced and link verified." }
      ],
      rating: 5,
      feedback: "Great speed of resolution! Fixed before my coding contest."
    },
    {
      id: "TKT-B-103",
      title: "Common Washroom Geyser Water Not Heating",
      category: "plumbing",
      hostel: "boys",
      room: "Boys 1st Floor East Washroom",
      studentName: "Kunal Mehra",
      studentRoll: "EC23B045",
      studentPhone: "+91 98765-11223",
      priority: "medium",
      status: "open",
      description: "The 35L water heater power indicator turns on, but output water remains cold. Thermostat might have tripped.",
      createdAt: "2026-10-02T08:00:00Z",
      slaHours: 24,
      preferredSlot: "Morning",
      assignedTo: "Unassigned",
      technicianNotes: "",
      upvotes: 9,
      timeline: [
        { status: "Reported", time: "2026-10-02T08:00:00Z", note: "Reported by Kunal Mehra. 9 boys upvoted." }
      ],
      rating: null,
      feedback: null
    },
    {
      id: "TKT-G-201",
      title: "Study Table Drawer Track Broken & Jammed",
      category: "carpentry",
      hostel: "girls",
      room: "G-108",
      studentName: "Ananya Iyer",
      studentRoll: "EC24G2018",
      studentPhone: "+91 98765-44556",
      priority: "medium",
      status: "in-progress",
      description: "The sliding steel rail of the study desk drawer has detached from the woodwork, making it impossible to close securely.",
      createdAt: "2026-10-02T09:30:00Z",
      slaHours: 24,
      preferredSlot: "Afternoon (02:00 PM - 04:00 PM)",
      assignedTo: "Dinesh Sharma (Carpentry)",
      technicianNotes: "New heavy duty drawer slides requisitioned.",
      upvotes: 2,
      timeline: [
        { status: "Reported", time: "2026-10-02T09:30:00Z", note: "Complaint logged by Ananya Iyer." },
        { status: "Assigned", time: "2026-10-02T10:00:00Z", note: "Girls Warden Dr. Priya Nair assigned to Dinesh Sharma." }
      ],
      rating: null,
      feedback: null
    },
    {
      id: "TKT-G-202",
      title: "Girls Hostel Ground Floor Water Cooler Filter Warning Light",
      category: "plumbing",
      hostel: "girls",
      room: "Girls Ground Floor Lobby",
      studentName: "Sneha Reddy",
      studentRoll: "CS23G1099",
      studentPhone: "+91 98765-33445",
      priority: "high",
      status: "open",
      description: "The UV and carbon filter red indicator is flashing on the main RO water dispenser. Flow rate is very slow.",
      createdAt: "2026-10-02T07:45:00Z",
      slaHours: 12,
      preferredSlot: "Morning",
      assignedTo: "Unassigned",
      technicianNotes: "",
      upvotes: 18,
      timeline: [
        { status: "Reported", time: "2026-10-02T07:45:00Z", note: "Logged by Sneha Reddy. 18 girls upvoted." }
      ],
      rating: null,
      feedback: null
    },
    {
      id: "TKT-G-203",
      title: "Corridor Light Fixture Blinking Intermittently",
      category: "electrical",
      hostel: "girls",
      room: "Girls 2nd Floor Corridor G-201 to G-210",
      studentName: "Riya Kapoor",
      studentRoll: "EE24G082",
      studentPhone: "+91 98765-99001",
      priority: "low",
      status: "resolved",
      description: "The LED batten outside room G-205 flickers constantly, creating eye strain at night.",
      createdAt: "2026-10-01T11:00:00Z",
      slaHours: 24,
      preferredSlot: "Anytime",
      assignedTo: "Ramesh Kumar (Electrical)",
      technicianNotes: "Replaced 20W LED driver unit. Operational and steady.",
      upvotes: 5,
      timeline: [
        { status: "Reported", time: "2026-10-01T11:00:00Z", note: "Logged by Riya Kapoor." },
        { status: "Assigned", time: "2026-10-01T11:30:00Z", note: "Assigned to Ramesh Kumar." },
        { status: "Resolved", time: "2026-10-01T13:45:00Z", note: "LED driver replaced." }
      ],
      rating: 5,
      feedback: "Promptly fixed on the same afternoon. Thank you!"
    }
  ],

  // Mess & Dining Operations (Managed by Mess Contractor & Audited by Principal)
  messMenu: {
    contractorName: "Chef Vikram Rathore",
    agencyName: "Royal Feast Campus Caterers Ltd.",
    contractorPhone: "+91 98765-00005",
    contractValidity: "Academic Year 2026-2027",
    hygieneGrade: "Grade A+ (ISO 22000 Certified)",
    diningHallCapacity: 350,
    currentDiners: 112,
    rushLevel: 32, // percentage
    rushStatus: "Low Wait", // 'Low Wait' | 'Moderate' | 'Peak Rush'
    satisfactionScore: 91,
    totalRatingsToday: 184,
    meals: {
      breakfast: {
        name: "Breakfast",
        time: "07:30 AM - 09:30 AM",
        status: "Completed",
        items: [
          { name: "Crispy Masala Dosa with Sambar", type: "veg", highlight: true },
          { name: "Fresh Coconut & Tomato Chutney", type: "veg" },
          { name: "Boiled Eggs (2 pcs)", type: "non-veg" },
          { name: "Sprouted Moong Salad", type: "veg" },
          { name: "Hot Tea / Filter Coffee / Milk", type: "veg" }
        ],
        ratingAvg: 4.7,
        ratingsCount: 96
      },
      lunch: {
        name: "Lunch",
        time: "12:15 PM - 02:30 PM",
        status: "Serving Now",
        items: [
          { name: "Shahi Paneer Butter Masala", type: "veg", highlight: true },
          { name: "Dal Makhani (Slow Cooked)", type: "veg" },
          { name: "Steamed Jeera Basmati Rice", type: "veg" },
          { name: "Fresh Tandoori Roti with Butter", type: "veg" },
          { name: "Boondi Raita & Fresh Green Salad", type: "veg" },
          { name: "Hot Gulab Jamun (1 pc)", type: "veg" }
        ],
        ratingAvg: 4.6,
        ratingsCount: 88
      },
      snacks: {
        name: "Evening High-Tea",
        time: "05:00 PM - 06:15 PM",
        status: "Upcoming",
        items: [
          { name: "Vegetable Bread Cutlets with Mint Chutney", type: "veg", highlight: true },
          { name: "Assorted Cream Biscuits", type: "veg" },
          { name: "Special Masala Chai & Lemonade", type: "veg" }
        ],
        ratingAvg: null,
        ratingsCount: 0
      },
      dinner: {
        name: "Dinner",
        time: "07:45 PM - 09:45 PM",
        status: "Upcoming",
        items: [
          { name: "Kadai Chicken Curry (Special)", type: "non-veg", highlight: true },
          { name: "Palak Corn Delight (Veg Option)", type: "veg", highlight: true },
          { name: "Yellow Tadka Dal & Steamed Rice", type: "veg" },
          { name: "Phulkas with Ghee", type: "veg" },
          { name: "Fresh Fruit Custard", type: "veg" }
        ],
        ratingAvg: null,
        ratingsCount: 0
      }
    },
    // Weekly 7-Day Complete Schedule
    weeklySchedule: [
      { day: "Monday", breakfast: "Poha, Jalebi & Boiled Eggs", lunch: "Chole Bhature & Jeera Rice", dinner: "Egg Curry / Mix Veg & Dal Tadka", special: "Chole Bhature Feast" },
      { day: "Tuesday", breakfast: "Aloo Paratha & Fresh Curd", lunch: "Rajma Masala & Steamed Basmati", dinner: "Paneer Bhurji & Gulab Jamun", special: "Rajma Chawal Special" },
      { day: "Wednesday", breakfast: "Idli Vada with Coconut Chutney", lunch: "Hyderabadi Dum Biryani & Raita", dinner: "Butter Chicken / Soya Chaap Gravy", special: "Biryani Special Night" },
      { day: "Thursday", breakfast: "Crispy Masala Dosa & Sambar", lunch: "Shahi Paneer & Dal Makhani", dinner: "Kadai Chicken / Palak Corn", special: "Chef Vikram Special" },
      { day: "Friday", breakfast: "Methi Thepla with Pickle & Tea", lunch: "South Indian Thali with Rasam", dinner: "Kashmiri Dum Aloo & Kheer", special: "South Indian Feast" },
      { day: "Saturday", breakfast: "Pav Bhaji with Butter Pav", lunch: "Veg Manchurian & Fried Rice", dinner: "Dal Fry & Malai Kofta", special: "Indo-Chinese Night" },
      { day: "Sunday", breakfast: "Puri Bhaji with Halwa", lunch: "Royal Sunday Thali & Ice Cream", dinner: "Tandoori Chicken / Paneer Tikka", special: "Grand Sunday Feast" }
    ],
    // Sick meal delivery requests
    sickMealRequests: [
      {
        id: "SICK-101",
        studentName: "Aditya Sen",
        hostel: "boys",
        room: "B-105",
        meal: "Lunch",
        diet: "Moong Dal Khichdi + Curd",
        status: "Delivered",
        time: "12:30 PM",
        note: "Viral fever, prescribed light diet."
      },
      {
        id: "SICK-102",
        studentName: "Sneha Reddy",
        hostel: "girls",
        room: "G-214",
        meal: "Dinner",
        diet: "Vegetable Dalia Porridge + Warm Milk",
        status: "Pending Delivery",
        time: "08:00 PM",
        note: "Stomach infection, doctor requested mild porridge."
      }
    ]
  },

  // Institutional Digital Announcements & Circulars
  announcements: [
    {
      id: "ANN-INST-01",
      title: "Scheduled Overhead Water Tank Cleaning & Sanitization",
      category: "Maintenance",
      urgency: "urgent",
      targetHostel: "all",
      publishedBy: "Prof. V. K. Suryavanshi (Principal)",
      date: "October 2, 2026",
      content: "Main water storage reservoirs for both Boys Hostel and Girls Hostel will undergo pressure sanitization on Saturday between 09:00 AM and 01:00 PM. Water supply will be briefly paused. Students are advised to store drinking water in advance.",
      isPinned: true,
      acknowledgedCount: 198
    },
    {
      id: "ANN-WB-02",
      title: "Boys Hostel Gymnasium Equipment Upgrade & Timings",
      category: "Facilities",
      urgency: "important",
      targetHostel: "boys",
      publishedBy: "Dr. Rajesh Gupta (Boys Hostel Warden)",
      date: "October 1, 2026",
      content: "New Olympic barbell sets and commercial rubber flooring have been installed in the Boys Hostel gym. Operating hours: Morning 06:00 AM - 08:30 AM, Evening 05:00 PM - 09:00 PM. Please wear clean sports shoes.",
      isPinned: false,
      acknowledgedCount: 104
    },
    {
      id: "ANN-WG-03",
      title: "Girls Hostel Evening Badminton Court Lights Operational",
      category: "Sports & Recreation",
      urgency: "general",
      targetHostel: "girls",
      publishedBy: "Dr. Priya Nair (Girls Hostel Warden)",
      date: "October 1, 2026",
      content: "The floodlights on the Girls Hostel central badminton court have been serviced and rewired. Court is open for practice every evening until 09:30 PM.",
      isPinned: false,
      acknowledgedCount: 92
    },
    {
      id: "ANN-MESS-04",
      title: "Sunday Special Grand Feast - Biryani & Live Chaat Counters",
      category: "Mess Committee",
      urgency: "general",
      targetHostel: "all",
      publishedBy: "Chef Vikram Rathore (Mess Contractor)",
      date: "September 30, 2026",
      content: "The Mess Council invites all resident students for the Semester Kickoff Gala Feast this Sunday at 08:00 PM. Special dum biryani, shahi paneer, live chaat stalls, and hot jalebis!",
      isPinned: true,
      acknowledgedCount: 220
    }
  ],

  // Staff / Technicians Roster
  staff: [
    { id: "TECH-01", name: "Ramesh Kumar", trade: "Electrical", phone: "+91 98111-22334", status: "Active", activeJobs: 3 },
    { id: "TECH-02", name: "Suresh Patil", trade: "Plumbing", phone: "+91 98222-33445", status: "Active", activeJobs: 2 },
    { id: "TECH-03", name: "Dinesh Sharma", trade: "Carpentry", phone: "+91 98333-44556", status: "Active", activeJobs: 1 },
    { id: "TECH-04", name: "Anita Devi", trade: "Housekeeping", phone: "+91 98444-55667", status: "Active", activeJobs: 4 },
    { id: "TECH-05", name: "Mohan Lal", trade: "WiFi & IT", phone: "+91 98555-66778", status: "Active", activeJobs: 1 }
  ],

  // Emergency SOS Directory
  emergencyContacts: [
    { title: "Principal / Director", name: "Prof. V. K. Suryavanshi", phone: "+91 98765-00000", role: "Institution Head", icon: "🎓" },
    { title: "Boys Hostel Warden", name: "Dr. Rajesh Gupta", phone: "+91 98765-00001", role: "Boys Emergency", icon: "🛡️" },
    { title: "Girls Hostel Warden", name: "Dr. Priya Nair", phone: "+91 98765-00002", role: "Girls Emergency", icon: "🛡️" },
    { title: "Campus Health Centre & Ambulance", name: "Medical Response Desk", phone: "+91 98765-00003", role: "Medical 24x7", icon: "🚑" },
    { title: "Main Security Control Post", name: "Campus Security Office", phone: "+91 98765-00004", role: "Security & Guard", icon: "👮" },
    { title: "Mess Head / Food Quality", name: "Chef Vikram Rathore", phone: "+91 98765-00005", role: "Mess Dining", icon: "🍽️" }
  ],

  // Lost & Found
  lostAndFound: [
    {
      id: "LF-101",
      type: "found",
      title: "Apple AirPods Case (White)",
      location: "Central Dining Hall Table #8",
      date: "Oct 2, 2026 01:30 PM",
      contact: "Handed over to Mess Contractor Office",
      claimed: false,
      tag: "Electronics"
    },
    {
      id: "LF-102",
      type: "lost",
      title: "Boys Hostel Room Key with Marvel Keychain",
      location: "Boys Hostel Lawn near Block B Entrance",
      date: "Oct 1, 2026 08:00 PM",
      contact: "Aarav Sharma (Room B-204, +91 98765-43210)",
      claimed: false,
      tag: "Keys"
    },
    {
      id: "LF-103",
      type: "found",
      title: "Casio Scientific Calculator fx-991EX",
      location: "Girls Hostel Common Reading Room",
      date: "Sep 30, 2026",
      contact: "Girls Warden Security Desk",
      claimed: true,
      tag: "Stationery"
    }
  ]
};

// Storage helper functions
const Storage = {
  KEY: "SMART_HOSTEL_MANAGEMENT_V3_DATA",

  load() {
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure hostels, users, and messMenu have all properties from seed
        if (parsed.hostels && Array.isArray(parsed.hostels)) {
          parsed.hostels = parsed.hostels.map((h, i) => Object.assign({}, INITIAL_DATA.hostels[i] || {}, h));
        }
        if (parsed.messMenu) {
          parsed.messMenu = Object.assign({}, INITIAL_DATA.messMenu, parsed.messMenu);
          if (!parsed.messMenu.weeklySchedule) parsed.messMenu.weeklySchedule = INITIAL_DATA.messMenu.weeklySchedule;
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Could not load from localStorage, using initial seed data:", e);
    }
    this.save(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  },

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  },

  reset() {
    localStorage.removeItem(this.KEY);
    return this.load();
  }
};
