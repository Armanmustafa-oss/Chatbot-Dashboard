import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navigateToStudent, NavigationContext } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useLocation } from "wouter";

interface StudentLinkProps {
  studentId: number;
  studentName?: string | null;
  displayText?: string;
  context?: NavigationContext;
  className?: string;
  showIcon?: boolean;
}

/**
 * Clickable student identifier component with consistent styling
 * and contextual deep linking throughout the dashboard.
 */
export function StudentLink({
  studentId,
  studentName,
  displayText,
  context,
  className,
  showIcon = false,
}: StudentLinkProps) {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigateToStudent(navigate, studentId, context);
  };
  
  const display = displayText || studentName || `Student #${studentId}`;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1 text-primary hover:text-primary/80",
            "underline underline-offset-2 decoration-primary/50 hover:decoration-primary",
            "cursor-pointer transition-colors font-medium",
            className
          )}
        >
          {showIcon && <User className="h-3.5 w-3.5" />}
          <span>{display}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>View student profile</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Category badge that links to filtered messages
 */
interface CategoryLinkProps {
  category: string;
  context?: NavigationContext;
  className?: string;
}

export function CategoryLink({ category, context, className }: CategoryLinkProps) {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to messages with category filter
    const params = new URLSearchParams();
    params.set('category', category);
    if (context?.dateRange) {
      params.set('from', context.dateRange.from.toISOString().split('T')[0]);
      params.set('to', context.dateRange.to.toISOString().split('T')[0]);
    }
    if (context?.fromPage) {
      params.set('source', context.fromPage);
    }
    
    navigate(`/messages?${params.toString()}`);
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            "bg-primary/10 text-primary hover:bg-primary/20",
            "cursor-pointer transition-colors",
            className
          )}
        >
          {category}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>View all {category} messages</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Message link component for navigating to specific messages
 */
interface MessageLinkProps {
  messageId: number;
  displayText: string;
  context?: NavigationContext;
  className?: string;
}

export function MessageLink({ messageId, displayText, context, className }: MessageLinkProps) {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const params = new URLSearchParams();
    params.set('id', String(messageId));
    if (context?.dateRange) {
      params.set('from', context.dateRange.from.toISOString().split('T')[0]);
      params.set('to', context.dateRange.to.toISOString().split('T')[0]);
    }
    if (context?.fromPage) {
      params.set('source', context.fromPage);
    }
    
    navigate(`/messages?${params.toString()}`);
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "text-primary hover:text-primary/80 underline underline-offset-2",
            "decoration-primary/50 hover:decoration-primary cursor-pointer transition-colors",
            className
          )}
        >
          {displayText}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>View message details</p>
      </TooltipContent>
    </Tooltip>
  );
}
