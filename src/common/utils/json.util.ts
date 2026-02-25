/**
 * Removes markdown code fences (e.g. ```json ... ```) from a string
 * so that the inner content can be parsed as JSON.
 */
export function cleanJsonString(raw: string): string {
  if (typeof raw !== 'string') return raw;
  let trimmed = raw.trim();
  const jsonBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (jsonBlockMatch) {
    trimmed = jsonBlockMatch[1].trim();
  }
  return trimmed;
}
