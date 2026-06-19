export const getInitials = (name: string | undefined | null): string => {
  if (!name) return "??";
  return name.slice(0, 2).toUpperCase();
};