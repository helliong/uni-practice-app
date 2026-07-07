import './page.scss';
import { mockProducts } from '../lib/mockData';
import ProductCard from '../components/ProductCard';

export default function Home() {
  return (
    <main className="home-page">
      <h1>Каталог товаров</h1>
      <p className="subtitle">Лучший мерч для студентов и разработчиков.</p>
      
      <div className="product-grid">
        {mockProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
