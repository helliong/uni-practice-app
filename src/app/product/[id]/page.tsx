import Image from 'next/image';
import { mockProducts } from '../../../lib/mockData';
import { notFound } from 'next/navigation';
import './page.scss';
// We would usually import a Client Component here for Add To Cart button
import AddToCartButton from './AddToCartButton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = mockProducts.find(p => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  return (
    <main className="product-detail-page">
      <div className="product-container">
        <div className="image-section">
          <Image 
            src={product.imageUrl} 
            alt={product.name} 
            width={600} 
            height={600}
            className="main-image"
            unoptimized
          />
        </div>
        <div className="info-section">
          <h1>{product.name}</h1>
          <p className="price">{product.price.toLocaleString('ru-RU')} ₽</p>
          <p className="description">{product.description}</p>
          
          <AddToCartButton product={product} />
        </div>
      </div>
    </main>
  );
}
