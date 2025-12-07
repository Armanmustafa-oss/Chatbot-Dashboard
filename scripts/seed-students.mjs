// Seed script to populate students table with 250 realistic fictional students
import mysql from "mysql2/promise";

const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
  "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
  "Abigail", "Michael", "Emily", "Daniel", "Elizabeth", "Jacob", "Sofia", "Logan", "Avery", "Jackson",
  "Ella", "Sebastian", "Scarlett", "Aiden", "Grace", "Matthew", "Chloe", "Samuel", "Victoria", "David",
  "Riley", "Joseph", "Aria", "Carter", "Lily", "Owen", "Aurora", "Wyatt", "Zoey", "John",
  "Penelope", "Jack", "Layla", "Luke", "Nora", "Jayden", "Camila", "Dylan", "Hannah", "Grayson",
  "Addison", "Levi", "Eleanor", "Isaac", "Stella", "Gabriel", "Natalie", "Julian", "Zoe", "Mateo",
  "Leah", "Anthony", "Hazel", "Jaxon", "Violet", "Lincoln", "Aurora", "Joshua", "Savannah", "Christopher",
  "Audrey", "Andrew", "Brooklyn", "Theodore", "Bella", "Caleb", "Claire", "Ryan", "Skylar", "Asher",
  "Lucy", "Nathan", "Paisley", "Thomas", "Everly", "Leo", "Anna", "Isaiah", "Caroline", "Charles"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
  "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"
];

const departments = [
  "Computer Science", "Business Administration", "Engineering", "Psychology", "Biology",
  "Communications", "Nursing", "Education", "Economics", "Political Science",
  "Mathematics", "Chemistry", "Physics", "English Literature", "History",
  "Sociology", "Art & Design", "Music", "Philosophy", "Environmental Science",
  "Marketing", "Finance", "Accounting", "Management", "Information Technology"
];

function generatePhoneNumber() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${prefix}${lineNumber}`;
}

function generateStudentId() {
  return `STU${Math.floor(Math.random() * 900000) + 100000}`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedStudents() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "app",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  console.log("Connected to database");

  // Check existing student count
  const [existingRows] = await connection.execute("SELECT COUNT(*) as count FROM students");
  const existingCount = existingRows[0].count;
  console.log(`Existing students: ${existingCount}`);

  if (existingCount >= 250) {
    console.log("Already have 250+ students, skipping seed");
    await connection.end();
    return;
  }

  const studentsToAdd = 250 - existingCount;
  console.log(`Adding ${studentsToAdd} new students...`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < studentsToAdd; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const studentId = generateStudentId();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@university.edu`;
    const phone = generatePhoneNumber();
    const department = departments[Math.floor(Math.random() * departments.length)];
    const lastActiveAt = randomDate(thirtyDaysAgo, now);
    const createdAt = randomDate(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), thirtyDaysAgo);

    try {
      await connection.execute(
        `INSERT INTO students (student_id, name, email, phone, department, last_active_at, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentId, name, email, phone, department, lastActiveAt, createdAt]
      );

      if ((i + 1) % 50 === 0) {
        console.log(`Added ${i + 1} students...`);
      }
    } catch (error) {
      // Skip duplicates
      if (!error.message.includes("Duplicate")) {
        console.error(`Error adding student ${i + 1}:`, error.message);
      }
    }
  }

  console.log("Student seeding complete!");
  await connection.end();
}

seedStudents().catch(console.error);
