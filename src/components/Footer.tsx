import './Footer.scss';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} UniMerch. Учебный проект.</p>
      </div>
    </footer>
  );
}
