'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import './page.scss';

export default function CartPage() {
  const { items, removeFromCart, cartTotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <h1>Корзина</h1>
        <p className="empty-msg">Ваша корзина пуста.</p>
        <Link href="/" className="back-link">Вернуться к покупкам</Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Корзина</h1>
      
      <div className="cart-container">
        <div className="cart-items">
          {items.map((item, index) => (
            <div key={`${item.product.id}-${index}`} className="cart-item">
              <div className="item-image">
                <Image 
                  src={item.product.imageUrl} 
                  alt={item.product.name} 
                  width={100} 
                  height={100} 
                  unoptimized
                />
              </div>
              <div className="item-details">
                <h3><Link href={`/product/${item.product.id}`}>{item.product.name}</Link></h3>
                <div className="item-options">
                  {item.selectedSize && <span>Размер: {item.selectedSize}</span>}
                  {item.selectedColor && <span>Цвет: {item.selectedColor}</span>}
                </div>
                <div className="item-price-qty">
                  <span className="price">{item.product.price.toLocaleString('ru-RU')} ₽</span>
                  <span className="qty">x {item.quantity}</span>
                </div>
              </div>
              <button 
                className="remove-btn" 
                onClick={() => removeFromCart(item.product.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Итого</h2>
          <div className="summary-row">
            <span>Сумма:</span>
            <span>{cartTotal.toLocaleString('ru-RU')} ₽</span>
          </div>
          <button className="checkout-btn">Оформить заказ</button>
        </div>
      </div>
    </main>
  );
}
