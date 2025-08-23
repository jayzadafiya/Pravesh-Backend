export function generateMixedRandomCode(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let result = "";
  result += uppercase[Math.floor(Math.random() * uppercase.length)];
  result += numbers[Math.floor(Math.random() * numbers.length)];

  const allCharacters = uppercase + numbers;
  for (let i = 0; i < 4; i++) {
    result += allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }

  return result
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function generateTicketId(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const allCharacters = uppercase + numbers;

  let result = "";
  for (let i = 0; i < 6; i++) {
    result += allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }

  return result;
}
