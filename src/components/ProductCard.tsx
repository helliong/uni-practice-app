'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import './ProductCard.scss';

export default function ProductCard({ product }: { product: Product }) {
  const { items, addToCart, updateQuantity } = useCart();

  const defaultSize = product.availableSizes?.[0];
  const defaultColor = product.availableColors?.[0];

  const cartItem = items.find(item => 
    item.product.id === product.id && 
    item.selectedSize === defaultSize && 
    item.selectedColor === defaultColor
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1, defaultSize, defaultColor);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    updateQuantity(product.id, quantity + 1, defaultSize, defaultColor);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    updateQuantity(product.id, quantity - 1, defaultSize, defaultColor);
  };

  return (
    <div className="product-card">
      <Link href={`/product/${product.id}`} className="image-wrapper">
        <Image 
          src={product.imageUrl} 
          alt={product.name} 
          width={300} 
          height={300}
          className="product-image"
          unoptimized // for placeholder images
        />
      </Link>
      <div className="product-info">
        <h3><Link href={`/product/${product.id}`}>{product.name}</Link></h3>
        <p className="price">{product.price.toLocaleString('ru-RU')} ₽</p>
        
        {quantity > 0 ? (
          <div className="quantity-controls">
            <button className="qty-btn" onClick={handleDecrement}>-</button>
            <span className="qty-value">{quantity} шт.</span>
            <button className="qty-btn" onClick={handleIncrement}>+</button>
          </div>
        ) : (
          <button className="view-btn" onClick={handleAddToCart}>В корзину</button>
        )}
      </div>
    </div>
  );
}
