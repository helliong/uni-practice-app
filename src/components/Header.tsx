import Link from 'next/link';
import './Header.scss';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo">
          <Link href="/">UniMerch</Link>
        </div>
        <nav className="navigation">
          <Link href="/cart" className="nav-link">Корзина</Link>
          <Link href="/login" className="nav-link login-btn">Войти</Link>
        </nav>
      </div>
    </header>
  );
}
