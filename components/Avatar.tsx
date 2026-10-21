const HUES = [14, 152, 198, 32, 262, 340, 88];

export function Avatar({ name, id, size = 36 }: { name: string; id: number; size?: number }) {
  const hue = HUES[Math.abs(id) % HUES.length] ?? 14;
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: `hsl(${hue} 38% 32%)`, fontSize: size < 32 ? 12 : 14 }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}
