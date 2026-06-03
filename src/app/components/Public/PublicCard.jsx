export default function PublicCard({ children, className = "", style }) {
  return (
    <div className={`public-card ${className}`} style={style}>
      {children}
    </div>
  );
}
