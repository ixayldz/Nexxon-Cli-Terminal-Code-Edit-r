// Diff package index
export { MultiFileDiffBuilder, type FileDiff, type MultiFileDiffOptions } from './builder.js';

// Single-file unified diff using 'diff' library
import { createTwoFilesPatch } from 'diff';

export interface DiffInput {
  oldPath: string;
  newPath: string;
  oldContent: string;
  newContent: string;
}

export function buildUnifiedDiff(input: DiffInput): string {
  return createTwoFilesPatch(
    input.oldPath,
    input.newPath,
    input.oldContent,
    input.newContent,
    '',
    ''
  );
}
