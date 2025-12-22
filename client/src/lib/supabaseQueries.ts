import { supabase } from './supabaseClient';
import { format, startOfDay, endOfDay } from 'date-fns';

/**
 * Fetch conversations data for analytics
 */
export async function fetchConversationsData(startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Fetch daily analytics data
 */
export async function fetchDailyAnalytics(startDate: Date, endDate: Date) {
  try {
    const conversations = await fetchConversationsData(startDate, endDate);
    
    // Group by date
    const dailyData: Record<string, any> = {};
    
    conversations.forEach((conv: any) => {
      const date = format(new Date(conv.created_at), 'MMM d');
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalMessages: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
        };
      }
      dailyData[date].totalMessages++;
      
      if (conv.sentiment === 'positive') dailyData[date].positive++;
      else if (conv.sentiment === 'neutral') dailyData[date].neutral++;
      else if (conv.sentiment === 'negative') dailyData[date].negative++;
    });

    return Object.values(dailyData);
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    return [];
  }
}

/**
 * Fetch hourly analytics data
 */
export async function fetchHourlyAnalytics(startDate: Date, endDate: Date) {
  try {
    const conversations = await fetchConversationsData(startDate, endDate);
    
    // Group by hour
    const hourlyData: Record<number, any> = {};
    
    conversations.forEach((conv: any) => {
      const hour = new Date(conv.created_at).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          hour: `${hour}:00`,
          hourNum: hour,
          totalMessages: 0,
        };
      }
      hourlyData[hour].totalMessages++;
    });

    return Array.from({ length: 24 }, (_, i) => 
      hourlyData[i] || { hour: `${i}:00`, hourNum: i, totalMessages: 0 }
    );
  } catch (error) {
    console.error('Error fetching hourly analytics:', error);
    return [];
  }
}

/**
 * Fetch KPI data
 */
export async function fetchKPIData(startDate: Date, endDate: Date) {
  try {
    const conversations = await fetchConversationsData(startDate, endDate);
    
    if (conversations.length === 0) {
      return {
        totalMessages: 0,
        totalStudents: 0,
        avgSatisfaction: 0,
        responseTime: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
      };
    }

    const totalMessages = conversations.length;
    const uniqueStudents = new Set(conversations.map((c: any) => c.student_id)).size;
    const avgResponseTime = conversations.reduce((sum: number, c: any) => 
      sum + (c.response_time_ms || 0), 0) / totalMessages;
    
    const sentimentCounts = {
      positive: conversations.filter((c: any) => c.sentiment === 'positive').length,
      neutral: conversations.filter((c: any) => c.sentiment === 'neutral').length,
      negative: conversations.filter((c: any) => c.sentiment === 'negative').length,
    };

    // Calculate satisfaction (positive / total)
    const avgSatisfaction = (sentimentCounts.positive / totalMessages) * 5;

    return {
      totalMessages,
      totalStudents: uniqueStudents,
      avgSatisfaction: Math.min(5, avgSatisfaction),
      responseTime: avgResponseTime / 1000, // Convert to seconds
      positiveCount: sentimentCounts.positive,
      neutralCount: sentimentCounts.neutral,
      negativeCount: sentimentCounts.negative,
    };
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return null;
  }
}

/**
 * Fetch top categories
 */
export async function fetchTopCategories(startDate: Date, endDate: Date, limit: number = 10) {
  try {
    const conversations = await fetchConversationsData(startDate, endDate);
    
    const categoryCount: Record<string, number> = {};
    conversations.forEach((conv: any) => {
      const category = conv.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top categories:', error);
    return [];
  }
}

/**
 * Fetch top queries
 */
export async function fetchTopQueries(startDate: Date, endDate: Date, limit: number = 10) {
  try {
    const conversations = await fetchConversationsData(startDate, endDate);
    
    const queryCount: Record<string, number> = {};
    conversations.forEach((conv: any) => {
      const query = conv.user_message || 'Unknown';
      queryCount[query] = (queryCount[query] || 0) + 1;
    });

    return Object.entries(queryCount)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top queries:', error);
    return [];
  }
}

/**
 * Fetch students data
 */
export async function fetchStudentsData(startDate: Date, endDate: Date) {
  try {
    const conversations = await fetchConversationsData(startDate, endDate);
    
    const studentMap: Record<string, any> = {};
    
    conversations.forEach((conv: any) => {
      const studentId = conv.student_id || 'Unknown';
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId,
          name: conv.student_name || studentId,
          email: conv.student_email || '',
          phone: conv.student_phone || '',
          messageCount: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          avgResponseTime: 0,
          lastActiveAt: conv.created_at,
        };
      }
      
      studentMap[studentId].messageCount++;
      if (conv.sentiment === 'positive') studentMap[studentId].positiveCount++;
      else if (conv.sentiment === 'negative') studentMap[studentId].negativeCount++;
      else studentMap[studentId].neutralCount++;
      
      studentMap[studentId].avgResponseTime += conv.response_time_ms || 0;
      studentMap[studentId].lastActiveAt = conv.created_at;
    });

    return Object.values(studentMap).map((student: any) => ({
      ...student,
      avgResponseTime: student.messageCount > 0 ? student.avgResponseTime / student.messageCount : 0,
      positiveRate: student.messageCount > 0 ? (student.positiveCount / student.messageCount) * 100 : 0,
      negativeRate: student.messageCount > 0 ? (student.negativeCount / student.messageCount) * 100 : 0,
    }));
  } catch (error) {
    console.error('Error fetching students data:', error);
    return [];
  }
}

/**
 * Fetch messages with optional filters
 */
export async function fetchMessages(
  startDate: Date,
  endDate: Date,
  category?: string,
  studentId?: string,
  sentiment?: string
) {
  try {
    let query = supabase
      .from('conversations')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (category) {
      query = query.eq('category', category);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

/**
 * Fetch ROI data
 */
export async function fetchROIData(startDate: Date, endDate: Date) {
  try {
    const kpiData = await fetchKPIData(startDate, endDate);
    
    if (!kpiData) return null;

    const avgMinutesPerQuery = 5;
    const hourlyRate = 25;
    const minutesSaved = kpiData.totalMessages * avgMinutesPerQuery;
    const hoursSaved = minutesSaved / 60;
    const costSaved = hoursSaved * hourlyRate;

    return {
      totalMessages: kpiData.totalMessages,
      avgMinutesPerQuery,
      hourlyRate,
      minutesSaved,
      hoursSaved: parseFloat(hoursSaved.toFixed(1)),
      costSaved: Math.round(costSaved),
      roiPercentage: ((costSaved / 1000) * 100).toFixed(1), // Assuming $1000 investment
    };
  } catch (error) {
    console.error('Error fetching ROI data:', error);
    return null;
  }
}
