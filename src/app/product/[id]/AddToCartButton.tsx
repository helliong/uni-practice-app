'use client';

import { useState } from 'react';
import { Product } from '../../../types';
import { useCart } from '../../../context/CartContext';
import './AddToCartButton.scss';

export default function AddToCartButton({ product }: { product: Product }) {
  const { items, addToCart, updateQuantity } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.availableSizes?.[0]
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.availableColors?.[0]
  );

  const cartItem = items.find(item => 
    item.product.id === product.id && 
    item.selectedSize === selectedSize && 
    item.selectedColor === selectedColor
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1, selectedSize, selectedColor);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1, selectedSize, selectedColor);
  };

  return (
    <div className="add-to-cart-container">
      {product.availableSizes && (
        <div className="option-group">
          <label>Размер:</label>
          <div className="options">
            {product.availableSizes.map(size => (
              <button
                key={size}
                className={`option-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.availableColors && (
        <div className="option-group">
          <label>Цвет:</label>
          <div className="options">
            {product.availableColors.map(color => (
              <button
                key={color}
                className={`option-btn ${selectedColor === color ? 'active' : ''}`}
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {quantity > 0 ? (
        <div className="quantity-controls">
          <button className="qty-btn" onClick={handleDecrement}>-</button>
          <span className="qty-value">{quantity} шт.</span>
          <button className="qty-btn" onClick={handleIncrement}>+</button>
        </div>
      ) : (
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          Добавить в корзину
        </button>
      )}
    </div>
  );
}
