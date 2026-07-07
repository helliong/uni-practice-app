import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Худи "Dark Mode"',
    description: 'Теплое черное худи для долгих ночных сессий кодинга. Только для тех, кто на темной стороне.',
    price: 3500,
    imageUrl: 'https://placehold.co/400x400/212529/FFFFFF?text=Dark+Mode+Hoodie',
    category: 'hoodie',
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['black'],
  },
  {
    id: '2',
    name: 'Кружка "Tears of my Compiler"',
    description: 'Идеальная кружка для кофе, когда код не компилируется.',
    price: 800,
    imageUrl: 'https://placehold.co/400x400/f8f9fa/212529?text=Compiler+Mug',
    category: 'mug',
    availableColors: ['white', 'black'],
  },
  {
    id: '3',
    name: 'Стикерпак "React Developer"',
    description: 'Набор виниловых стикеров с логотипами React, Next.js и Vercel.',
    price: 400,
    imageUrl: 'https://placehold.co/400x400/007bff/FFFFFF?text=React+Stickers',
    category: 'sticker',
  },
  {
    id: '4',
    name: 'Университетский Шоппер',
    description: 'Вместительный эко-шоппер с логотипом университета для ноутбука и конспектов.',
    price: 1200,
    imageUrl: 'https://placehold.co/400x400/6c757d/FFFFFF?text=Uni+Shopper',
    category: 'other',
    availableColors: ['beige', 'black'],
  }
];
