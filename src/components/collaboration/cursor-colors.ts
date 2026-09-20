// Collaborator cursor palette
export const cursorColors = [
  "#0558F9", // blueBright
  "#22AC00", // greenBright
  "#C8258C", // pinkBright
  "#7000DF", // purpleBright
  "#F87426", // orangeBright
  "#D82020", // redBright
  "#FFCE0B", // yellowBright
] as const;

export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return cursorColors[Math.abs(hash) % cursorColors.length];
}
