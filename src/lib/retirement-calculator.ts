interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  employerMatch?: number;
  expectedReturn: number;
  inflationRate: number;
  desiredMonthlyIncome: number;
}

interface RetirementProjection {
  readinessScore: number;
  projectedSavings: number;
  monthlyIncomeAtRetirement: number;
  yearsOfIncome: number;
  shortfall: number;
  recommendedMonthlyContribution: number;
  rmdAge: number;
  rmdAmount: number;
}

export function calculateRetirementReadiness(inputs: RetirementInputs): RetirementProjection {
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const monthsToRetirement = yearsToRetirement * 12;
  const monthlyReturn = inputs.expectedReturn / 12 / 100;

  // Calculate future value with contributions
  let projectedSavings = inputs.currentSavings;
  const totalContribution = inputs.monthlyContribution + (inputs.employerMatch || 0);

  for (let i = 0; i < monthsToRetirement; i++) {
    projectedSavings = projectedSavings * (1 + monthlyReturn) + totalContribution;
  }

  // Calculate required savings for desired income
  const yearsInRetirement = 30; // Assume 30 years

  const realReturn = (inputs.expectedReturn - inputs.inflationRate) / 12 / 100;

  const requiredSavings =
    inputs.desiredMonthlyIncome *
    ((1 - Math.pow(1 + realReturn, -yearsInRetirement * 12)) / realReturn);

  const shortfall = Math.max(0, requiredSavings - projectedSavings);
  const readinessScore = Math.min(100, (projectedSavings / requiredSavings) * 100);

  // Calculate recommended contribution if there's a shortfall
  let recommendedMonthlyContribution = inputs.monthlyContribution;
  if (shortfall > 0) {
    recommendedMonthlyContribution =
      shortfall / ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
  }

  // RMD calculation (starts at age 73 as of 2023)
  const rmdAge = 73;
  const rmdDivisor = 26.5; // IRS life expectancy table
  const rmdAmount = projectedSavings / rmdDivisor;

  return {
    readinessScore: Math.round(readinessScore),
    projectedSavings: Math.round(projectedSavings),
    monthlyIncomeAtRetirement: Math.round(projectedSavings / (yearsInRetirement * 12)),
    yearsOfIncome: yearsInRetirement,
    shortfall: Math.round(shortfall),
    recommendedMonthlyContribution: Math.round(recommendedMonthlyContribution),
    rmdAge,
    rmdAmount: Math.round(rmdAmount),
  };
}

export function optimizeEmployerMatch(
  salary: number,
  employerMatchPercent: number,
  employerMatchLimit: number,
  currentContribution: number
): { optimal: number; additionalMatch: number } {
  const maxMatchableContribution = Math.min(
    salary * (employerMatchLimit / 100),
    (salary * (employerMatchPercent / 100)) / (employerMatchPercent / 100)
  );

  const currentMatch = Math.min(
    currentContribution * (employerMatchPercent / 100),
    salary * (employerMatchLimit / 100)
  );

  const optimalContribution = maxMatchableContribution;
  const additionalMatch = Math.max(
    0,
    Math.min(
      optimalContribution * (employerMatchPercent / 100),
      salary * (employerMatchLimit / 100)
    ) - currentMatch
  );

  return {
    optimal: Math.round(optimalContribution),
    additionalMatch: Math.round(additionalMatch),
  };
}
