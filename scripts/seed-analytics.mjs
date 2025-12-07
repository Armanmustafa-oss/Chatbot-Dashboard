import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function seedAnalytics() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check if dailyAnalytics has data
    const [dailyCount] = await connection.execute('SELECT COUNT(*) as count FROM dailyAnalytics');
    console.log('Current dailyAnalytics count:', dailyCount[0].count);
    
    if (dailyCount[0].count === 0) {
      console.log('Seeding dailyAnalytics...');
      
      // Generate 30 days of data
      const today = new Date();
      const dailyValues = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const totalMessages = Math.floor(Math.random() * 150) + 80;
        const positiveCount = Math.floor(totalMessages * (0.55 + Math.random() * 0.15));
        const negativeCount = Math.floor(totalMessages * (0.05 + Math.random() * 0.1));
        const neutralCount = totalMessages - positiveCount - negativeCount;
        const avgResponseTimeMs = Math.floor(Math.random() * 2000) + 800;
        const avgRating = (3.5 + Math.random() * 1.3).toFixed(2);
        const uniqueStudents = Math.floor(totalMessages * 0.6);
        
        dailyValues.push(`('${dateStr}', ${totalMessages}, ${avgResponseTimeMs}, ${avgRating}, ${positiveCount}, ${neutralCount}, ${negativeCount}, ${uniqueStudents})`);
      }
      
      await connection.execute(`
        INSERT INTO dailyAnalytics (date, totalMessages, avgResponseTimeMs, avgRating, positiveCount, neutralCount, negativeCount, uniqueStudents)
        VALUES ${dailyValues.join(', ')}
      `);
      console.log('Inserted 30 days of daily analytics');
    }
    
    // Check if hourlyPeakTimes has data
    const [hourlyCount] = await connection.execute('SELECT COUNT(*) as count FROM hourlyPeakTimes');
    console.log('Current hourlyPeakTimes count:', hourlyCount[0].count);
    
    if (hourlyCount[0].count === 0) {
      console.log('Seeding hourlyPeakTimes...');
      
      const hourlyValues = [];
      const today = new Date().toISOString().split('T')[0];
      
      // Peak hours pattern: low at night, high during day
      const hourlyPattern = [
        5, 3, 2, 2, 3, 8, 25, 65, 120, 145, 160, 155, // 0-11
        140, 155, 165, 170, 150, 120, 85, 55, 35, 20, 12, 8 // 12-23
      ];
      
      for (let hour = 0; hour < 24; hour++) {
        const baseMessages = hourlyPattern[hour];
        const variance = Math.floor(baseMessages * 0.2);
        const totalMessages = baseMessages + Math.floor(Math.random() * variance * 2) - variance;
        hourlyValues.push(`('${today}', ${hour}, ${Math.max(1, totalMessages)})`);
      }
      
      await connection.execute(`
        INSERT INTO hourlyPeakTimes (date, hour, totalMessages)
        VALUES ${hourlyValues.join(', ')}
      `);
      console.log('Inserted 24 hours of peak times');
    }
    
    // Check if queryCategories has data
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM queryCategories');
    console.log('Current queryCategories count:', categoryCount[0].count);
    
    if (categoryCount[0].count === 0) {
      console.log('Seeding queryCategories...');
      
      const categories = [
        ['Financial Aid', 456],
        ['Course Registration', 445],
        ['Housing', 444],
        ['Academic Calendar', 441],
        ['Library Services', 440],
        ['Sports Facilities', 420],
        ['Internship Queries', 415],
        ['Technical Support', 410],
        ['Exam Schedule', 405],
        ['Cafeteria Menu', 400],
        ['Campus Events', 380],
        ['Career Services', 370],
        ['Health Services', 350],
        ['Transportation', 340],
        ['Student Organizations', 320]
      ];
      
      const categoryValues = categories.map(([name, count]) => 
        `('${name}', ${count})`
      );
      
      await connection.execute(`
        INSERT INTO queryCategories (category, count)
        VALUES ${categoryValues.join(', ')}
      `);
      console.log('Inserted query categories');
    }
    
    console.log('Analytics seeding complete!');
    
  } catch (error) {
    console.error('Error seeding analytics:', error);
  } finally {
    await connection.end();
  }
}

seedAnalytics();
