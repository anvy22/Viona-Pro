export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  stock: number;
  price: number;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    sku: 'WBH-001',
    stock: 45,
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    sku: 'SW-005',
    stock: 23,
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-02-08T16:45:00Z',
  },
  {
    id: '3',
    name: 'USB-C Charging Cable',
    sku: 'USB-C-100',
    stock: 8,
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-01-22T11:45:00Z',
    updatedAt: '2024-02-05T13:30:00Z',
  },
  {
    id: '4',
    name: 'Wireless Mouse',
    sku: 'WM-002',
    stock: 67,
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-01-25T15:20:00Z',
    updatedAt: '2024-02-12T10:15:00Z',
  },
  {
    id: '5',
    name: 'Mechanical Keyboard',
    sku: 'KB-MEC-01',
    stock: 5,
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-01-28T13:10:00Z',
    updatedAt: '2024-02-07T17:25:00Z',
  },
  {
    id: '6',
    name: 'Phone Stand',
    sku: 'PS-ALU-01',
    stock: 0,
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-02-01T08:30:00Z',
    updatedAt: '2024-02-09T12:40:00Z',
  },
  {
    id: '7',
    name: 'Laptop Sleeve 13"',
    sku: 'LS-13-BLK',
    stock: 31,
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-02-03T16:45:00Z',
    updatedAt: '2024-02-11T09:20:00Z',
  },
  {
    id: '8',
    name: 'Portable Power Bank',
    sku: 'PB-10000-01',
    stock: 2,
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1609592439107-4348a88acbe5?w=100&h=100&fit=crop&crop=center',
    createdAt: '2024-02-05T12:15:00Z',
    updatedAt: '2024-02-06T14:30:00Z',
  },
];