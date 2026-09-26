import { describe, expect, it } from 'vitest';
import { comparisonSeries, monthPhotoWindow, monthsBetween, photoPeriod } from './photos';

describe('monthPhotoWindow', () => {
  it('asks for the month photo in the last days of the month', () => {
    expect(monthPhotoWindow('2026-09-27')).toEqual({
      month: '2026-09',
      daysLeft: 3,
      monthEnd: false,
      lateMonth: null,
    });
    expect(monthPhotoWindow('2026-09-28').monthEnd).toBe(true);
    expect(monthPhotoWindow('2026-09-30')).toMatchObject({ daysLeft: 0, monthEnd: true });
    expect(monthPhotoWindow('2028-02-29')).toMatchObject({ daysLeft: 0, monthEnd: true });
  });

  it('still offers last month during the first week', () => {
    expect(monthPhotoWindow('2026-10-01').lateMonth).toBe('2026-09');
    expect(monthPhotoWindow('2027-01-07').lateMonth).toBe('2026-12');
    expect(monthPhotoWindow('2026-10-08').lateMonth).toBeNull();
  });
});

describe('monthsBetween', () => {
  it('counts whole calendar months', () => {
    expect(monthsBetween('2026-03-18', '2026-09-01')).toBe(6);
    expect(monthsBetween('2025-11-02', '2026-01-01')).toBe(2);
    expect(monthsBetween('2026-09-10', '2026-09-01')).toBe(0);
  });
});

describe('comparisonSeries', () => {
  const photo = (kind: 'start' | 'month' | 'year', period: string) => ({ kind, period });

  it('keeps the starting photo fixed and lists the others oldest first', () => {
    const series = comparisonSeries([
      photo('month', '2026-05-01'),
      photo('start', '2026-03-18'),
      photo('year', '2026-01-01'),
      photo('month', '2026-04-01'),
    ]);
    expect(series?.base).toEqual(photo('start', '2026-03-18'));
    expect(series?.others.map((p) => p.period)).toEqual(['2026-01-01', '2026-04-01', '2026-05-01']);
  });

  it('uses the oldest photo without a starting photo, and needs two photos', () => {
    const series = comparisonSeries([photo('month', '2026-05-01'), photo('month', '2026-04-01')]);
    expect(series?.base.period).toBe('2026-04-01');
    expect(series?.others).toHaveLength(1);
    expect(comparisonSeries([photo('start', '2026-03-18')])).toBeNull();
    expect(comparisonSeries([])).toBeNull();
  });
});

describe('photoPeriod', () => {
  it('stores months as their first day', () => {
    expect(photoPeriod('month', '2026-09', '2026-09-30')).toEqual({
      kind: 'month',
      period: '2026-09-01',
    });
  });
});
