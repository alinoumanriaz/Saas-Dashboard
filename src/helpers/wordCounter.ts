export const countWords = (text: string) => {
  if (!text) return 0;

  let cleanText = String(text);

  // Convert Markdown links:
  // [custom candle boxes](https://example.com)
  // becomes:
  // custom candle boxes
  cleanText = cleanText.replace(
    /\[([^\]]+)\]\([^)]+\)/g,
    "$1"
  );

  // Remove Markdown heading symbols
  // ## Heading
  // becomes:
  // Heading
  cleanText = cleanText.replace(/^#{1,6}\s*/gm, "");

  // Remove Markdown bullet symbols
  // * Item
  // becomes:
  // Item
  cleanText = cleanText.replace(/^\s*[*+-]\s+/gm, "");

  // Remove Markdown bold / italic symbols
  cleanText = cleanText.replace(/(\*\*|__|\*|_)/g, "");

  // Remove HTML tags if they exist
  cleanText = cleanText.replace(/<[^>]*>/g, " ");

  // Remove URLs
  cleanText = cleanText.replace(/https?:\/\/\S+/gi, "");

  // Remove extra whitespace
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  // Count words
  return cleanText ? cleanText.split(/\s+/).length : 0;
};
