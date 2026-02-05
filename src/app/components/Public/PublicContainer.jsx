export default function PublicContainer({ children, className = "" }) {
  return <div className={`public-container ${className}`}>{children}</div>;
}
