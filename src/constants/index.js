export const ADMIN_PASSWORD = 'admin123';

export const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export const MENU_CATEGORIES = {
  starter: { label: 'Закуски', icon: '🥗' },
  main: { label: 'Основные блюда', icon: '🍖' },
  dessert: { label: 'Десерты', icon: '🍰' }
};

export const INITIAL_TABLES = [
  { id: 1, x: 15, y: 20, available: true, seats: 2 },
  { id: 2, x: 45, y: 20, available: false, seats: 4 },
  { id: 3, x: 75, y: 20, available: true, seats: 4 },
  { id: 4, x: 15, y: 60, available: true, seats: 6 },
  { id: 5, x: 45, y: 60, available: false, seats: 6 },
  { id: 6, x: 75, y: 60, available: true, seats: 8 },
  { id: 7, x: 30, y: 80, available: true, seats: 2 },
  { id: 8, x: 60, y: 80, available: false, seats: 4 },
];

export const INITIAL_MENU = [
  { id: 1, name: 'Escargots de Bourgogne', price: 24, description: 'Улитки по-бургундски с чесночным маслом', category: 'starter' },
  { id: 2, name: 'Foie Gras Maison', price: 32, description: 'Домашний фуа-гра с бриошем и луковым конфитюром', category: 'starter' },
  { id: 3, name: 'Boeuf Bourguignon', price: 48, description: 'Говядина по-бургундски с молодым картофелем', category: 'main' },
  { id: 4, name: 'Confit de Canard', price: 46, description: 'Утиная ножка конфи с картофелем гратен', category: 'main' },
  { id: 5, name: 'Crème Brûlée', price: 16, description: 'Классическая карамелизированная запеканка', category: 'dessert' },
  { id: 6, name: 'Tarte Tatin', price: 18, description: 'Яблочный тарт с ванильным мороженым', category: 'dessert' },
];

export const INITIAL_BOOKING_FORM = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  partySize: '2',
};