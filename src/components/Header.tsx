'use client';

import Link from 'next/link';
import { useCart } from '../context/CartContext';
import './Header.scss';

export default function Header() {
  const { items } = useCart();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo">
          <Link href="/">URFU Merch</Link>
        </div>
        <nav className="navigation">
          <Link href="/cart" className="nav-link cart-link">
            Корзина
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          <Link href="/login" className="nav-link login-btn">Войти</Link>
        </nav>
      </div>
    </header>
  );
}
