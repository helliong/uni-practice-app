import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../types';
import './ProductCard.scss';

export default function ProductCard({ product }: { product: Product }) {
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
        <Link href={`/product/${product.id}`} className="view-btn">Подробнее</Link>
      </div>
    </div>
  );
}
