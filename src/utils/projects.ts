export interface ProjectDates {
  year: number;
  startDate?: Date;
  endDate?: Date;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
});

export function getProjectTimestamp(project: ProjectDates): number {
  return project.endDate?.valueOf()
    ?? project.startDate?.valueOf()
    ?? Date.UTC(project.year, 11, 31);
}

export function formatProjectPeriod(project: ProjectDates): string {
  const { year, startDate, endDate } = project;

  if (!startDate) return String(year);

  const startMonth = monthFormatter.format(startDate);
  const startYear = startDate.getUTCFullYear();

  if (!endDate) return `${startMonth} ${startYear}`;

  const endMonth = monthFormatter.format(endDate);
  const endYear = endDate.getUTCFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startYear}–${endMonth} ${endYear}`;
  }

  if (startMonth === endMonth) return `${startMonth} ${startYear}`;

  return `${startMonth}–${endMonth} ${startYear}`;
}
