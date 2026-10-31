// Fake demo data. Everything here is fictional, which the hackathon rules require.

// Training / qualifications a resource can ask for
export const certifications = [
  { id: "lab-safety", name: "Lab Safety Induction" },
  { id: "3d-printing", name: "3D Printer Training" },
  { id: "electronics", name: "Electronics Lab Orientation" },
  { id: "drone", name: "Drone Pilot Basics" },
];

export const seed = {
  currentUserId: "u1",

  users: [
    { id: "u1", name: "Aarav Sharma", role: "student", dept: "CSE", verified: true, certs: ["lab-safety"] },
    { id: "u2", name: "Riya Verma", role: "student", dept: "ECE", verified: true, certs: ["lab-safety", "3d-printing", "electronics"] },
    { id: "u3", name: "Dr. Mehta", role: "owner", dept: "Electronics Lab", verified: true, certs: [] },
    { id: "u4", name: "Campus Admin", role: "admin", dept: "Administration", verified: true, certs: [] },
  ],

  resources: [
    {
      id: "r1", code: "CV-001", name: "Prusa 3D Printer", category: "Fabrication",
      icon: "printer", location: "Makerspace, Block C", ownerId: "u3",
      availability: "Mon to Fri, 10:00 to 16:00", maxHours: 4, deposit: 500,
      requires: ["lab-safety", "3d-printing"],
      rules: "Use only PLA filament from the lab. Staff must be present during the first print.",
    },
    {
      id: "r2", code: "CV-002", name: "Canon DSLR Camera Kit", category: "Media",
      icon: "camera", location: "Media Room, Block A", ownerId: "u3",
      availability: "Mon to Sat, 09:00 to 17:00", maxHours: 24, deposit: 2000,
      requires: [],
      rules: "Return with lens cap, battery and memory card. No outdoor use in rain.",
    },
    {
      id: "r3", code: "CV-003", name: "Digital Oscilloscope", category: "Testing",
      icon: "scope", location: "Electronics Lab 2", ownerId: "u3",
      availability: "Mon to Fri, 10:00 to 15:00", maxHours: 3, deposit: 0,
      requires: ["lab-safety", "electronics"],
      rules: "Do not exceed the probe voltage rating. Report any damaged probe immediately.",
    },
    {
      id: "r4", code: "CV-004", name: "Quadcopter Drone", category: "Robotics",
      icon: "drone", location: "Innovation Cell, Block D", ownerId: "u3",
      availability: "Tue and Thu, 11:00 to 15:00", maxHours: 2, deposit: 3000,
      requires: ["lab-safety", "drone"],
      rules: "Indoor flying only inside the marked area. Staff supervision is required.",
    },
    {
      id: "r5", code: "CV-005", name: "Arduino Starter Kit", category: "Electronics",
      icon: "cpu", location: "Electronics Lab 1", ownerId: "u3",
      availability: "Mon to Fri, 10:00 to 16:00", maxHours: 72, deposit: 200,
      requires: [],
      rules: "Check the part list at pickup and at return. Missing parts are charged.",
    },
    {
      id: "r6", code: "CV-006", name: "Seminar Room 204", category: "Spaces",
      icon: "room", location: "Block B, 2nd floor", ownerId: "u3",
      availability: "Daily, 09:00 to 18:00", maxHours: 3, deposit: 0,
      requires: [],
      rules: "Leave the room as you found it. Switch off the projector and AC.",
    },
  ],

  bookings: [],
  incidents: [], // damage, delay and other reports
  seen: {},      // when each user last marked notifications as read
  audit: [],    // every important action gets recorded here
};
