export const STUDENT_DISCOUNT_PERCENT = 10;

export function getStudentDiscountAmount(productsTotal: number) {
  return Math.floor((Math.max(productsTotal, 0) * STUDENT_DISCOUNT_PERCENT) / 100);
}
