export const capitalizeFirstWord = (text) => {
  if (!text) return "";
  const trimmed = text.toString().trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};
