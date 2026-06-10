/** Emoji representativo según la especie de la mascota (placeholder visual). */
export function emojiEspecie(especie: string): string {
  const e = especie.toLowerCase();
  if (e.includes("gato")) return "🐱";
  if (e.includes("perro")) return "🐶";
  return "🐾";
}
