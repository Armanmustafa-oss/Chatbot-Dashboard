import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Sample data generators
const departments = ["Computer Science", "Engineering", "Business", "Arts", "Medicine", "Law"];
const categories = ["Exam Schedule", "Course Registration", "Library Hours", "Hostel Fees", "Bus Routes", "Cafeteria Menu", "Sports Facilities", "Scholarship Info", "Internship Queries", "Technical Support"];
const sentiments = ["positive", "neutral", "negative"];

const sampleQueries = [
  "When is the final exam for CS101?",
  "How do I register for next semester courses?",
  "What are the library hours during holidays?",
  "When is the hostel fee deadline?",
  "What time does the campus bus leave?",
  "Is the cafeteria open on weekends?",
  "How do I book the gym?",
  "What scholarships are available for international students?",
  "How do I apply for summer internships?",
  "My student portal is not working, help!",
  "Where can I find the academic calendar?",
  "How do I get a transcript?",
  "What are the requirements for graduation?",
  "Can I change my major?",
  "How do I contact my academic advisor?",
];

const sampleResponses = [
  "The final exam schedule is available on the student portal under 'Exams' section.",
  "You can register for courses through the online portal starting next week.",
  "Library hours during holidays are 9 AM to 5 PM.",
  "The hostel fee deadline is the 15th of each month.",
  "Campus buses run every 30 minutes from 7 AM to 10 PM.",
  "Yes, the cafeteria is open on weekends from 8 AM to 8 PM.",
  "You can book the gym through the sports facilities app.",
  "Please visit the financial aid office for scholarship information.",
  "Check the career services portal for internship opportunities.",
  "Please try clearing your browser cache and cookies, then try again.",
  "The academic calendar is posted on the university website.",
  "Transcripts can be requested through the registrar's office.",
  "Graduation requirements are listed in your program handbook.",
  "To change your major, please contact your academic advisor.",
  "Your advisor's contact information is available on the student portal.",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudentId() {
  return `STU${randomInt(10000, 99999)}`;
}

function generateName() {
  const firstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "James", "Emma", "Robert", "Olivia", "William", "Sophia", "Daniel", "Isabella", "Matthew"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
}

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("🌱 Starting database seed...");

  // Create students
  console.log("Creating students...");
  const studentIds = [];
  for (let i = 0; i < 100; i++) {
    const studentId = generateStudentId();
    const name = generateName();
    const email = `${name.toLowerCase().replace(" ", ".")}@university.edu`;
    const department = randomChoice(departments);
    
    await connection.execute(
      `INSERT INTO students (studentId, name, email, department, createdAt, lastActiveAt) 
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE lastActiveAt = NOW()`,
      [studentId, name, email, department]
    );
    
    const [rows] = await connection.execute(
      `SELECT id FROM students WHERE studentId = ?`,
      [studentId]
    );
    studentIds.push(rows[0].id);
  }
  console.log(`✅ Created ${studentIds.length} students`);

  // Create messages for the last 30 days
  console.log("Creating messages...");
  const now = new Date();
  let messageCount = 0;
  
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Generate 50-200 messages per day
    const dailyMessages = randomInt(50, 200);
    
    for (let m = 0; m < dailyMessages; m++) {
      const studentId = randomChoice(studentIds);
      const query = randomChoice(sampleQueries);
      const response = randomChoice(sampleResponses);
      const sentiment = Math.random() < 0.65 ? "positive" : (Math.random() < 0.8 ? "neutral" : "negative");
      const category = randomChoice(categories);
      const responseTimeMs = randomInt(500, 3000);
      const rating = sentiment === "positive" ? randomInt(4, 5) : (sentiment === "neutral" ? randomInt(3, 4) : randomInt(1, 3));
      const hour = randomInt(0, 23);
      
      const messageDate = new Date(date);
      messageDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      
      await connection.execute(
        `INSERT INTO messages (studentId, query, response, sentiment, category, responseTimeMs, isResolved, rating, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, query, response, sentiment, category, responseTimeMs, true, rating, messageDate]
      );
      messageCount++;
    }
  }
  console.log(`✅ Created ${messageCount} messages`);

  // Aggregate daily analytics
  console.log("Aggregating daily analytics...");
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as totalMessages,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positiveCount,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutralCount,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negativeCount,
        AVG(responseTimeMs) as avgResponseTimeMs,
        AVG(rating) * 10 as avgRating,
        COUNT(DISTINCT studentId) as uniqueStudents
       FROM messages 
       WHERE createdAt >= ? AND createdAt < ?`,
      [date, nextDate]
    );
    
    const stat = stats[0];
    await connection.execute(
      `INSERT INTO dailyAnalytics (date, totalMessages, positiveCount, neutralCount, negativeCount, avgResponseTimeMs, avgRating, uniqueStudents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         totalMessages = VALUES(totalMessages),
         positiveCount = VALUES(positiveCount),
         neutralCount = VALUES(neutralCount),
         negativeCount = VALUES(negativeCount),
         avgResponseTimeMs = VALUES(avgResponseTimeMs),
         avgRating = VALUES(avgRating),
         uniqueStudents = VALUES(uniqueStudents)`,
      [date, stat.totalMessages || 0, stat.positiveCount || 0, stat.neutralCount || 0, stat.negativeCount || 0, Math.round(stat.avgResponseTimeMs || 0), Math.round(stat.avgRating || 0), stat.uniqueStudents || 0]
    );
  }
  console.log("✅ Daily analytics aggregated");

  // Aggregate hourly peak times
  console.log("Aggregating hourly peak times...");
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(date);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(date);
      hourEnd.setHours(hour, 59, 59, 999);
      
      const [counts] = await connection.execute(
        `SELECT COUNT(*) as count FROM messages WHERE createdAt >= ? AND createdAt <= ?`,
        [hourStart, hourEnd]
      );
      
      await connection.execute(
        `INSERT INTO hourlyPeakTimes (date, hour, messageCount)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE messageCount = VALUES(messageCount)`,
        [date, hour, counts[0].count]
      );
    }
  }
  console.log("✅ Hourly peak times aggregated");

  // Aggregate query categories
  console.log("Aggregating query categories...");
  for (const category of categories) {
    const [counts] = await connection.execute(
      `SELECT COUNT(*) as count FROM messages WHERE category = ?`,
      [category]
    );
    
    await connection.execute(
      `INSERT INTO queryCategories (name, count)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE count = VALUES(count)`,
      [category, counts[0].count]
    );
  }
  console.log("✅ Query categories aggregated");

  await connection.end();
  console.log("🎉 Database seeding complete!");
}

seed().catch(console.error);
