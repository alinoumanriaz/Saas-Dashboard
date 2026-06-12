import { format, isValid } from "date-fns";

export const formatDate = (dateInput: string | number | Date | undefined | null): string => {
  if (!dateInput) return "-"; // Handle null/undefined
  
  try {
    // Handle string timestamps (like "1754848574409")
    if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      const timestamp = parseInt(dateInput, 10);
      const date = new Date(timestamp);
      return isValid(date) ? format(date, "MMM d, yyyy, h:mm a") : "-";
    }
    
    // Handle regular Date objects or ISO strings
    const date = new Date(dateInput);
    return isValid(date) ? format(date, "MMM d, yyyy, h:mm a") : "-";
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateInput);
    return "-";
  }
};