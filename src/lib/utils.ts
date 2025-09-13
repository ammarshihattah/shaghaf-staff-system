import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  // Handle invalid inputs
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateSessionDuration(startTime: string, endTime?: string): number {
  try {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    // Validate dates
    if (isNaN(start.getTime()) || (endTime && isNaN(end.getTime()))) {
      console.warn('Invalid date values for session duration calculation');
      return 0;
    }
    
    // Ensure end time is after start time
    if (end.getTime() <= start.getTime()) {
      console.warn('End time is before or equal to start time');
      return 0;
    }
    
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  } catch (error) {
    console.error('Error calculating session duration:', error);
    return 0;
  }
}

// Helper function for manual 12-hour format
function formatTime12Hour(date: Date): string {
  try {
    if (isNaN(date.getTime())) {
      return 'غير محدد';
    }
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const isAfternoon = hours >= 12;
    
    // Convert to 12-hour format
    if (hours === 0) {
      hours = 12; // Midnight becomes 12 AM
    } else if (hours > 12) {
      hours = hours - 12; // Convert PM hours
    }
    
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const period = isAfternoon ? 'م' : 'ص';
    
    return `${hours}:${formattedMinutes} ${period}`;
  } catch (error) {
    console.error('Error formatting 12-hour time:', error);
    return 'غير محدد';
  }
}

export function formatTimeOnly(dateTime: string): string {
  try {
    let date: Date;
    
    // تحقق مما إذا كانت السلسلة تحتوي على وقت فقط (مثل "08:00" أو "14:30")
    if (/^\d{2}:\d{2}$/.test(dateTime.trim())) {
      // إضافة تاريخ افتراضي للوقت المجرد ليتمكن JavaScript من معالجته
      date = new Date(`2000-01-01T${dateTime}:00`);
    } else {
      // التعامل مع التاريخ والوقت الكامل كالمعتاد
      date = new Date(dateTime);
    }
    
    if (isNaN(date.getTime())) {
      return 'غير محدد';
    }
    
    // Use manual 12-hour formatting for consistent AM/PM display
    return formatTime12Hour(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'غير محدد';
  }
}

export function formatDateOnly(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      return 'غير محدد';
    }
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'غير محدد';
  }
}

export function formatDateTimeDetailed(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      return 'غير محدد';
    }
    
    // Format date part
    const datePart = date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format time part using manual 12-hour format
    const timePart = formatTime12Hour(date);
    
    return `${datePart} - ${timePart}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'غير محدد';
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    const inputDate = new Date(dateString);
    const today = new Date();
    
    // Validate input date
    if (isNaN(inputDate.getTime())) {
      return 'غير محدد';
    }
    
    // Reset time to compare only dates
    const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = inputDateOnly.getTime() - todayOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'غداً';
    } else if (diffDays === -1) {
      return 'أمس';
    } else if (diffDays > 1) {
      return `خلال ${diffDays} أيام`;
    } else if (diffDays < -1) {
      return `منذ ${Math.abs(diffDays)} أيام`;
    }
    
    return formatDateOnly(dateString);
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'غير محدد';
  }
}

export function formatCurrency(amount: number): string {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0.00 ج.م';
    }
    return `${amount.toFixed(2)} ج.م`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0.00 ج.م';
  }
}

// Export formatDateTimeDetailed as formatDateTime for compatibility
export const formatDateTime = formatDateTimeDetailed;