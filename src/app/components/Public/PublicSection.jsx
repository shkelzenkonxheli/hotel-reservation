export default function PublicSection({ children, className = "" }) {
  return <section className={`public-section ${className}`}>{children}</section>;
}
