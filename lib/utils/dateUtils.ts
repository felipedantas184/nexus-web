// lib/utils/dateUtils.ts
export class DateUtils {
  static getWeekStartDate(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0-6
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira como início
    return new Date(d.setDate(diff));
  }

  static getWeekEndDate(date: Date = new Date()): Date {
    const start = this.getWeekStartDate(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  static getWeekNumber(date: Date = new Date()): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  }

  static getDayOfWeek(date: Date = new Date()): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Convert to 0-6 (Monday-Sunday)
  }

  static formatDateForStorage(date: Date): string {
    return date.toISOString();
  }

  static parseDateFromStorage(dateString: string): Date {
    return new Date(dateString);
  }

  static addWeeks(date: Date, weeks: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  static getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }
}