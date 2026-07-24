export type PageItem = number | "…";

/**
 * Windowed page list with ellipses. Always shows the first + last page and a
 * window of `siblingCount` pages around the current one, collapsing the rest
 * into "…". e.g. current=8, total=100 → [1, …, 7, 8, 9, …, 100].
 */
export function paginationRange(
  current: number,
  total: number,
  siblingCount = 1
): PageItem[] {
  // first + last + current + 2 ellipses + siblings on each side
  const totalPageNumbers = siblingCount * 2 + 5;

  if (total <= totalPageNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    const count = 3 + 2 * siblingCount;
    const left = Array.from({ length: count }, (_, i) => i + 1);
    return [...left, "…", total];
  }

  if (showLeftDots && !showRightDots) {
    const count = 3 + 2 * siblingCount;
    const right = Array.from({ length: count }, (_, i) => total - count + 1 + i);
    return [1, "…", ...right];
  }

  const middle: PageItem[] = [];
  for (let i = leftSibling; i <= rightSibling; i++) middle.push(i);
  return [1, "…", ...middle, "…", total];
}
