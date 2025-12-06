import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function seedNotifications() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('Seeding notifications...');

  const notifications = [
    {
      type: 'critical',
      title: 'Student Frustration Detected',
      message: 'A student has expressed frustration multiple times about financial aid deadlines. Immediate attention recommended.',
      studentId: 1,
      messageId: 10,
      isRead: false,
      isDismissed: false,
    },
    {
      type: 'critical',
      title: 'Repeated Failed Queries',
      message: 'The chatbot has failed to answer 5 consecutive questions about course registration. Knowledge base update needed.',
      studentId: null,
      messageId: null,
      isRead: false,
      isDismissed: false,
    },
    {
      type: 'warning',
      title: 'Low Satisfaction Score Alert',
      message: 'Satisfaction score dropped below 70% in the last hour. 12 students reported negative experiences.',
      studentId: null,
      messageId: null,
      isRead: false,
      isDismissed: false,
    },
    {
      type: 'warning',
      title: 'High Volume Detected',
      message: 'Message volume is 150% above normal for this time of day. Consider scaling resources.',
      studentId: null,
      messageId: null,
      isRead: true,
      isDismissed: false,
    },
    {
      type: 'info',
      title: 'New Knowledge Gap Identified',
      message: 'Multiple students are asking about "meal plan changes" which is not covered in the current knowledge base.',
      studentId: null,
      messageId: null,
      isRead: false,
      isDismissed: false,
    },
    {
      type: 'info',
      title: 'Weekly Report Ready',
      message: 'Your weekly analytics report is ready for review. Total messages: 4,120. Satisfaction: 65%.',
      studentId: null,
      messageId: null,
      isRead: true,
      isDismissed: false,
    },
    {
      type: 'warning',
      title: 'Response Time Degradation',
      message: 'Average response time has increased to 2.5 seconds, exceeding the 2-second threshold.',
      studentId: null,
      messageId: null,
      isRead: false,
      isDismissed: false,
    },
    {
      type: 'info',
      title: 'Student Milestone',
      message: 'Student John Doe has completed 50 successful interactions with the chatbot.',
      studentId: 5,
      messageId: null,
      isRead: true,
      isDismissed: false,
    },
  ];

  for (const notification of notifications) {
    const createdAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24 hours
    
    await connection.execute(
      `INSERT INTO notifications (type, title, message, studentId, messageId, isRead, isDismissed, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.type,
        notification.title,
        notification.message,
        notification.studentId,
        notification.messageId,
        notification.isRead,
        notification.isDismissed,
        createdAt,
      ]
    );
  }

  console.log(`Seeded ${notifications.length} notifications`);
  
  await connection.end();
  console.log('Done!');
}

seedNotifications().catch(console.error);
