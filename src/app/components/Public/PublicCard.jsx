export default function PublicCard({ children, className = "" }) {
  return <div className={`public-card ${className}`}>{children}</div>;
}
