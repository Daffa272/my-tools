import { AnswerMode, QuestionColumn, QuestionStep, TestType } from '../types';

/**
 * Generate digits 1 to 9 (classic Pauli/Kraepelin uses 1-9 to avoid trivial +0 addition).
 * Ensures no three identical consecutive numbers to mimic official psychotest sheets.
 */
export function generateColumnNumbers(rows: number): number[] {
  const result: number[] = [];
  for (let r = 0; r < rows; r++) {
    let nextDigit: number;
    do {
      nextDigit = Math.floor(Math.random() * 9) + 1; // 1 to 9
    } while (
      result.length >= 2 &&
      result[result.length - 1] === nextDigit &&
      result[result.length - 2] === nextDigit
    );
    result.push(nextDigit);
  }
  return result;
}

export function generateInitialColumns(columnsCount: number, rowsCount: number): QuestionColumn[] {
  const columns: QuestionColumn[] = [];
  for (let c = 0; c < columnsCount; c++) {
    columns.push({
      colIndex: c,
      numbers: generateColumnNumbers(rowsCount),
    });
  }
  return columns;
}

/**
 * Build question steps for a given column based on test type (Pauli: Top-to-Bottom, Kraepelin: Bottom-to-Top)
 */
export function buildColumnSteps(
  col: QuestionColumn,
  testType: TestType,
  answerMode: AnswerMode
): QuestionStep[] {
  const steps: QuestionStep[] = [];
  const rows = col.numbers.length;

  if (testType === 'pauli') {
    // Pauli: Top to bottom (0+1, 1+2, 2+3, ..., rows-2 + rows-1)
    for (let r = 0; r < rows - 1; r++) {
      const numA = col.numbers[r];
      const numB = col.numbers[r + 1];
      const sum = numA + numB;
      const expectedAnswer = answerMode === 'digit' ? sum % 10 : sum % 2;
      steps.push({
        colIndex: col.colIndex,
        pairIndex: r,
        numA,
        numB,
        expectedAnswer,
      });
    }
  } else {
    // Kraepelin: Bottom to top (rows-1 + rows-2, rows-2 + rows-3, ..., 1 + 0)
    for (let r = rows - 1; r > 0; r--) {
      const numA = col.numbers[r];
      const numB = col.numbers[r - 1];
      const sum = numA + numB;
      const expectedAnswer = answerMode === 'digit' ? sum % 10 : sum % 2;
      steps.push({
        colIndex: col.colIndex,
        pairIndex: rows - 1 - r,
        numA,
        numB,
        expectedAnswer,
      });
    }
  }

  return steps;
}
