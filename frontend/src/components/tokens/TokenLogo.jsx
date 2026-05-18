export default function TokenLogo({ token, size = 'h-12 w-12' }) {
  return (
    <div className={`${size} grid place-items-center rounded-lg bg-gradient-to-br ${token.color} font-bold text-ink shadow-blue`}>
      {token.logo}
    </div>
  );
}
