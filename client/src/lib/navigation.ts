/**
 * Centralized Navigation Utility
 * 
 * Provides consistent cross-page navigation with context preservation.
 * All navigation throughout the dashboard should use these functions
 * to ensure deep linking works correctly and context is maintained.
 */

export interface NavigationContext {
  fromPage?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, string>;
}

/**
 * Store navigation context in sessionStorage for complex contexts
 * that don't fit neatly in URL parameters
 */
export function storeNavigationContext(context: NavigationContext): void {
  sessionStorage.setItem('nav_context', JSON.stringify({
    ...context,
    dateRange: context.dateRange ? {
      from: context.dateRange.from.toISOString(),
      to: context.dateRange.to.toISOString(),
    } : undefined,
  }));
}

/**
 * Retrieve stored navigation context
 */
export function getNavigationContext(): NavigationContext | null {
  const stored = sessionStorage.getItem('nav_context');
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      dateRange: parsed.dateRange ? {
        from: new Date(parsed.dateRange.from),
        to: new Date(parsed.dateRange.to),
      } : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Clear stored navigation context
 */
export function clearNavigationContext(): void {
  sessionStorage.removeItem('nav_context');
}

/**
 * Build URL with query parameters
 */
function buildUrl(basePath: string, params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Navigate to a student's profile page
 */
export function navigateToStudent(
  navigate: (path: string) => void,
  studentId: number,
  context?: NavigationContext
): void {
  if (context) {
    storeNavigationContext(context);
  }
  
  const url = buildUrl('/students', {
    id: studentId,
    from: context?.dateRange?.from.toISOString().split('T')[0],
    to: context?.dateRange?.to.toISOString().split('T')[0],
    source: context?.fromPage,
  });
  
  navigate(url);
}

/**
 * Navigate to a specific message
 */
export function navigateToMessage(
  navigate: (path: string) => void,
  messageId: number,
  context?: NavigationContext
): void {
  if (context) {
    storeNavigationContext(context);
  }
  
  const url = buildUrl('/messages', {
    id: messageId,
    from: context?.dateRange?.from.toISOString().split('T')[0],
    to: context?.dateRange?.to.toISOString().split('T')[0],
    source: context?.fromPage,
  });
  
  navigate(url);
}

/**
 * Navigate to messages page with filters pre-applied
 */
export function navigateToMessagesWithFilters(
  navigate: (path: string) => void,
  filters: {
    category?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    studentId?: number;
  },
  context?: NavigationContext
): void {
  if (context) {
    storeNavigationContext(context);
  }
  
  const url = buildUrl('/messages', {
    category: filters.category,
    sentiment: filters.sentiment,
    studentId: filters.studentId,
    from: context?.dateRange?.from.toISOString().split('T')[0],
    to: context?.dateRange?.to.toISOString().split('T')[0],
    source: context?.fromPage,
  });
  
  navigate(url);
}

/**
 * Navigate back to the source page (if context exists)
 */
export function navigateBack(
  navigate: (path: string) => void,
  fallbackPath: string = '/'
): void {
  const context = getNavigationContext();
  
  if (context?.fromPage) {
    clearNavigationContext();
    navigate(context.fromPage);
  } else {
    navigate(fallbackPath);
  }
}

/**
 * Parse URL search params to extract navigation parameters
 */
export function parseNavigationParams(searchParams: URLSearchParams): {
  id?: number;
  category?: string;
  sentiment?: string;
  studentId?: number;
  from?: Date;
  to?: Date;
  source?: string;
} {
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const sentiment = searchParams.get('sentiment');
  const studentId = searchParams.get('studentId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const source = searchParams.get('source');
  
  return {
    id: id ? parseInt(id, 10) : undefined,
    category: category || undefined,
    sentiment: sentiment || undefined,
    studentId: studentId ? parseInt(studentId, 10) : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    source: source || undefined,
  };
}

/**
 * Format a date range for display in breadcrumbs
 */
export function formatDateRangeForBreadcrumb(from: Date, to: Date): string {
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${formatDate(from)} - ${formatDate(to)}`;
}
