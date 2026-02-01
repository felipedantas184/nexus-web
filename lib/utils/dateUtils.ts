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
    return date.getDay(); // Retorna: 0 (Domingo) a 6 (Sábado)
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

  static isDateInWeek(date: Date, weekStartDate: Date): boolean {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    return date >= weekStartDate && date <= weekEndDate;
  }

  /**
   * Retorna o número da semana no ano (1-52)
   */
  static getWeekOfYear(date: Date = new Date()): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Verifica se é segunda-feira
   */
  static isMonday(date: Date = new Date()): boolean {
    return date.getDay() === 1; // 0 = Domingo, 1 = Segunda
  }

  /**
   * Verifica se duas semanas são consecutivas
   */
  static areWeeksConsecutive(week1Start: Date, week2Start: Date): boolean {
    const expectedWeek2Start = new Date(week1Start);
    expectedWeek2Start.setDate(week1Start.getDate() + 7);

    return week2Start.toDateString() === expectedWeek2Start.toDateString();
  }

  /**
   * Formata data para exibição amigável
   */
  static formatDateForDisplay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('pt-BR', options);
  }

  /**
   * Formata intervalo de datas da semana
   */
  static formatWeekRange(startDate: Date, endDate: Date): string {
    const startStr = startDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  }

  /**
   * Retorna o nome do dia da semana em português
   */
  static getDayName(dayIndex: number): string {
    const days = [
      'Domingo', 'Segunda-feira', 'Terça-feira',
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return days[dayIndex] || 'Dia inválido';
  }
}