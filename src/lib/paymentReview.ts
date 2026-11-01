import { RECEIPT_REVIEW_DURATION_MS } from '../config/payment';

// Each call creates an independent review period, including repeat submissions.
export function startReceiptReview(
  onComplete: () => void,
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout> = setTimeout,
) {
  return schedule(onComplete, RECEIPT_REVIEW_DURATION_MS);
}