export const STUDENT_DISCOUNT_PERCENT = 10;

export function getStudentDiscountAmount(productsTotal: number) {
  return Math.floor((productsTotal * STUDENT_DISCOUNT_PERCENT) / 100);
}
