interface Family {
  incomeStreams?: Array<{ source: string; amount: number }>;
  fixedPayments?: Array<{ name: string; amount: number }>;
  properties?: Array<{ name: string; value: number; monthlyPayment?: number }>;
  loans?: Array<{ name: string; monthlyAmount: number; endDate: string }>;
}

export function calculateProfileCompletion(family: Family): number {
  let completed = 0;
  let total = 4; // 4 sections

  if (family.incomeStreams && family.incomeStreams.length > 0) completed++;
  if (family.fixedPayments && family.fixedPayments.length > 0) completed++;
  if (family.properties && family.properties.length > 0) completed++;
  if (family.loans && family.loans.length > 0) completed++;

  return Math.round((completed / total) * 100);
}

export function calculateMonthlyBalance(
  income: number,
  fixedPayments: number,
  propertyPayments: number,
  loanPayments: number,
  monthlyExpenses: number
): number {
  return income - (fixedPayments + propertyPayments + loanPayments + monthlyExpenses);
}
