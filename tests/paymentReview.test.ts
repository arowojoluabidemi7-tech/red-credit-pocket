import { describe, expect, test } from 'bun:test';
import { startReceiptReview } from './paymentReview';

describe('receipt review', () => {
  test('keeps a receipt under review for 5 seconds before completing', () => {
    let elapsed = 0;
    let completed = false;
    let dueAt = 0;
    let complete = () => {};
    startReceiptReview(() => { completed = true; }, (callback, delay) => {
      dueAt = elapsed + delay;
      complete = callback;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    });
    expect(dueAt).toBe(5000);
    elapsed = 4999;
    if (elapsed >= dueAt) complete();
    expect(completed).toBe(false);
    elapsed = 5000;
    if (elapsed >= dueAt) complete();
    expect(completed).toBe(true);
  });

  test('starts another full 5-second review on a repeat submission', () => {
    const scheduled: Array<{ callback: () => void; delay: number }> = [];
    let completions = 0;
    const schedule = (callback: () => void, delay: number) => {
      scheduled.push({ callback, delay });
      return scheduled.length as unknown as ReturnType<typeof setTimeout>;
    };
    startReceiptReview(() => { completions += 1; }, schedule);
    scheduled[0].callback();
    startReceiptReview(() => { completions += 1; }, schedule);
    expect(scheduled).toHaveLength(2);
    expect(scheduled[1].delay).toBe(5000);
    expect(completions).toBe(1);
    scheduled[1].callback();
    expect(completions).toBe(2);
  });
});