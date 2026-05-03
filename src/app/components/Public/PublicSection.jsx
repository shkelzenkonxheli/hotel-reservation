export default function PublicSection({ children, className = "", ...props }) {
  return (
    <section {...props} className={`public-section ${className}`}>
      {children}
    </section>
  );
}
