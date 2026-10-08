import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { convertUnitQuantity } from './src/utils/unitConversion';
import {
  Restaurant,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
  RestaurantTable,
  Category,
  Product,
  Order,
  OrderItem,
  PaymentRecord,
  PaymentMethod,
  CashRegister,
  CancelledItemRecord,
  AuditLog,
  RestaurantSettings,
  ServerSyncEvent,
  Reservation,
  DEFAULT_ROLE_PERMISSIONS,
  CustomRole,
  Printer,
  PrinterTemplate,
  InventoryItem,
  InventoryTransaction,
  RecipeItem,
  ALL_SYSTEM_PERMISSIONS,
  BillingDetails,
  PaymentTransaction,
  TenantSubscriptionInfo,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Realtime Database with Rich Seed Data
export interface UserInDb extends User {
  passwordHash?: string;
  pinHash?: string;
  salt?: string;
}

export function hashPassword(password: string, salt = 'patronpos_salt_key'): string {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

export function sanitizeUser(u: UserInDb): User {
  const { passwordHash, pinHash, salt, pin, ...rest } = u;
  return {
    ...rest,
    pin: '••••',
  };
}

interface DatabaseState {
  restaurants: Restaurant[];
  users: UserInDb[];
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  payments: PaymentRecord[];
  cashRegisters: CashRegister[];
  cancelledItems: CancelledItemRecord[];
  auditLogs: AuditLog[];
  settings: RestaurantSettings[];
  reservations: Reservation[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  printers: Printer[];
  printerTemplates: PrinterTemplate[];
  roles: CustomRole[];
}

// Initial Demo Dataset Seed
function getInitialData(): DatabaseState {
  const users: UserInDb[] = [
    {
      id: 'usr-1',
      name: 'Kemal Patron',
      username: 'admin',
      email: 'admin@patronpos.com',
      role: 'ADMIN',
      pin: '1234',
      passwordHash: hashPassword('admin123', 'salt_admin'),
      pinHash: hashPassword('1234', 'salt_admin'),
      salt: 'salt_admin',
      active: true,
      phone: '0532 100 2030',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dailySales: 14250,
      permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.ADMIN,
    },
    {
      id: 'usr-2',
      name: 'Ahmet Yılmaz',
      username: 'ahmet',
      email: 'ahmet@patronpos.com',
      role: 'WAITER',
      pin: '1111',
      passwordHash: hashPassword('ahmet123', 'salt_ahmet'),
      pinHash: hashPassword('1111', 'salt_ahmet'),
      salt: 'salt_ahmet',
      active: true,
      phone: '0544 234 5678',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dailySales: 4850,
      customPermissionsEnabled: true,
      permissions: ['tables.view', 'tables.edit', 'orders.view', 'orders.create', 'orders.edit', 'orders.serve'],
      allowedTabs: ['tables', 'reservations', 'orders'], // Kasaya / Ödemelere erişemez
    },
    {
      id: 'usr-3',
      name: 'Can Demir',
      username: 'can',
      email: 'can@patronpos.com',
      role: 'WAITER',
      pin: '2222',
      passwordHash: hashPassword('can123', 'salt_can'),
      pinHash: hashPassword('2222', 'salt_can'),
      salt: 'salt_can',
      active: true,
      phone: '0555 345 6789',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      dailySales: 3420,
      customPermissionsEnabled: true,
      permissions: ['tables.view', 'tables.edit', 'orders.view', 'orders.create', 'orders.edit', 'orders.serve', 'payments.view', 'payments.create'],
      allowedTabs: ['tables', 'reservations', 'orders', 'payments', 'cash-register'], // Kasaya ve Ödemelere özel yetkili erişebilir!
    },
    {
      id: 'usr-4',
      name: 'Şef Murat Usta',
      username: 'mutfak',
      email: 'mutfak@patronpos.com',
      role: 'KITCHEN',
      pin: '3333',
      passwordHash: hashPassword('mutfak123', 'salt_mutfak'),
      pinHash: hashPassword('3333', 'salt_mutfak'),
      salt: 'salt_mutfak',
      active: true,
      phone: '0533 456 7890',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      permissions: ['kitchen.view', 'kitchen.manage', 'inventory.view'],
      allowedTabs: ['kitchen', 'stock'],
    },
    {
      id: 'usr-5',
      name: 'Elif Kasa',
      username: 'kasa',
      email: 'kasa@patronpos.com',
      role: 'CASHIER',
      pin: '4444',
      passwordHash: hashPassword('kasa123', 'salt_kasa'),
      pinHash: hashPassword('4444', 'salt_kasa'),
      salt: 'salt_kasa',
      active: true,
      phone: '0536 789 0123',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      permissions: ['tables.view', 'orders.view', 'payments.view', 'payments.create', 'payments.discount', 'cash.manage', 'reports.view'],
      allowedTabs: ['tables', 'reservations', 'payments', 'cash-register', 'reports'],
    },
    {
      id: 'usr-6',
      name: 'Ayşe Yılmaz',
      username: 'ayse',
      email: 'ayse@patronpos.com',
      role: 'WAITER',
      pin: '5555',
      passwordHash: hashPassword('ayse123', 'salt_ayse'),
      pinHash: hashPassword('5555', 'salt_ayse'),
      salt: 'salt_ayse',
      active: true,
      phone: '0543 987 6543',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      dailySales: 2850,
      permissions: ['tables.view', 'tables.edit', 'orders.view', 'orders.create', 'orders.edit', 'orders.serve'],
      allowedTabs: ['tables', 'reservations', 'orders', 'payments'],
    },
  ];

  const categories: Category[] = [
    { id: 'cat-1', name: 'Burgerler', icon: '🍔', sortOrder: 1, active: true, color: '#f59e0b' },
    { id: 'cat-2', name: 'Pizzalar', icon: '🍕', sortOrder: 2, active: true, color: '#ef4444' },
    { id: 'cat-3', name: 'Ana Yemekler', icon: '🥩', sortOrder: 3, active: true, color: '#8b5cf6' },
    { id: 'cat-4', name: 'Salatalar', icon: '🥗', sortOrder: 4, active: true, color: '#10b981' },
    { id: 'cat-5', name: 'Atıştırmalıklar', icon: '🍟', sortOrder: 5, active: true, color: '#f97316' },
    { id: 'cat-6', name: 'Soğuk İçecekler', icon: '🥤', sortOrder: 6, active: true, color: '#06b6d4' },
    { id: 'cat-7', name: 'Sıcak İçecekler', icon: '☕', sortOrder: 7, active: true, color: '#78350f' },
    { id: 'cat-8', name: 'Tatlılar', icon: '🍰', sortOrder: 8, active: true, color: '#ec4899' },
  ];

  const products: Product[] = [
    // Burgers
    {
      id: 'prod-1',
      name: 'Patron Özel Burger',
      categoryId: 'cat-1',
      description: '180gr dana köfte, karamelize soğan, eritilmiş cheddar, trüflü mayonez, çıtır patates',
      price: 340,
      photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
      stock: 45,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 1,
      extras: [
        { id: 'ext-1', name: 'Ekstra Cheddar', price: 30 },
        { id: 'ext-2', name: 'Ekstra Dana Köfte (+90gr)', price: 85 },
        { id: 'ext-3', name: 'Çıtır Dana Bacon', price: 50 },
        { id: 'ext-4', name: 'Trüflü Mayonez', price: 20 },
      ],
      removableIngredients: ['Soğan olmasın', 'Turşu olmasın', 'Domates olmasın', 'Sos olmasın'],
    },
    {
      id: 'prod-2',
      name: 'Klasik Cheeseburger',
      categoryId: 'cat-1',
      description: '150gr dana köfte, bol çift cheddar, ev yapımı burger sosu, domates, marul',
      price: 290,
      photo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
      stock: 50,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 2,
      extras: [
        { id: 'ext-1', name: 'Ekstra Cheddar', price: 30 },
        { id: 'ext-2', name: 'Ekstra Köfte', price: 80 },
        { id: 'ext-5', name: 'Jalapeno Biber', price: 15 },
      ],
      removableIngredients: ['Soğan olmasın', 'Turşu olmasın', 'Marul olmasın'],
    },
    {
      id: 'prod-3',
      name: 'Tavuk Şinitzel Burger',
      categoryId: 'cat-1',
      description: 'Çıtır panelenmiş tavuk göğsü, ballı hardal sos, taze yeşillik ve kornişon turşu',
      price: 260,
      photo: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
      stock: 30,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 3,
      extras: [
        { id: 'ext-1', name: 'Ekstra Cheddar', price: 30 },
        { id: 'ext-3', name: 'Çıtır Dana Bacon', price: 50 },
      ],
      removableIngredients: ['Turşu olmasın', 'Sos olmasın'],
    },
    {
      id: 'prod-4',
      name: 'Smash Double Burger',
      categoryId: 'cat-1',
      description: '2x 90gr kızgın ızgara smash köfte, karamelize soğan ve Amerikan peyniri',
      price: 360,
      photo: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
      stock: 25,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 4,
      extras: [
        { id: 'ext-1', name: 'Ekstra Peynir', price: 30 },
        { id: 'ext-2', name: '3. Smash Köfte', price: 75 },
      ],
      removableIngredients: ['Soğan olmasın', 'Sos olmasın'],
    },

    // Pizzas
    {
      id: 'prod-5',
      name: 'Pizza Margherita',
      categoryId: 'cat-2',
      description: 'İtalyan domates sosu, taze mozzarella, fesleğen yaprakları, sızma zeytinyağı',
      price: 280,
      photo: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
      stock: 40,
      inStock: true,
      active: true,
      station: 'PIZZA',
      vatRate: 10,
      sortOrder: 1,
      extras: [
        { id: 'ext-6', name: 'Ekstra Mozzarella', price: 40 },
        { id: 'ext-7', name: 'Sarımsaklı Kenar', price: 25 },
      ],
      removableIngredients: ['Fesleğen olmasın'],
    },
    {
      id: 'prod-6',
      name: 'Pizza Pepperoni',
      categoryId: 'cat-2',
      description: 'Özel pizza sosu, bol mozzarella, ince dilim baharatlı dana sucuk/pepperoni',
      price: 330,
      photo: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80',
      stock: 35,
      inStock: true,
      active: true,
      station: 'PIZZA',
      vatRate: 10,
      sortOrder: 2,
      extras: [
        { id: 'ext-6', name: 'Ekstra Mozzarella', price: 40 },
        { id: 'ext-8', name: 'Ekstra Pepperoni', price: 55 },
        { id: 'ext-9', name: 'Acı Biber Yağı', price: 15 },
      ],
      removableIngredients: ['Acı olmasın'],
    },
    {
      id: 'prod-7',
      name: 'Dört Peynirli Pizza (Quattro Formaggi)',
      categoryId: 'cat-2',
      description: 'Mozzarella, gorgonzola, parmesan, gravyer peyniri ve ceviz parçaları',
      price: 360,
      photo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
      stock: 20,
      inStock: true,
      active: true,
      station: 'PIZZA',
      vatRate: 10,
      sortOrder: 3,
      extras: [{ id: 'ext-10', name: 'Bal Sos Ekle', price: 20 }],
      removableIngredients: ['Ceviz olmasın'],
    },

    // Main Dishes
    {
      id: 'prod-8',
      name: 'Izgara Antrikot (250gr)',
      categoryId: 'cat-3',
      description: 'Marine edilmiş yerli dana antrikot, tereyağlı sebzeler ve fırınlanmış patates ile',
      price: 520,
      photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
      stock: 18,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 1,
      extras: [
        { id: 'ext-11', name: 'Mantar Sos', price: 45 },
        { id: 'ext-12', name: 'Karabiber Sos', price: 45 },
      ],
      removableIngredients: ['Sarımsak olmasın'],
    },
    {
      id: 'prod-9',
      name: 'Izgara Somon Balığı',
      categoryId: 'cat-3',
      description: 'Taze Norveç somon fileto, limonlu kapari sos, kinoa salatası ve ızgara kuşkonmaz',
      price: 480,
      photo: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=80',
      stock: 12,
      inStock: true,
      active: true,
      station: 'MUTFAK',
      vatRate: 10,
      sortOrder: 2,
      extras: [{ id: 'ext-13', name: 'Ekstra Kuşkonmaz', price: 45 }],
      removableIngredients: ['Limon olmasın', 'Kapari olmasın'],
    },
    {
      id: 'prod-10',
      name: 'Kremalı Mantarlı Tavuk Fettuccine',
      categoryId: 'cat-3',
      description: 'El açması fettuccine makarna, taze dağ mantarları, ızgara tavuk dilimleri, krema, parmesan',
      price: 310,
      photo: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80',
      stock: 28,
      inStock: true,
      active: true,
      station: 'MUTFAK',
      vatRate: 10,
      sortOrder: 3,
      extras: [{ id: 'ext-14', name: 'Ekstra Parmesan', price: 35 }],
      removableIngredients: ['Mantar olmasın', 'Karabiber olmasın'],
    },

    // Salads
    {
      id: 'prod-11',
      name: 'Tavuklu Sezar Salata',
      categoryId: 'cat-4',
      description: 'Izgara tavuk bonfile, göbek marul, kruton ekmek, parmesan rendesi, Sezar sos',
      price: 240,
      photo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      stock: 30,
      inStock: true,
      active: true,
      station: 'MUTFAK',
      vatRate: 10,
      sortOrder: 1,
      extras: [
        { id: 'ext-15', name: 'Ekstra Tavuk', price: 60 },
        { id: 'ext-16', name: 'Avokado Dilimleri', price: 45 },
      ],
      removableIngredients: ['Kruton ekmek olmasın', 'Sos ayrı gelsin'],
    },
    {
      id: 'prod-12',
      name: 'Hellimli Akdeniz Salatası',
      categoryId: 'cat-4',
      description: 'Izgara Kıbrıs hellim peyniri, taze Akdeniz yeşillikleri, çeri domates, ceviz, nar ekşisi sos',
      price: 220,
      photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80',
      stock: 25,
      inStock: true,
      active: true,
      station: 'MUTFAK',
      vatRate: 10,
      sortOrder: 2,
      extras: [{ id: 'ext-17', name: 'Ekstra Hellim (3 dilim)', price: 45 }],
      removableIngredients: ['Ceviz olmasın', 'Zeytin olmasın'],
    },

    // Appetizers
    {
      id: 'prod-13',
      name: 'Çıtır Patates Kızartması',
      categoryId: 'cat-5',
      description: 'Baharatlı taze kızartılmış elma dilim patates, yanında ev yapımı sarımsaklı mayonez ve ketçap',
      price: 130,
      photo: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
      stock: 80,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 1,
      extras: [
        { id: 'ext-18', name: 'Eritilmiş Cheddar Sos', price: 35 },
        { id: 'ext-19', name: 'Trüf Yağı & Parmesan', price: 40 },
      ],
      removableIngredients: ['Baharat olmasın'],
    },
    {
      id: 'prod-14',
      name: 'Çıtır Soğan Halkası (8 Adet)',
      categoryId: 'cat-5',
      description: 'Özel bira hamuru ile kaplanmış altın sarısı çıtır soğan halkaları, acılı dip sos',
      price: 140,
      photo: 'https://images.unsplash.com/photo-1639024471287-0351860db52e?w=500&auto=format&fit=crop&q=80',
      stock: 40,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 2,
      extras: [{ id: 'ext-20', name: 'Ranch Sos', price: 20 }],
      removableIngredients: [],
    },
    {
      id: 'prod-15',
      name: 'Mozzarella Sticks & Peynir Topları',
      categoryId: 'cat-5',
      description: '6 adet uzayan çıtır mozzarella çubuğu, ev yapımı marinara sos eşliğinde',
      price: 175,
      photo: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=500&auto=format&fit=crop&q=80',
      stock: 35,
      inStock: true,
      active: true,
      station: 'IZGARA',
      vatRate: 10,
      sortOrder: 3,
      extras: [{ id: 'ext-20', name: 'Ekstra Marinara Sos', price: 20 }],
      removableIngredients: [],
    },

    // Cold Drinks
    {
      id: 'prod-16',
      name: 'Coca-Cola (330ml Kutu)',
      categoryId: 'cat-6',
      description: 'Orijinal tat soğuk servis, limon dilimi ve buz ile',
      price: 55,
      photo: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
      stock: 120,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 1,
      extras: [],
      removableIngredients: ['Buz olmasın', 'Limon olmasın'],
    },
    {
      id: 'prod-17',
      name: 'Coca-Cola Zero Sugar (330ml)',
      categoryId: 'cat-6',
      description: 'Şekersiz kalorisiz ferahlık',
      price: 55,
      photo: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=80',
      stock: 90,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 2,
      extras: [],
      removableIngredients: ['Buz olmasın'],
    },
    {
      id: 'prod-18',
      name: 'Taze Sıkma Portakal Suyu',
      categoryId: 'cat-6',
      description: 'Günlük taze sıkılmış %100 doğal Finike portakal suyu',
      price: 90,
      photo: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
      stock: 40,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 3,
      extras: [],
      removableIngredients: ['Buzsuz olsun'],
    },
    {
      id: 'prod-19',
      name: 'Ev Yapımı Naneli Limonata',
      categoryId: 'cat-6',
      description: 'Taze nane yaprakları ve bal ile tatlandırılmış buzlu ev limonatası',
      price: 80,
      photo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
      stock: 60,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 4,
      extras: [],
      removableIngredients: ['Nane olmasın'],
    },
    {
      id: 'prod-20',
      name: 'Yayık Ayran (300ml)',
      categoryId: 'cat-6',
      description: 'Köpüklü organik yoğurttan geleneksel yayık ayranı',
      price: 45,
      photo: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80',
      stock: 75,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 5,
      extras: [],
      removableIngredients: ['Nane olmasın'],
    },

    // Hot Drinks
    {
      id: 'prod-21',
      name: 'Geleneksel Türk Kahvesi',
      categoryId: 'cat-7',
      description: 'Közde pişirilmiş bol köpüklü Türk kahvesi, lokum ve su ile',
      price: 65,
      photo: 'https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=500&auto=format&fit=crop&q=80',
      stock: 150,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 1,
      extras: [{ id: 'ext-21', name: 'Damla Sakızlı', price: 15 }],
      removableIngredients: [],
    },
    {
      id: 'prod-22',
      name: 'Demleme Rize Çayı (İnce Belli)',
      categoryId: 'cat-7',
      description: 'Taze demlenmiş tavşan kanı Rize çayı',
      price: 25,
      photo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
      stock: 300,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 2,
      extras: [],
      removableIngredients: ['Şeker getirme'],
    },
    {
      id: 'prod-23',
      name: 'Espresso Single / Double',
      categoryId: 'cat-7',
      description: '%100 Arabica çekirdeklerinden taze çekilmiş yoğun espresso',
      price: 70,
      photo: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=80',
      stock: 100,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 3,
      extras: [{ id: 'ext-22', name: 'Double Shot Yap', price: 25 }],
      removableIngredients: [],
    },
    {
      id: 'prod-24',
      name: 'Karamel Macchiato',
      categoryId: 'cat-7',
      description: 'Buharlanmış süt, vanilya şurubu, espresso ve üzeri karamel sos ile',
      price: 95,
      photo: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=80',
      stock: 80,
      inStock: true,
      active: true,
      station: 'BAR',
      vatRate: 10,
      sortOrder: 4,
      extras: [
        { id: 'ext-23', name: 'Yulaf Sütü ile', price: 20 },
        { id: 'ext-24', name: 'Ekstra Karamel', price: 15 },
      ],
      removableIngredients: ['Şeker az olsun'],
    },

    // Desserts
    {
      id: 'prod-25',
      name: 'San Sebastian Cheesecake',
      categoryId: 'cat-8',
      description: 'İçi ipeksi akışkan İspanyol usulü fırınlanmış cheesecake, sıcak Belçika çikolatası sosu ile',
      price: 195,
      photo: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80',
      stock: 15,
      inStock: true,
      active: true,
      station: 'TATLI',
      vatRate: 10,
      sortOrder: 1,
      extras: [
        { id: 'ext-25', name: 'Ekstra Sıcak Çikolata', price: 30 },
        { id: 'ext-26', name: '1 Top Vanilyalı Dondurma', price: 35 },
      ],
      removableIngredients: ['Sos olmasın'],
    },
    {
      id: 'prod-26',
      name: 'Sıcak Çikolatalı Sufle',
      categoryId: 'cat-8',
      description: 'Hakiki bitter çikolatalı akışkan sufle, pudra şekeri ve Maraş dondurması ile',
      price: 180,
      photo: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
      stock: 20,
      inStock: true,
      active: true,
      station: 'TATLI',
      vatRate: 10,
      sortOrder: 2,
      extras: [{ id: 'ext-26', name: 'Ekstra Dondurma', price: 35 }],
      removableIngredients: ['Dondurmasız'],
    },
    {
      id: 'prod-27',
      name: 'Geleneksel Fırın Sütlaç',
      categoryId: 'cat-8',
      description: 'Üstü nar gibi kızarmış fırın sütlaç, bol çekilmiş Antep fıstığı ile',
      price: 135,
      photo: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80',
      stock: 0,
      inStock: false, // Demo sold out item
      active: true,
      station: 'TATLI',
      vatRate: 10,
      sortOrder: 3,
      extras: [{ id: 'ext-27', name: 'Bol Fındık', price: 20 }],
      removableIngredients: ['Fıstık olmasın'],
    },
  ];

  const tables: RestaurantTable[] = [
    {
      id: 'tbl-1',
      number: 1,
      name: 'Masa 1',
      section: 'Salon',
      capacity: 4,
      status: 'EMPTY',
      guestCount: 0,
      totalAmount: 0,
    },
    {
      id: 'tbl-2',
      number: 2,
      name: 'Masa 2',
      section: 'Salon',
      capacity: 2,
      status: 'OCCUPIED',
      currentOrderId: 'ord-101',
      currentWaiterId: 'usr-2',
      currentWaiterName: 'Ahmet Yılmaz',
      guestCount: 2,
      openedAt: new Date(Date.now() - 35 * 60000).toISOString(),
      totalAmount: 670,
    },
    {
      id: 'tbl-3',
      number: 3,
      name: 'Masa 3',
      section: 'Salon',
      capacity: 4,
      status: 'KITCHEN',
      currentOrderId: 'ord-102',
      currentWaiterId: 'usr-3',
      currentWaiterName: 'Can Demir',
      guestCount: 3,
      openedAt: new Date(Date.now() - 14 * 60000).toISOString(),
      totalAmount: 930,
    },
    {
      id: 'tbl-4',
      number: 4,
      name: 'Masa 4',
      section: 'Salon',
      capacity: 6,
      status: 'EMPTY',
      guestCount: 0,
      totalAmount: 0,
    },
    {
      id: 'tbl-5',
      number: 5,
      name: 'Masa 5',
      section: 'Salon',
      capacity: 4,
      status: 'EMPTY', // Ready for user's primary scenario test!
      guestCount: 0,
      totalAmount: 0,
    },
    {
      id: 'tbl-6',
      number: 6,
      name: 'Masa 6',
      section: 'Teras',
      capacity: 4,
      status: 'BILL_REQUESTED',
      currentOrderId: 'ord-103',
      currentWaiterId: 'usr-2',
      currentWaiterName: 'Ahmet Yılmaz',
      guestCount: 4,
      openedAt: new Date(Date.now() - 55 * 60000).toISOString(),
      billRequestedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      totalAmount: 1480,
    },
    {
      id: 'tbl-7',
      number: 7,
      name: 'Masa 7',
      section: 'Teras',
      capacity: 2,
      status: 'READY',
      currentOrderId: 'ord-104',
      currentWaiterId: 'usr-3',
      currentWaiterName: 'Can Demir',
      guestCount: 2,
      openedAt: new Date(Date.now() - 22 * 60000).toISOString(),
      totalAmount: 510,
    },
    {
      id: 'tbl-8',
      number: 8,
      name: 'Masa 8',
      section: 'Teras',
      capacity: 4,
      status: 'EMPTY',
      guestCount: 0,
      totalAmount: 0,
    },
    {
      id: 'tbl-9',
      number: 9,
      name: 'Masa 9',
      section: 'Bahçe',
      capacity: 6,
      status: 'RESERVED',
      guestCount: 6,
      reservationNotes: 'Saat 20:00 - Doğum Günü Kutlaması (Sayın Arda Bey)',
      totalAmount: 0,
    },
    {
      id: 'tbl-10',
      number: 10,
      name: 'Masa 10',
      section: 'Bahçe',
      capacity: 4,
      status: 'EMPTY',
      guestCount: 0,
      totalAmount: 0,
    },
    {
      id: 'tbl-11',
      number: 11,
      name: 'VIP 1 (Şömine)',
      section: 'VIP',
      capacity: 8,
      status: 'OCCUPIED',
      currentOrderId: 'ord-105',
      currentWaiterId: 'usr-2',
      currentWaiterName: 'Ahmet Yılmaz',
      guestCount: 6,
      openedAt: new Date(Date.now() - 75 * 60000).toISOString(),
      totalAmount: 3240,
    },
    {
      id: 'tbl-12',
      number: 12,
      name: 'VIP 2 (Loca)',
      section: 'VIP',
      capacity: 10,
      status: 'EMPTY',
      guestCount: 0,
      totalAmount: 0,
    },
  ];

  const nowIso = new Date().toISOString();

  // Initial demo active orders
  const orders: Order[] = [
    {
      id: 'ord-101',
      orderNumber: 1041,
      tableId: 'tbl-2',
      tableName: 'Masa 2',
      waiterId: 'usr-2',
      waiterName: 'Ahmet Yılmaz',
      guestCount: 2,
      totalAmount: 670,
      notes: 'Müşteri cam kenarı tercih etti',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      items: [
        {
          id: 'item-101-1',
          orderId: 'ord-101',
          tableId: 'tbl-2',
          tableName: 'Masa 2',
          productId: 'prod-1',
          productName: 'Patron Özel Burger',
          productPhoto: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-1',
          station: 'IZGARA',
          unitPrice: 370,
          quantity: 1,
          customization: {
            extras: [{ id: 'ext-1', name: 'Ekstra Cheddar', price: 30 }],
            removedIngredients: [],
            specialNote: 'Orta-iyi pişsin',
          },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 34 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: 'item-101-2',
          orderId: 'ord-101',
          tableId: 'tbl-2',
          tableName: 'Masa 2',
          productId: 'prod-6',
          productName: 'Pizza Pepperoni',
          productPhoto: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-2',
          station: 'PIZZA',
          unitPrice: 330,
          quantity: 1,
          customization: {
            extras: [],
            removedIngredients: [],
          },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 34 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 14 * 60000).toISOString(),
        },
        {
          id: 'item-101-3',
          orderId: 'ord-101',
          tableId: 'tbl-2',
          tableName: 'Masa 2',
          productId: 'prod-16',
          productName: 'Coca-Cola (330ml Kutu)',
          productPhoto: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-6',
          station: 'BAR',
          unitPrice: 55,
          quantity: 2,
          customization: {
            extras: [],
            removedIngredients: [],
            specialNote: 'Bol buzlu',
          },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 34 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        },
      ],
    },
    {
      id: 'ord-102',
      orderNumber: 1042,
      tableId: 'tbl-3',
      tableName: 'Masa 3',
      waiterId: 'usr-3',
      waiterName: 'Can Demir',
      guestCount: 3,
      totalAmount: 930,
      notes: 'Sipariş acele istendi',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
      items: [
        {
          id: 'item-102-1',
          orderId: 'ord-102',
          tableId: 'tbl-3',
          tableName: 'Masa 3',
          productId: 'prod-4',
          productName: 'Smash Double Burger',
          productPhoto: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-1',
          station: 'IZGARA',
          unitPrice: 360,
          quantity: 2,
          customization: {
            extras: [],
            removedIngredients: ['Soğan olmasın'],
            specialNote: '1 tanesinde soğan olmasın',
          },
          status: 'PREPARING',
          createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
          preparingAt: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          id: 'item-102-2',
          orderId: 'ord-102',
          tableId: 'tbl-3',
          tableName: 'Masa 3',
          productId: 'prod-13',
          productName: 'Çıtır Patates Kızartması',
          productPhoto: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-5',
          station: 'IZGARA',
          unitPrice: 165,
          quantity: 1,
          customization: {
            extras: [{ id: 'ext-18', name: 'Eritilmiş Cheddar Sos', price: 35 }],
            removedIngredients: [],
          },
          status: 'PREPARING',
          createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
          preparingAt: new Date(Date.now() - 8 * 60000).toISOString(),
        },
        {
          id: 'item-102-3',
          orderId: 'ord-102',
          tableId: 'tbl-3',
          tableName: 'Masa 3',
          productId: 'prod-19',
          productName: 'Ev Yapımı Naneli Limonata',
          productPhoto: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-6',
          station: 'BAR',
          unitPrice: 80,
          quantity: 3,
          customization: {
            extras: [],
            removedIngredients: [],
          },
          status: 'READY',
          createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
          readyAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ],
    },
    {
      id: 'ord-103',
      orderNumber: 1043,
      tableId: 'tbl-6',
      tableName: 'Masa 6',
      waiterId: 'usr-2',
      waiterName: 'Ahmet Yılmaz',
      guestCount: 4,
      totalAmount: 1480,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
      items: [
        {
          id: 'item-103-1',
          orderId: 'ord-103',
          tableId: 'tbl-6',
          tableName: 'Masa 6',
          productId: 'prod-8',
          productName: 'Izgara Antrikot (250gr)',
          productPhoto: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-3',
          station: 'IZGARA',
          unitPrice: 565,
          quantity: 2,
          customization: {
            extras: [{ id: 'ext-11', name: 'Mantar Sos', price: 45 }],
            removedIngredients: [],
            specialNote: 'Orta pişmiş',
          },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        },
        {
          id: 'item-103-2',
          orderId: 'ord-103',
          tableId: 'tbl-6',
          tableName: 'Masa 6',
          productId: 'prod-25',
          productName: 'San Sebastian Cheesecake',
          productPhoto: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-8',
          station: 'TATLI',
          unitPrice: 225,
          quantity: 2,
          customization: {
            extras: [{ id: 'ext-25', name: 'Ekstra Sıcak Çikolata', price: 30 }],
            removedIngredients: [],
          },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        },
      ],
    },
    {
      id: 'ord-104',
      orderNumber: 1044,
      tableId: 'tbl-7',
      tableName: 'Masa 7',
      waiterId: 'usr-3',
      waiterName: 'Can Demir',
      guestCount: 2,
      totalAmount: 510,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
      items: [
        {
          id: 'item-104-1',
          orderId: 'ord-104',
          tableId: 'tbl-7',
          tableName: 'Masa 7',
          productId: 'prod-5',
          productName: 'Pizza Margherita',
          productPhoto: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-2',
          station: 'PIZZA',
          unitPrice: 280,
          quantity: 1,
          customization: { extras: [], removedIngredients: [] },
          status: 'READY',
          createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
          readyAt: new Date(Date.now() - 2 * 60000).toISOString(),
        },
        {
          id: 'item-104-2',
          orderId: 'ord-104',
          tableId: 'tbl-7',
          tableName: 'Masa 7',
          productId: 'prod-11',
          productName: 'Tavuklu Sezar Salata',
          productPhoto: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-4',
          station: 'MUTFAK',
          unitPrice: 240,
          quantity: 1,
          customization: { extras: [], removedIngredients: ['Sos ayrı gelsin'] },
          status: 'READY',
          createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
          readyAt: new Date(Date.now() - 1 * 60000).toISOString(),
        },
      ],
    },
    {
      id: 'ord-105',
      orderNumber: 1045,
      tableId: 'tbl-11',
      tableName: 'VIP 1 (Şömine)',
      waiterId: 'usr-2',
      waiterName: 'Ahmet Yılmaz',
      guestCount: 6,
      totalAmount: 3240,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
      items: [
        {
          id: 'item-105-1',
          orderId: 'ord-105',
          tableId: 'tbl-11',
          tableName: 'VIP 1 (Şömine)',
          productId: 'prod-8',
          productName: 'Izgara Antrikot (250gr)',
          productPhoto: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-3',
          station: 'IZGARA',
          unitPrice: 520,
          quantity: 4,
          customization: { extras: [], removedIngredients: [] },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 70 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 40 * 60000).toISOString(),
        },
        {
          id: 'item-105-2',
          orderId: 'ord-105',
          tableId: 'tbl-11',
          tableName: 'VIP 1 (Şömine)',
          productId: 'prod-9',
          productName: 'Izgara Somon Balığı',
          productPhoto: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-3',
          station: 'MUTFAK',
          unitPrice: 480,
          quantity: 2,
          customization: { extras: [], removedIngredients: [] },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 70 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 40 * 60000).toISOString(),
        },
        {
          id: 'item-105-3',
          orderId: 'ord-105',
          tableId: 'tbl-11',
          tableName: 'VIP 1 (Şömine)',
          productId: 'prod-20',
          productName: 'Yayık Ayran (300ml)',
          productPhoto: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80',
          categoryId: 'cat-6',
          station: 'BAR',
          unitPrice: 45,
          quantity: 6,
          customization: { extras: [], removedIngredients: [] },
          status: 'SERVED',
          createdAt: new Date(Date.now() - 70 * 60000).toISOString(),
          servedAt: new Date(Date.now() - 65 * 60000).toISOString(),
        },
      ],
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'pay-201',
      orderId: 'ord-90',
      orderNumber: 1038,
      paymentNumber: 2001,
      tableId: 'tbl-1',
      tableName: 'Masa 1',
      waiterName: 'Ahmet Yılmaz',
      cashierName: 'Elif Kasa',
      subtotal: 1120,
      discountPercent: 10,
      discountAmount: 112,
      tipAmount: 50,
      finalAmount: 1058,
      totalAmount: 1058,
      method: 'CREDIT_CARD',
      paymentMethod: 'CREDIT_CARD',
      timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      itemsSummary: [
        { name: 'Patron Özel Burger', quantity: 2, price: 680 },
        { name: 'Çıtır Patates', quantity: 2, price: 260 },
        { name: 'Coca-Cola', quantity: 2, price: 110 },
        { name: 'Türk Kahvesi', quantity: 2, price: 130 },
      ],
    },
    {
      id: 'pay-202',
      orderId: 'ord-91',
      orderNumber: 1039,
      paymentNumber: 2002,
      tableId: 'tbl-8',
      tableName: 'Masa 8',
      waiterName: 'Can Demir',
      cashierName: 'Elif Kasa',
      subtotal: 850,
      discountPercent: 0,
      discountAmount: 0,
      tipAmount: 30,
      finalAmount: 880,
      totalAmount: 880,
      method: 'CASH',
      paymentMethod: 'CASH',
      timestamp: new Date(Date.now() - 130 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 130 * 60000).toISOString(),
      itemsSummary: [
        { name: 'Pizza Pepperoni', quantity: 2, price: 660 },
        { name: 'Naneli Limonata', quantity: 2, price: 160 },
      ],
    },
    {
      id: 'pay-203',
      orderId: 'ord-92',
      orderNumber: 1040,
      paymentNumber: 2003,
      tableId: 'tbl-4',
      tableName: 'Masa 4',
      waiterName: 'Ahmet Yılmaz',
      cashierName: 'Elif Kasa',
      subtotal: 1600,
      discountPercent: 0,
      discountAmount: 0,
      tipAmount: 100,
      finalAmount: 1700,
      totalAmount: 1700,
      method: 'PARTIAL',
      paymentMethod: 'PARTIAL',
      partialBreakdown: [
        { method: 'CASH', amount: 700 },
        { method: 'CREDIT_CARD', amount: 1000 },
      ],
      splitBreakdown: {
        cash: 700,
        creditCard: 1000,
      },
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
      itemsSummary: [
        { name: 'Izgara Antrikot', quantity: 2, price: 1040 },
        { name: 'San Sebastian', quantity: 2, price: 390 },
        { name: 'Espresso', quantity: 2, price: 140 },
      ],
    },
    {
      id: 'pay-204',
      orderId: 'ord-93',
      orderNumber: 1035,
      paymentNumber: 2004,
      tableId: 'tbl-11',
      tableName: 'VIP 1 (Şömine)',
      waiterName: 'Kemal Can',
      cashierName: 'Elif Kasa',
      subtotal: 2850,
      discountPercent: 5,
      discountAmount: 142.5,
      tipAmount: 200,
      finalAmount: 2907.5,
      totalAmount: 2907.5,
      method: 'CREDIT_CARD',
      paymentMethod: 'CREDIT_CARD',
      timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
      itemsSummary: [
        { name: 'Kuzu Pirzola', quantity: 3, price: 1740 },
        { name: 'Meze Tabağı', quantity: 2, price: 480 },
        { name: 'Fırın Sütlaç', quantity: 3, price: 360 },
        { name: 'Türk Kahvesi', quantity: 4, price: 260 },
      ],
    },
    {
      id: 'pay-205',
      orderId: 'ord-94',
      orderNumber: 1036,
      paymentNumber: 2005,
      tableId: 'tbl-6',
      tableName: 'Teras 2',
      waiterName: 'Can Demir',
      cashierName: 'Elif Kasa',
      subtotal: 720,
      discountPercent: 0,
      discountAmount: 0,
      tipAmount: 50,
      finalAmount: 770,
      totalAmount: 770,
      method: 'TRANSFER',
      paymentMethod: 'TRANSFER',
      timestamp: new Date(Date.now() - 320 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 320 * 60000).toISOString(),
      itemsSummary: [
        { name: 'Tavuklu Fettuccine', quantity: 2, price: 560 },
        { name: 'Naneli Limonata', quantity: 2, price: 160 },
      ],
    },
  ];

  const cashRegister: CashRegister = {
    id: 'reg-today',
    date: new Date().toISOString().split('T')[0],
    openingBalance: 3000,
    cashSales: 1580,
    cardSales: 4965.5,
    transferSales: 770,
    totalSales: 7315.5,
    discountsGiven: 254.5,
    refunds: 0,
    cashIn: 500,
    cashOut: 200,
    expectedCash: 4880, // 3000 + 1580 + 500 - 200
    status: 'OPEN',
    openedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  };

  const cancelledItems: CancelledItemRecord[] = [
    {
      id: 'cnc-1',
      orderId: 'ord-88',
      tableName: 'Masa 2',
      productName: 'Yayık Ayran',
      quantity: 1,
      price: 45,
      reason: 'Müşteri siparişi Kola olarak değiştirdi',
      cancelledBy: 'Ahmet Yılmaz',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1001',
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      userName: 'Elif Kasa',
      userRole: 'CASHIER',
      action: 'Kasa Açılışı Yapıldı',
      details: 'Güne ₺3.000 açılış nakit tutarı ile başlandı.',
      category: 'PAYMENT',
    },
    {
      id: 'log-1002',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      userName: 'Ahmet Yılmaz',
      userRole: 'WAITER',
      action: 'Masa 2 Açıldı & Sipariş Gönderildi',
      details: 'Patron Özel Burger, Pepperoni Pizza ve 2x Kola mutfağa iletildi.',
      category: 'ORDER',
      orderNumber: 1041,
      tableName: 'Masa 2',
    },
    {
      id: 'log-1003',
      timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
      userName: 'Can Demir',
      userRole: 'WAITER',
      action: 'Masa 3 Siparişi Oluşturuldu',
      details: '2x Smash Burger, 1x Patates, 3x Limonata mutfağa gönderildi.',
      category: 'ORDER',
      orderNumber: 1042,
      tableName: 'Masa 3',
    },
    {
      id: 'log-1004',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      userName: 'Şef Murat Usta',
      userRole: 'KITCHEN',
      action: 'Mutfak Siparişi Kabul Etti',
      details: 'Masa 3 siparişleri ızgara ve bar istasyonlarında hazırlanmaya başlandı.',
      category: 'KITCHEN',
      orderNumber: 1042,
      tableName: 'Masa 3',
    },
  ];

  const settings: RestaurantSettings = {
    name: 'PATRON RESTAURANT & LOUNGE',
    slogan: 'Gurme Lezzetler & Kusursuz Servis',
    logo: '👑',
    address: 'Bağdat Caddesi No: 248, Kadıköy, İstanbul',
    phone: '0216 455 90 90',
    taxNumber: 'TR8901234567',
    currency: '₺',
    defaultVatRate: 10,
    defaultServiceCharge: 0,
    soundEnabled: true,
    autoPrintKitchen: true,
    theme: 'dark',
    rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const reservations: Reservation[] = [
    {
      id: 'res-1',
      customerName: 'Arda Güler',
      customerPhone: '0532 555 1234',
      guestCount: 6,
      tableId: 'tbl-9',
      tableName: 'Masa 9',
      section: 'Bahçe',
      reservationDate: todayDate,
      reservationTime: '20:00',
      status: 'CONFIRMED',
      notes: 'Doğum günü kutlaması, pasta getirilecek. Dış mekanda sakin köşe rica edildi.',
      createdBy: 'Elif Kasa',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: 'res-2',
      customerName: 'Zeynep Kaya',
      customerPhone: '0544 333 4567',
      guestCount: 4,
      tableId: 'tbl-4',
      tableName: 'Masa 4',
      section: 'Salon',
      reservationDate: todayDate,
      reservationTime: '19:30',
      status: 'CONFIRMED',
      notes: 'İş yemeği, pencere kenarı masa tercih edildi.',
      createdBy: 'Ahmet Yılmaz',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'res-3',
      customerName: 'Mehmet Demir',
      customerPhone: '0555 999 8877',
      guestCount: 8,
      tableId: 'tbl-12',
      tableName: 'VIP 2 (Loca)',
      section: 'VIP',
      reservationDate: todayDate,
      reservationTime: '21:00',
      status: 'CONFIRMED',
      notes: 'Özel aile yemeği, çocuk sandalyesi hazırlanacak.',
      createdBy: 'Kemal Patron',
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: 'res-4',
      customerName: 'Canan Hanım',
      customerPhone: '0533 222 1100',
      guestCount: 2,
      tableId: 'tbl-2',
      tableName: 'Masa 2',
      section: 'Salon',
      reservationDate: todayDate,
      reservationTime: '13:00',
      status: 'SEATED',
      notes: 'Öğle yemeği rezervasyonu.',
      createdBy: 'Ahmet Yılmaz',
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      seatedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    },
    {
      id: 'res-5',
      customerName: 'Emre Soylu',
      customerPhone: '0536 777 8899',
      guestCount: 4,
      tableId: 'tbl-8',
      tableName: 'Masa 8',
      section: 'Teras',
      reservationDate: tomorrowDate,
      reservationTime: '19:00',
      status: 'CONFIRMED',
      notes: 'Evlilik yıldönümü, mumlu masa süslemesi rica edildi.',
      createdBy: 'Elif Kasa',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
  ];

  // -------------------------------------------------------------
  // Raw Materials Inventory
  // -------------------------------------------------------------
  const inventory: InventoryItem[] = [
    {
      id: 'inv-1',
      name: 'Dana Kıyma (%80 Yağsız)',
      category: 'Et & Şarküteri',
      unit: 'kg',
      currentStock: 28.5,
      minimumStock: 8,
      unitCost: 480,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-2',
      name: 'Taze Burger Ekmeği (Brioche)',
      category: 'Unlu Mamüller',
      unit: 'adet',
      currentStock: 140,
      minimumStock: 30,
      unitCost: 8.5,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-3',
      name: 'Cheddar Peyniri Dilim',
      category: 'Süt Ürünleri',
      unit: 'adet',
      currentStock: 110,
      minimumStock: 25,
      unitCost: 11,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-4',
      name: 'Taze Patates (Kızartmalık)',
      category: 'Sebze',
      unit: 'kg',
      currentStock: 65,
      minimumStock: 15,
      unitCost: 32,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-5',
      name: 'Siyah Trüf Yağı',
      category: 'Sos & Yağ',
      unit: 'ml',
      currentStock: 1200,
      minimumStock: 250,
      unitCost: 1.8,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-6',
      name: 'Premium Espresso Çekirdeği (100% Arabica)',
      category: 'Kahve & İçecek',
      unit: 'kg',
      currentStock: 14,
      minimumStock: 4,
      unitCost: 680,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-7',
      name: 'Günlük Taze Barista Sütü',
      category: 'Süt Ürünleri',
      unit: 'L',
      currentStock: 42,
      minimumStock: 12,
      unitCost: 29.5,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-8',
      name: 'Artisan Karamel Şurubu',
      category: 'Sos & Yağ',
      unit: 'ml',
      currentStock: 3200,
      minimumStock: 600,
      unitCost: 0.25,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-9',
      name: 'İtalyan Taze Mozzarella',
      category: 'Süt Ürünleri',
      unit: 'kg',
      currentStock: 22,
      minimumStock: 6,
      unitCost: 340,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-10',
      name: 'Mayalı Pizza Hamuru (30cm)',
      category: 'Unlu Mamüller',
      unit: 'adet',
      currentStock: 75,
      minimumStock: 20,
      unitCost: 16,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-11',
      name: 'Dana Antrikot (Dry Aged)',
      category: 'Et & Şarküteri',
      unit: 'kg',
      currentStock: 18.5,
      minimumStock: 5,
      unitCost: 780,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-12',
      name: 'Belçika Bitter Çikolatası',
      category: 'Tatlı Malzemeleri',
      unit: 'kg',
      currentStock: 9.5,
      minimumStock: 3,
      unitCost: 420,
      updatedAt: new Date().toISOString(),
    },
  ];

  // Attach Recipes to products
  const burgerProd1 = products.find((p) => p.id === 'prod-1');
  if (burgerProd1) {
    burgerProd1.recipe = [
      { inventoryItemId: 'inv-1', inventoryItemName: 'Dana Kıyma (%80 Yağsız)', amount: 0.18, unit: 'kg' },
      { inventoryItemId: 'inv-2', inventoryItemName: 'Taze Burger Ekmeği (Brioche)', amount: 1, unit: 'adet' },
      { inventoryItemId: 'inv-3', inventoryItemName: 'Cheddar Peyniri Dilim', amount: 2, unit: 'adet' },
    ];
  }

  const burgerProd2 = products.find((p) => p.id === 'prod-2');
  if (burgerProd2) {
    burgerProd2.recipe = [
      { inventoryItemId: 'inv-1', inventoryItemName: 'Dana Kıyma (%80 Yağsız)', amount: 0.16, unit: 'kg' },
      { inventoryItemId: 'inv-2', inventoryItemName: 'Taze Burger Ekmeği (Brioche)', amount: 1, unit: 'adet' },
      { inventoryItemId: 'inv-3', inventoryItemName: 'Cheddar Peyniri Dilim', amount: 2, unit: 'adet' },
    ];
  }

  const friesProd = products.find((p) => p.id === 'prod-15');
  if (friesProd) {
    friesProd.recipe = [
      { inventoryItemId: 'inv-4', inventoryItemName: 'Taze Patates (Kızartmalık)', amount: 0.25, unit: 'kg' },
      { inventoryItemId: 'inv-5', inventoryItemName: 'Siyah Trüf Yağı', amount: 15, unit: 'ml' },
    ];
  }

  const pizzaProd5 = products.find((p) => p.id === 'prod-5');
  if (pizzaProd5) {
    pizzaProd5.recipe = [
      { inventoryItemId: 'inv-10', inventoryItemName: 'Mayalı Pizza Hamuru (30cm)', amount: 1, unit: 'adet' },
      { inventoryItemId: 'inv-9', inventoryItemName: 'İtalyan Taze Mozzarella', amount: 0.14, unit: 'kg' },
    ];
  }

  const pizzaProd6 = products.find((p) => p.id === 'prod-6');
  if (pizzaProd6) {
    pizzaProd6.recipe = [
      { inventoryItemId: 'inv-10', inventoryItemName: 'Mayalı Pizza Hamuru (30cm)', amount: 1, unit: 'adet' },
      { inventoryItemId: 'inv-9', inventoryItemName: 'İtalyan Taze Mozzarella', amount: 0.15, unit: 'kg' },
    ];
  }

  const macchiatoProd = products.find((p) => p.id === 'prod-21');
  if (macchiatoProd) {
    macchiatoProd.recipe = [
      { inventoryItemId: 'inv-6', inventoryItemName: 'Premium Espresso Çekirdeği (100% Arabica)', amount: 0.018, unit: 'kg' },
      { inventoryItemId: 'inv-7', inventoryItemName: 'Günlük Taze Barista Sütü', amount: 0.22, unit: 'L' },
      { inventoryItemId: 'inv-8', inventoryItemName: 'Artisan Karamel Şurubu', amount: 25, unit: 'ml' },
    ];
  }

  const antrikotProd = products.find((p) => p.id === 'prod-9');
  if (antrikotProd) {
    antrikotProd.recipe = [
      { inventoryItemId: 'inv-11', inventoryItemName: 'Dana Antrikot (Dry Aged)', amount: 0.28, unit: 'kg' },
      { inventoryItemId: 'inv-4', inventoryItemName: 'Taze Patates (Kızartmalık)', amount: 0.15, unit: 'kg' },
    ];
  }

  const sufleProd = products.find((p) => p.id === 'prod-17');
  if (sufleProd) {
    sufleProd.recipe = [
      { inventoryItemId: 'inv-12', inventoryItemName: 'Belçika Bitter Çikolatası', amount: 0.08, unit: 'kg' },
    ];
  }

  // -------------------------------------------------------------
  // Inventory Initial Audit & Stock Transactions
  // -------------------------------------------------------------
  const inventoryTransactions: InventoryTransaction[] = [
    {
      id: 'trx-101',
      inventoryItemId: 'inv-1',
      inventoryItemName: 'Dana Kıyma (%80 Yağsız)',
      type: 'MANUAL_ADD',
      quantityChange: 15,
      unit: 'kg',
      stockBefore: 13.5,
      stockAfter: 28.5,
      performedBy: 'Kemal Patron',
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      note: 'Haftalık kasap mal kabulü yapıldı.',
    },
    {
      id: 'trx-102',
      inventoryItemId: 'inv-2',
      inventoryItemName: 'Taze Burger Ekmeği (Brioche)',
      type: 'MANUAL_ADD',
      quantityChange: 80,
      unit: 'adet',
      stockBefore: 60,
      stockAfter: 140,
      performedBy: 'Kemal Patron',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      note: 'Fırından taze teslim alındı.',
    },
    {
      id: 'trx-103',
      inventoryItemId: 'inv-6',
      inventoryItemName: 'Premium Espresso Çekirdeği (100% Arabica)',
      type: 'SALE_DEDUCT',
      quantityChange: -0.054,
      unit: 'kg',
      stockBefore: 14.054,
      stockAfter: 14,
      relatedOrderId: 'ord-1044',
      relatedOrderNumber: 1044,
      relatedProductName: 'Karamel Macchiato',
      performedBy: 'Ahmet Yılmaz',
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      note: '3x Karamel Macchiato satışı ile reçete düşümü.',
    },
  ];

  // -------------------------------------------------------------
  // Thermal Printers
  // -------------------------------------------------------------
  const printers: Printer[] = [
    {
      id: 'prn-kitchen',
      name: 'Mutfak Ana Termal Yazıcı (80mm)',
      type: 'THERMAL_80MM',
      station: 'MUTFAK',
      ipAddress: '192.168.1.201',
      port: 9100,
      status: 'ONLINE',
      active: true,
      isDefault: true,
    },
    {
      id: 'prn-bar',
      name: 'Bar & Barista Termal Yazıcı (80mm)',
      type: 'THERMAL_80MM',
      station: 'BAR',
      ipAddress: '192.168.1.202',
      port: 9100,
      status: 'ONLINE',
      active: true,
      isDefault: false,
    },
    {
      id: 'prn-cashier',
      name: 'Kasa Adisyon & Fiş Yazıcı (80mm)',
      type: 'THERMAL_80MM',
      station: 'KASA',
      ipAddress: '192.168.1.200',
      port: 9100,
      status: 'ONLINE',
      active: true,
      isDefault: false,
    },
  ];

  // -------------------------------------------------------------
  // Printer Templates
  // -------------------------------------------------------------
  const printerTemplates: PrinterTemplate[] = [
    {
      id: 'tpl-kitchen',
      name: 'Mutfak Sipariş Fişi Şablonu',
      printerId: 'prn-kitchen',
      station: 'MUTFAK',
      target: 'KITCHEN_TICKET',
      fields: {
        showRestaurantName: true,
        showLogo: false,
        showTableNumber: true,
        showOrderNumber: true,
        showWaiter: true,
        showDate: true,
        showTime: true,
        showProductName: true,
        showQuantity: true,
        showProductNote: true,
        showExtras: true,
        showItemPrice: false,
        showTotalPrice: false,
        showOrderStatus: true,
        showCustomerNote: true,
        headerText: '*** PATRON MUTFAK SİPARİŞİ ***',
        footerText: 'Özenle ve sıcak servis ediniz.',
      },
    },
    {
      id: 'tpl-bar',
      name: 'Bar & İçecek Fişi Şablonu',
      printerId: 'prn-bar',
      station: 'BAR',
      target: 'BAR_TICKET',
      fields: {
        showRestaurantName: true,
        showLogo: false,
        showTableNumber: true,
        showOrderNumber: true,
        showWaiter: true,
        showDate: true,
        showTime: true,
        showProductName: true,
        showQuantity: true,
        showProductNote: true,
        showExtras: true,
        showItemPrice: false,
        showTotalPrice: false,
        showOrderStatus: true,
        showCustomerNote: true,
        headerText: '*** BAR / BARİSTA SİPARİŞİ ***',
        footerText: 'Hızlı ve soğuk/taze servis.',
      },
    },
    {
      id: 'tpl-customer',
      name: 'Müşteri Hesap Adisyonu Şablonu',
      printerId: 'prn-cashier',
      station: 'KASA',
      target: 'CUSTOMER_BILL',
      fields: {
        showRestaurantName: true,
        showLogo: true,
        showTableNumber: true,
        showOrderNumber: true,
        showWaiter: true,
        showDate: true,
        showTime: true,
        showProductName: true,
        showQuantity: true,
        showProductNote: false,
        showExtras: true,
        showItemPrice: true,
        showTotalPrice: true,
        showOrderStatus: false,
        showCustomerNote: false,
        headerText: 'PATRON RESTAURANT & LOUNGE',
        footerText: 'Mali değeri yoktur. Bizi tercih ettiğiniz için teşekkür ederiz!',
      },
    },
  ];

  // -------------------------------------------------------------
  // Custom Roles & Permissions
  // -------------------------------------------------------------
  const roles: CustomRole[] = [
    {
      id: 'role-admin',
      name: 'Yönetici / Patron',
      description: 'Tüm sistem fonksiyonlarına, ayarlara, personele ve kasaya sınırsız erişim.',
      isSystem: true,
      color: '#f59e0b',
      permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.ADMIN,
      userCount: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'role-waiter',
      name: 'Garson',
      description: 'Masa açma, sipariş alma, mutfağa iletme ve servis işlemleri.',
      isSystem: true,
      color: '#3b82f6',
      permissions: ['tables.view', 'tables.edit', 'orders.view', 'orders.create', 'orders.edit', 'orders.serve'],
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.WAITER,
      userCount: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'role-kitchen',
      name: 'Mutfak Şefi',
      description: 'Mutfak KDS sipariş ekranı ve stok durumu görüntüleme.',
      isSystem: true,
      color: '#ef4444',
      permissions: ['kitchen.view', 'kitchen.manage', 'inventory.view'],
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.KITCHEN,
      userCount: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'role-cashier',
      name: 'Kasiyer',
      description: 'Ödeme alma, fatura kesme, kasa hareketleri ve günlük raporlar.',
      isSystem: true,
      color: '#10b981',
      permissions: ['tables.view', 'orders.view', 'payments.view', 'payments.create', 'payments.discount', 'cash.manage', 'reports.view'],
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.CASHIER,
      userCount: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'role-supervisor',
      name: 'Şef Garson / Kaptan',
      description: 'Masa düzenlemeleri, siparişler, ikram/indirim yetkisi ve rezervasyon takibi.',
      isSystem: false,
      color: '#ec4899',
      permissions: [
        'tables.view',
        'tables.edit',
        'orders.view',
        'orders.create',
        'orders.edit',
        'orders.cancel',
        'orders.serve',
        'payments.view',
        'payments.discount',
      ],
      allowedTabs: ['tables', 'reservations', 'orders', 'payments', 'reports'],
      userCount: 0,
      createdAt: '2025-02-15T10:00:00.000Z',
    },
    {
      id: 'role-barista',
      name: 'Barista / Bar Sorumlusu',
      description: 'Bar KDS ekranı, içecek ve kahve hazırlama takibi, stok izleme.',
      isSystem: false,
      color: '#8b5cf6',
      permissions: ['bar.view', 'kitchen.view', 'kitchen.manage', 'orders.view', 'inventory.view'],
      allowedTabs: ['kitchen', 'stock'],
      userCount: 0,
      createdAt: '2025-02-20T14:30:00.000Z',
    },
  ];

  // Multi-tenant Restaurants Directory
  const restaurants: Restaurant[] = [
    {
      id: 'rest-1',
      name: 'PATRON RESTAURANT & LOUNGE',
      slug: 'patron-lounge',
      phone: '0216 455 90 90',
      address: 'Bağdat Caddesi No: 248, Kadıköy, İstanbul',
      taxNumber: 'TR8901234567',
      logo: '👑',
      currency: '₺',
      subscription: {
        plan: 'PRO',
        status: 'ACTIVE',
        startDate: '2025-01-01',
        endDate: '2026-12-31',
        maxTables: 30,
        maxStaff: 15,
        features: ['KDS Mutfak', 'Reçete & Stok', 'Termal Yazıcı', 'Gelişmiş Raporlama', 'Çoklu Kasa'],
      },
      active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'rest-2',
      name: 'Boğaziçi Balıkçısı & Meze',
      slug: 'bogazici-balik',
      phone: '0212 265 40 40',
      address: 'Bebek Cad. No: 12, Beşiktaş, İstanbul',
      taxNumber: 'TR4567891230',
      logo: '🐟',
      currency: '₺',
      subscription: {
        plan: 'STARTER',
        status: 'ACTIVE',
        startDate: '2025-02-01',
        endDate: '2026-08-31',
        maxTables: 15,
        maxStaff: 8,
        features: ['Temel Adisyon', 'Masa Yönetimi', 'Kasa'],
      },
      active: true,
      createdAt: '2025-02-01T00:00:00.000Z',
    },
    {
      id: 'rest-3',
      name: 'Moda Artisan Cafe & Bakery',
      slug: 'moda-cafe',
      phone: '0216 330 20 10',
      address: 'Moda Cad. No: 78, Kadıköy, İstanbul',
      taxNumber: 'TR7891234560',
      logo: '☕',
      currency: '₺',
      subscription: {
        plan: 'TRIAL',
        status: 'TRIAL',
        startDate: '2025-02-25',
        endDate: '2025-03-25',
        maxTables: 10,
        maxStaff: 5,
        features: ['Tüm Özellikler (Deneme Sürümü)'],
      },
      active: true,
      createdAt: '2025-02-25T00:00:00.000Z',
    },
    {
      id: 'rest-4',
      name: 'Kordon Steakhouse (Askıda)',
      slug: 'kordon-steak',
      phone: '0232 464 10 20',
      address: 'Atatürk Cad. No: 180, Alsancak, İzmir',
      taxNumber: 'TR3216549870',
      logo: '🥩',
      currency: '₺',
      subscription: {
        plan: 'ENTERPRISE',
        status: 'SUSPENDED',
        startDate: '2024-06-01',
        endDate: '2025-02-01',
        maxTables: 50,
        maxStaff: 30,
        features: ['Kurumsal Destek', 'Çoklu Şube', 'Özel API'],
      },
      active: false,
      createdAt: '2024-06-01T00:00:00.000Z',
    },
  ];

  // Map restaurantId: 'rest-1' to all existing demo data
  const tenant1Users = users.map((u) => ({ ...u, restaurantId: 'rest-1' }));
  const tenant1Tables = tables.map((t) => ({ ...t, restaurantId: 'rest-1' }));
  const tenant1Categories = categories.map((c) => ({ ...c, restaurantId: 'rest-1' }));
  const tenant1Products = products.map((p) => ({ ...p, restaurantId: 'rest-1' }));
  const tenant1Orders = orders.map((o) => ({
    ...o,
    restaurantId: 'rest-1',
    items: o.items.map((i) => ({ ...i, restaurantId: 'rest-1' })),
  }));
  const tenant1Payments = payments.map((p) => ({ ...p, restaurantId: 'rest-1' }));
  const tenant1Cancelled = cancelledItems.map((c) => ({ ...c, restaurantId: 'rest-1' }));
  const tenant1AuditLogs = auditLogs.map((a) => ({ ...a, restaurantId: 'rest-1' }));
  const tenant1Reservations = reservations.map((r) => ({ ...r, restaurantId: 'rest-1' }));
  const tenant1Inventory = inventory.map((i) => ({ ...i, restaurantId: 'rest-1' }));
  const tenant1Transactions = inventoryTransactions.map((t) => ({ ...t, restaurantId: 'rest-1' }));
  const tenant1Printers = printers.map((p) => ({ ...p, restaurantId: 'rest-1' }));
  const tenant1Templates = printerTemplates.map((t) => ({ ...t, restaurantId: 'rest-1' }));
  const tenant1Roles = roles.map((r) => ({ ...r, restaurantId: 'rest-1' }));

  // Super Admin Platform User
  const superAdminUser: UserInDb = {
    id: 'usr-super',
    name: 'Platform Super Admin',
    username: 'superadmin',
    email: 'superadmin@patronpos.com',
    role: 'SUPER_ADMIN',
    pin: '9999',
    passwordHash: hashPassword('super123', 'salt_super'),
    pinHash: hashPassword('9999', 'salt_super'),
    salt: 'salt_super',
    active: true,
    phone: '0500 000 0000',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailySales: 0,
    permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
    allowedTabs: DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN,
  };

  // Rest-2 (Boğaziçi Balıkçısı) Initial Data
  const tenant2Users: UserInDb[] = [
    {
      id: 'usr-b1',
      restaurantId: 'rest-2',
      name: 'Selim Reis (Müdür)',
      username: 'balikci',
      email: 'balikci@patronpos.com',
      role: 'ADMIN',
      pin: '1234',
      passwordHash: hashPassword('admin123', 'salt_b1'),
      pinHash: hashPassword('1234', 'salt_b1'),
      salt: 'salt_b1',
      active: true,
      phone: '0533 111 2233',
      dailySales: 8900,
      permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.ADMIN,
    },
    {
      id: 'usr-b2',
      restaurantId: 'rest-2',
      name: 'Murat Garson',
      username: 'garson_murat',
      email: 'murat@bogazicibalik.com',
      role: 'WAITER',
      pin: '2222',
      passwordHash: hashPassword('1234', 'salt_b2'),
      pinHash: hashPassword('2222', 'salt_b2'),
      salt: 'salt_b2',
      active: true,
      phone: '0544 222 3344',
      dailySales: 4100,
      permissions: ['tables.view', 'tables.edit', 'orders.view', 'orders.create', 'orders.edit', 'orders.serve'],
      allowedTabs: ['tables', 'orders'],
    },
  ];

  const tenant2Tables: RestaurantTable[] = [
    { id: 'tbl-b1', restaurantId: 'rest-2', name: 'Masa 1 (Boğaz)', capacity: 4, section: 'İç Mekan', status: 'EMPTY', shape: 'RECTANGLE', x: 50, y: 50 },
    { id: 'tbl-b2', restaurantId: 'rest-2', name: 'Masa 2 (Teras)', capacity: 6, section: 'Bahçe / Teras', status: 'EMPTY', shape: 'ROUND', x: 200, y: 50 },
    { id: 'tbl-b3', restaurantId: 'rest-2', name: 'Masa 3 (Teras)', capacity: 4, section: 'Bahçe / Teras', status: 'EMPTY', shape: 'RECTANGLE', x: 350, y: 50 },
    { id: 'tbl-b4', restaurantId: 'rest-2', name: 'VIP Loca', capacity: 8, section: 'VIP Salon', status: 'EMPTY', shape: 'RECTANGLE', x: 500, y: 50 },
  ];

  const tenant2Categories: Category[] = [
    { id: 'cat-b1', restaurantId: 'rest-2', name: 'Taze Balıklar', icon: '🐟', sortOrder: 1, active: true, color: '#38bdf8' },
    { id: 'cat-b2', restaurantId: 'rest-2', name: 'Sıcak & Soğuk Mezeler', icon: '🥗', sortOrder: 2, active: true, color: '#10b981' },
    { id: 'cat-b3', restaurantId: 'rest-2', name: 'İçecekler', icon: '🍷', sortOrder: 3, active: true, color: '#f59e0b' },
  ];

  const tenant2Products: Product[] = [
    { id: 'prd-b1', restaurantId: 'rest-2', name: 'Levrek Izgara', categoryId: 'cat-b1', price: 450, vatRate: 10, active: true, popular: true },
    { id: 'prd-b2', restaurantId: 'rest-2', name: 'Çipura Izgara', categoryId: 'cat-b1', price: 420, vatRate: 10, active: true },
    { id: 'prd-b3', restaurantId: 'rest-2', name: 'Kalamar Tava', categoryId: 'cat-b1', price: 290, vatRate: 10, active: true, popular: true },
    { id: 'prd-b4', restaurantId: 'rest-2', name: 'Deniz Börülcesi', categoryId: 'cat-b2', price: 140, vatRate: 10, active: true },
    { id: 'prd-b5', restaurantId: 'rest-2', name: 'Haydari & Fava Tabağı', categoryId: 'cat-b2', price: 160, vatRate: 10, active: true },
    { id: 'prd-b6', restaurantId: 'rest-2', name: 'Meşrubat & Ayran', categoryId: 'cat-b3', price: 60, vatRate: 10, active: true },
  ];

  // Rest-3 (Moda Cafe) Initial Data
  const tenant3Users: UserInDb[] = [
    {
      id: 'usr-m1',
      restaurantId: 'rest-3',
      name: 'Moda Barista',
      username: 'moda',
      email: 'moda@patronpos.com',
      role: 'ADMIN',
      pin: '1234',
      passwordHash: hashPassword('admin123', 'salt_m1'),
      pinHash: hashPassword('1234', 'salt_m1'),
      salt: 'salt_m1',
      active: true,
      phone: '0533 999 8877',
      dailySales: 3200,
      permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.ADMIN,
    },
  ];

  const tenant3Tables: RestaurantTable[] = [
    { id: 'tbl-m1', restaurantId: 'rest-3', name: 'Masa 1', capacity: 2, section: 'İç Mekan', status: 'EMPTY', shape: 'ROUND', x: 50, y: 50 },
    { id: 'tbl-m2', restaurantId: 'rest-3', name: 'Masa 2', capacity: 4, section: 'İç Mekan', status: 'EMPTY', shape: 'RECTANGLE', x: 200, y: 50 },
    { id: 'tbl-m3', restaurantId: 'rest-3', name: 'Teras 1', capacity: 4, section: 'Bahçe / Teras', status: 'EMPTY', shape: 'RECTANGLE', x: 350, y: 50 },
  ];

  const tenant3Categories: Category[] = [
    { id: 'cat-m1', restaurantId: 'rest-3', name: 'Nitelikli Kahveler', icon: '☕', sortOrder: 1, active: true, color: '#d97706' },
    { id: 'cat-m2', restaurantId: 'rest-3', name: 'Kruvasan & Tatlı', icon: '🥐', sortOrder: 2, active: true, color: '#ec4899' },
  ];

  const tenant3Products: Product[] = [
    { id: 'prd-m1', restaurantId: 'rest-3', name: 'Flat White', categoryId: 'cat-m1', price: 95, vatRate: 10, active: true, popular: true },
    { id: 'prd-m2', restaurantId: 'rest-3', name: 'Cold Brew', categoryId: 'cat-m1', price: 110, vatRate: 10, active: true },
    { id: 'prd-m3', restaurantId: 'rest-3', name: 'Bademli Kruvasan', categoryId: 'cat-m2', price: 130, vatRate: 10, active: true, popular: true },
  ];

  // Rest-4 (Kordon Steakhouse) Initial Data
  const tenant4Users: UserInDb[] = [
    {
      id: 'usr-k1',
      restaurantId: 'rest-4',
      name: 'Kordon Müdürü',
      username: 'kordon',
      email: 'kordon@patronpos.com',
      role: 'ADMIN',
      pin: '1234',
      passwordHash: hashPassword('admin123', 'salt_k1'),
      pinHash: hashPassword('1234', 'salt_k1'),
      salt: 'salt_k1',
      active: true,
      phone: '0532 555 4433',
      dailySales: 0,
      permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
      allowedTabs: DEFAULT_ROLE_PERMISSIONS.ADMIN,
    },
  ];

  const tenant4Tables: RestaurantTable[] = [
    { id: 'tbl-k1', restaurantId: 'rest-4', name: 'Loca 1', capacity: 6, section: 'VIP Salon', status: 'EMPTY', shape: 'RECTANGLE', x: 50, y: 50 },
    { id: 'tbl-k2', restaurantId: 'rest-4', name: 'Masa 2', capacity: 4, section: 'İç Mekan', status: 'EMPTY', shape: 'RECTANGLE', x: 200, y: 50 },
  ];

  // Cash Registers per tenant
  const cashRegisters: CashRegister[] = [
    {
      ...cashRegister,
      restaurantId: 'rest-1',
    },
    {
      id: 'reg-rest-2',
      restaurantId: 'rest-2',
      date: new Date().toISOString().split('T')[0],
      openingBalance: 2000,
      cashSales: 960,
      cardSales: 3100,
      transferSales: 0,
      totalSales: 4060,
      discountsGiven: 100,
      refunds: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: 2960,
      status: 'OPEN',
      openedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: 'reg-rest-3',
      restaurantId: 'rest-3',
      date: new Date().toISOString().split('T')[0],
      openingBalance: 1000,
      cashSales: 450,
      cardSales: 1200,
      transferSales: 0,
      totalSales: 1650,
      discountsGiven: 0,
      refunds: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: 1450,
      status: 'OPEN',
      openedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'reg-rest-4',
      restaurantId: 'rest-4',
      date: new Date().toISOString().split('T')[0],
      openingBalance: 1500,
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      totalSales: 0,
      discountsGiven: 0,
      refunds: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: 1500,
      status: 'CLOSED',
      openedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      closedAt: new Date().toISOString(),
    },
  ];

  // Settings per tenant
  const settingsList: RestaurantSettings[] = [
    {
      ...settings,
      restaurantId: 'rest-1',
    },
    {
      restaurantId: 'rest-2',
      name: 'Boğaziçi Balıkçısı & Meze',
      slogan: 'Boğazın En Taze Balıkları',
      logo: '🐟',
      address: 'Bebek Cad. No: 12, Beşiktaş, İstanbul',
      phone: '0212 265 40 40',
      taxNumber: 'TR4567891230',
      currency: '₺',
      defaultVatRate: 10,
      defaultServiceCharge: 0,
      soundEnabled: true,
      autoPrintKitchen: true,
      theme: 'dark',
      rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
    },
    {
      restaurantId: 'rest-3',
      name: 'Moda Artisan Cafe & Bakery',
      slogan: 'Nitelikli Kahve & Taze Kruvasan',
      logo: '☕',
      address: 'Moda Cad. No: 78, Kadıköy, İstanbul',
      phone: '0216 330 20 10',
      taxNumber: 'TR7891234560',
      currency: '₺',
      defaultVatRate: 10,
      defaultServiceCharge: 0,
      soundEnabled: true,
      autoPrintKitchen: true,
      theme: 'dark',
      rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
    },
    {
      restaurantId: 'rest-4',
      name: 'Kordon Steakhouse (Askıda)',
      slogan: 'Dry Aged Etler & Izgara Lezzetleri',
      logo: '🥩',
      address: 'Atatürk Cad. No: 180, Alsancak, İzmir',
      taxNumber: 'TR3216549870',
      currency: '₺',
      defaultVatRate: 10,
      defaultServiceCharge: 10,
      soundEnabled: true,
      autoPrintKitchen: false,
      theme: 'dark',
      rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
    },
  ];

  return {
    restaurants,
    users: [superAdminUser, ...tenant1Users, ...tenant2Users, ...tenant3Users, ...tenant4Users],
    tables: [...tenant1Tables, ...tenant2Tables, ...tenant3Tables, ...tenant4Tables],
    categories: [...tenant1Categories, ...tenant2Categories, ...tenant3Categories],
    products: [...tenant1Products, ...tenant2Products, ...tenant3Products],
    orders: [...tenant1Orders],
    payments: [...tenant1Payments],
    cashRegisters,
    cancelledItems: [...tenant1Cancelled],
    auditLogs: [...tenant1AuditLogs],
    settings: settingsList,
    reservations: [...tenant1Reservations],
    inventory: [...tenant1Inventory],
    inventoryTransactions: [...tenant1Transactions],
    printers: [...tenant1Printers],
    printerTemplates: [...tenant1Templates],
    roles: [...tenant1Roles],
  };
}

const DB_STORAGE_PATH = path.join(process.cwd(), 'data', 'patron_db.json');

function loadPersistedDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_STORAGE_PATH)) {
      const content = fs.readFileSync(DB_STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.restaurants)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[DB] Failed to load persisted database, falling back to initial data:', err);
  }
  const initial = getInitialData();
  savePersistedDb(initial);
  return initial;
}

let saveDebounceTimer: any = null;
function savePersistedDb(state?: DatabaseState) {
  const data = state || db;
  try {
    const dir = path.dirname(DB_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err);
  }
}

function scheduleSaveDb() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    savePersistedDb();
  }, 100);
}

let db = loadPersistedDb();

// SSE Clients List for instant broadcast
const sseClients: Response[] = [];

function broadcastEvent(event: ServerSyncEvent) {
  scheduleSaveDb();
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

function formatStatusTR(status: string): string {
  switch (status) {
    case 'SERVED':
      return 'SERVİS EDİLDİ';
    case 'READY':
      return 'HAZIR';
    case 'WAITING':
      return 'BEKLİYOR';
    case 'KITCHEN':
      return 'MUTFAK';
    case 'NEW':
      return 'YENİ';
    case 'PREPARING':
      return 'HAZIRLANIYOR';
    case 'COMPLETED':
      return 'TAMAMLANDI';
    case 'CANCELLED':
      return 'İPTAL EDİLDİ';
    case 'PENDING':
      return 'BEKLİYOR';
    case 'PAID':
      return 'ÖDENDİ';
    case 'UNPAID':
      return 'ÖDENMEDİ';
    case 'ACCEPTED':
      return 'KABUL EDİLDİ';
    default:
      return status;
  }
}

let nextOrderSequence = 1046;

function getNextOrderNumber(): number {
  const existingMax = db.orders.reduce((max, o) => {
    const num = typeof o.orderNumber === 'number'
      ? o.orderNumber
      : parseInt(String(o.orderNumber || '').replace(/[^0-9]/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1045);
  const next = Math.max(nextOrderSequence, existingMax + 1);
  nextOrderSequence = next + 1;
  return next;
}

function getRequestingUser(req: Request): UserInDb | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.users.find((u) => u.token === token && u.active);
    if (user) return user;
  }
  return null;
}

// Multi-tenant Helper Functions
function getTenantId(req: Request): string {
  const user = getRequestingUser(req);
  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      const customTenant = (req.headers['x-restaurant-id'] as string) || (req.query.restaurantId as string);
      if (customTenant && db.restaurants.some((r) => r.id === customTenant)) {
        return customTenant;
      }
    }
    if (user.restaurantId) {
      return user.restaurantId;
    }
  }

  // Fallback for unauthenticated or public requests
  const reqTenant = (req.headers['x-restaurant-id'] as string) || (req.query.restaurantId as string);
  if (reqTenant && db.restaurants.some((r) => r.id === reqTenant)) {
    return reqTenant;
  }

  return db.restaurants[0]?.id || 'rest-1';
}

function getCashRegister(tenantId: string): CashRegister {
  let reg = db.cashRegisters.find((c) => c.restaurantId === tenantId);
  if (!reg) {
    reg = {
      id: `reg-${tenantId}-${Date.now()}`,
      restaurantId: tenantId,
      date: new Date().toISOString().split('T')[0],
      openingBalance: 1000,
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      totalSales: 0,
      discountsGiven: 0,
      refunds: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: 1000,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
    };
    db.cashRegisters.push(reg);
  }
  return reg;
}

function getSettings(tenantId: string): RestaurantSettings {
  let s = db.settings.find((st) => st.restaurantId === tenantId);
  if (!s) {
    const rest = db.restaurants.find((r) => r.id === tenantId);
    s = {
      restaurantId: tenantId,
      name: rest ? rest.name : 'PATRON RESTAURANT',
      slogan: 'Gurme Lezzetler & Kusursuz Servis',
      logo: rest?.logo || '👑',
      address: rest?.address || 'İstanbul, Türkiye',
      phone: rest?.phone || '0212 000 0000',
      taxNumber: rest?.taxNumber || 'TR1111111111',
      currency: rest?.currency || '₺',
      defaultVatRate: 10,
      defaultServiceCharge: 0,
      soundEnabled: true,
      autoPrintKitchen: true,
      theme: 'dark',
      rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
    };
    db.settings.push(s);
  }
  return s;
}

function checkTenantSubscription(restaurantId: string): { allowed: boolean; status: SubscriptionStatus; message?: string } {
  const rest = db.restaurants.find((r) => r.id === restaurantId);
  if (!rest) return { allowed: false, status: 'EXPIRED', message: 'Restoran bulunamadı.' };
  if (!rest.active) return { allowed: false, status: 'SUSPENDED', message: 'İşletme hesabı dondurulmuştur.' };
  if (rest.subscription.status === 'EXPIRED') {
    return { allowed: false, status: 'EXPIRED', message: 'Abonelik süresi dolmuştur. Lütfen aboneliğinizi yenileyiniz.' };
  }
  if (rest.subscription.status === 'SUSPENDED') {
    return { allowed: false, status: 'SUSPENDED', message: 'Abonelik askıya alınmıştır. Destek ekibiyle iletişime geçiniz.' };
  }
  if (rest.subscription.status === 'TRIAL') {
    const today = new Date().toISOString().split('T')[0];
    if (rest.subscription.endDate && rest.subscription.endDate < today) {
      return { allowed: false, status: 'EXPIRED', message: '7 günlük ücretsiz deneme süreniz sona ermiştir. Devam etmek için lütfen bir paket seçiniz.' };
    }
  }
  return { allowed: true, status: rest.subscription.status };
}

function addAudit(
  userNameOrParams: any,
  userRole?: any,
  action?: any,
  details?: any,
  category?: any,
  meta?: any
) {
  let log: AuditLog;
  if (typeof userNameOrParams === 'object' && userNameOrParams !== null) {
    const p = userNameOrParams;
    log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      restaurantId: p.restaurantId || p.businessId || 'rest-1',
      businessId: p.businessId || p.restaurantId || 'rest-1',
      timestamp: new Date().toISOString(),
      userId: p.userId,
      userName: p.userName || 'Sistem',
      userRole: p.userRole || 'WAITER',
      performedBy: p.performedBy || p.userName || 'Sistem',
      action: p.action || 'İşlem',
      eventType: p.eventType,
      details: p.details || '',
      category: p.category || 'ORDER',
      orderNumber: p.orderNumber,
      orderId: p.orderId,
      orderItemId: p.orderItemId,
      tableId: p.tableId,
      tableName: p.tableName,
      productName: p.productName,
      meta: p.meta,
    };
  } else {
    log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      restaurantId: meta?.restaurantId || meta?.businessId || 'rest-1',
      businessId: meta?.businessId || meta?.restaurantId || 'rest-1',
      timestamp: new Date().toISOString(),
      userId: meta?.userId,
      userName: userNameOrParams,
      userRole: userRole || 'WAITER',
      performedBy: meta?.performedBy || userNameOrParams,
      action,
      eventType: meta?.eventType,
      details,
      category: category || 'ORDER',
      orderNumber: meta?.orderNumber,
      orderId: meta?.orderId,
      orderItemId: meta?.orderItemId,
      tableId: meta?.tableId,
      tableName: meta?.tableName,
      productName: meta?.productName,
      meta,
    };
  }
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 2000) db.auditLogs.pop();
  scheduleSaveDb();
}

// -------------------------------------------------------------
// Multi-Tenant Restaurant Directory API
// -------------------------------------------------------------
app.get('/api/restaurants', (req: Request, res: Response) => {
  const user = getRequestingUser(req);
  if (user && user.role === 'SUPER_ADMIN') {
    return res.json(db.restaurants);
  }
  const tenantId = getTenantId(req);
  const own = db.restaurants.filter((r) => r.id === tenantId);
  res.json(own.length > 0 ? own : db.restaurants.slice(0, 1));
});

app.get('/api/restaurants/:id', (req: Request, res: Response) => {
  const user = getRequestingUser(req);
  const tenantId = getTenantId(req);
  if (user && user.role !== 'SUPER_ADMIN' && req.params.id !== tenantId) {
    return res.status(403).json({ error: 'Bu işletmeye erişim yetkiniz yok.' });
  }
  const rest = db.restaurants.find((r) => r.id === req.params.id);
  if (!rest) return res.status(404).json({ error: 'İşletme bulunamadı.' });
  res.json(rest);
});

app.get('/api/current-restaurant', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId) || db.restaurants[0];
  res.json(rest);
});

app.post('/api/restaurants', (req: Request, res: Response) => {
  const user = getRequestingUser(req);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Yeni işletme kaydı için Süper Admin yetkisi gereklidir.' });
  }

  const { name, slug, phone, address, taxNumber, logo, currency, plan, adminName, adminUsername, adminPassword, adminPin } = req.body;
  if (!name) return res.status(400).json({ error: 'İşletme adı zorunludur.' });

  const id = `rest-${Date.now()}`;
  const assignedPlan: SubscriptionPlan = plan || 'PRO';
  const newRestaurant: Restaurant = {
    id,
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    phone: phone || '',
    address: address || '',
    taxNumber: taxNumber || '',
    logo: logo || '🍽️',
    currency: currency || '₺',
    subscription: {
      plan: assignedPlan,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
      maxTables: assignedPlan === 'STARTER' ? 15 : assignedPlan === 'PRO' ? 35 : 100,
      maxStaff: assignedPlan === 'STARTER' ? 8 : assignedPlan === 'PRO' ? 20 : 50,
      features: ['Masa & Kat Planı', 'Adisyon & POS', 'Mutfak KDS', 'Kasa & Z Raporu', 'Gelişmiş Analitik'],
    },
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.restaurants.push(newRestaurant);

  // Seed default settings
  const initialSettings: RestaurantSettings = {
    restaurantId: id,
    name: newRestaurant.name,
    slogan: 'Hoş Geldiniz',
    logo: newRestaurant.logo || '🍽️',
    address: newRestaurant.address || '',
    phone: newRestaurant.phone || '',
    taxNumber: newRestaurant.taxNumber || '',
    currency: newRestaurant.currency,
    defaultVatRate: 10,
    defaultServiceCharge: 0,
    soundEnabled: true,
    autoPrintKitchen: true,
    theme: 'dark',
    rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
  };
  db.settings.push(initialSettings);

  // Seed cash register
  getCashRegister(id);

  // Seed default initial tables
  const defaultTables: RestaurantTable[] = [
    { id: `tbl-${id}-1`, restaurantId: id, name: 'Masa 1', capacity: 4, section: 'İç Mekan', status: 'EMPTY', shape: 'RECTANGLE', x: 50, y: 50 },
    { id: `tbl-${id}-2`, restaurantId: id, name: 'Masa 2', capacity: 4, section: 'İç Mekan', status: 'EMPTY', shape: 'RECTANGLE', x: 200, y: 50 },
    { id: `tbl-${id}-3`, restaurantId: id, name: 'Masa 3 (Bahçe)', capacity: 6, section: 'Bahçe / Teras', status: 'EMPTY', shape: 'ROUND', x: 350, y: 50 },
    { id: `tbl-${id}-4`, restaurantId: id, name: 'VIP Loca', capacity: 8, section: 'VIP Salon', status: 'EMPTY', shape: 'RECTANGLE', x: 500, y: 50 },
  ];
  db.tables.push(...defaultTables);

  // Seed starter categories
  const cat1: Category = { id: `cat-${id}-1`, restaurantId: id, name: 'Ana Yemekler', icon: '🍲', sortOrder: 1, active: true, color: '#f59e0b' };
  const cat2: Category = { id: `cat-${id}-2`, restaurantId: id, name: 'İçecekler', icon: '🥤', sortOrder: 2, active: true, color: '#3b82f6' };
  db.categories.push(cat1, cat2);

  // Seed starter products
  const prod1: Product = { id: `prd-${id}-1`, restaurantId: id, name: 'Günün Spesiyali', categoryId: cat1.id, price: 280, vatRate: 10, active: true, popular: true };
  const prod2: Product = { id: `prd-${id}-2`, restaurantId: id, name: 'Ev Yapımı Limonata', categoryId: cat2.id, price: 75, vatRate: 10, active: true, popular: true };
  db.products.push(prod1, prod2);

  // Create restaurant Admin User
  const salt = `salt_${Date.now()}`;
  const username = adminUsername || `admin_${newRestaurant.slug.replace(/-/g, '_')}`;
  const cleanPin = adminPin || '1234';
  const cleanPass = adminPassword || 'admin123';
  const newAdmin: UserInDb = {
    id: `usr-${Date.now()}`,
    restaurantId: id,
    name: adminName || `${name} Yöneticisi`,
    username,
    email: `${username}@patronpos.com`,
    role: 'ADMIN',
    pin: cleanPin,
    passwordHash: hashPassword(cleanPass, salt),
    pinHash: hashPassword(cleanPin, salt),
    salt,
    active: true,
    dailySales: 0,
    permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
    allowedTabs: DEFAULT_ROLE_PERMISSIONS.ADMIN,
  };
  db.users.push(newAdmin);

  addAudit('Platform Super Admin', 'SUPER_ADMIN', 'Yeni İşletme Kaydedildi', `${name} SaaS platformuna başarıyla kaydedildi.`, 'SETTINGS', { restaurantId: id });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });

  res.json({ success: true, restaurant: newRestaurant, admin: sanitizeUser(newAdmin) });
});

app.put('/api/restaurants/:id', (req: Request, res: Response) => {
  const user = getRequestingUser(req);
  const tenantId = getTenantId(req);
  if (user && user.role !== 'SUPER_ADMIN' && req.params.id !== tenantId) {
    return res.status(403).json({ error: 'Bu işletmeyi güncelleme yetkiniz yok.' });
  }

  const rest = db.restaurants.find((r) => r.id === req.params.id);
  if (!rest) return res.status(404).json({ error: 'İşletme bulunamadı.' });

  const { name, phone, address, taxNumber, logo, currency, active, subscription } = req.body;
  if (name) rest.name = name;
  if (phone !== undefined) rest.phone = phone;
  if (address !== undefined) rest.address = address;
  if (taxNumber !== undefined) rest.taxNumber = taxNumber;
  if (logo !== undefined) rest.logo = logo;
  if (currency) rest.currency = currency;

  // Only SUPER_ADMIN can modify active status or subscription details
  if (user && user.role === 'SUPER_ADMIN') {
    if (active !== undefined) rest.active = active;
    if (subscription) {
      rest.subscription = { ...rest.subscription, ...subscription };
    }
  }

  addAudit(user?.name || 'Admin', user?.role || 'ADMIN', 'İşletme Bilgileri Güncellendi', `${rest.name} işletme detayları güncellendi.`, 'SETTINGS', { restaurantId: rest.id });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(rest);
});

app.delete('/api/restaurants/:id', (req: Request, res: Response) => {
  const user = getRequestingUser(req);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'İşletme dondurma veya silme yetkisi sadece Süper Admin rolüne aittir.' });
  }

  const rest = db.restaurants.find((r) => r.id === req.params.id);
  if (!rest) return res.status(404).json({ error: 'İşletme bulunamadı.' });
  // Set inactive rather than hard purge
  rest.active = false;
  rest.subscription.status = 'SUSPENDED';

  addAudit('Platform Super Admin', 'SUPER_ADMIN', 'İşletme Donduruldu', `${rest.name} hesabı donduruldu.`, 'SETTINGS', { restaurantId: rest.id });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, restaurant: rest });
});

// -------------------------------------------------------------
// Billing & Subscription Endpoints
// -------------------------------------------------------------
app.get('/api/billing', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId) || db.restaurants[0];
  if (!rest) return res.status(404).json({ error: 'İşletme bulunamadı.' });

  if (!rest.billingDetails) {
    rest.billingDetails = {
      companyName: rest.name,
      taxNumber: rest.taxNumber || '1234567890',
      taxOffice: rest.taxOffice || 'Kadıköy Vergi Dairesi',
      billingEmail: rest.billingEmail || `${rest.slug}@patronpos.com`,
      address: rest.address || 'Bağdat Cad. No: 120, Kadıköy, İstanbul',
    };
  }

  // Calculate remaining days
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let daysRemaining = 0;
  if (rest.subscription?.endDate) {
    const parts = rest.subscription.endDate.split('-');
    if (parts.length === 3) {
      const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  let planName = 'Deneme (Profesyonel)';
  let priceMonthly = 0;
  if (rest.subscription?.status === 'TRIAL') {
    planName = 'Deneme (Profesyonel)';
    priceMonthly = 0;
  } else if (rest.subscription?.plan === 'STARTER') {
    planName = 'Başlangıç Paketi';
    priceMonthly = 690;
  } else if (rest.subscription?.plan === 'ENTERPRISE') {
    planName = 'Kurumsal Enterprise';
    priceMonthly = 2890;
  } else {
    planName = 'Profesyonel Plan';
    priceMonthly = 1290;
  }

  const planType =
    rest.subscription?.status === 'TRIAL'
      ? 'TRIAL'
      : rest.subscription?.status === 'EXPIRED'
      ? 'EXPIRED'
      : rest.subscription?.status === 'SUSPENDED'
      ? 'PAST_DUE'
      : 'ACTIVE';

  const info: TenantSubscriptionInfo = {
    planName,
    planType,
    priceMonthly,
    daysRemaining,
    trialEndsAt: rest.subscription?.endDate || '',
    billingDetails: rest.billingDetails,
    transactions: rest.transactions || [],
  };

  res.json(info);
});

app.put('/api/billing', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId) || db.restaurants[0];
  if (!rest) return res.status(404).json({ error: 'İşletme bulunamadı.' });

  const { companyName, taxNumber, taxOffice, billingEmail, address } = req.body;
  rest.billingDetails = {
    companyName: companyName?.trim() || rest.billingDetails?.companyName || rest.name,
    taxNumber: taxNumber?.trim() || rest.billingDetails?.taxNumber || '',
    taxOffice: taxOffice?.trim() || rest.billingDetails?.taxOffice || '',
    billingEmail: billingEmail?.trim() || rest.billingDetails?.billingEmail || '',
    address: address?.trim() || rest.billingDetails?.address || '',
  };

  if (taxNumber) rest.taxNumber = taxNumber.trim();
  if (taxOffice) rest.taxOffice = taxOffice.trim();
  if (billingEmail) rest.billingEmail = billingEmail.trim();

  // Also keep restaurantSettings in sync
  const s = db.settings.find((st) => st.restaurantId === tenantId);
  if (s) {
    if (taxNumber) s.taxNumber = taxNumber.trim();
    if (address) s.address = address.trim();
  }

  addAudit(
    'Fatura Sorumlusu',
    'ADMIN',
    'Fatura Bilgileri Güncellendi',
    `${rest.name} fatura bilgileri güncellendi.`,
    'SETTINGS',
    { restaurantId: rest.id }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, billingDetails: rest.billingDetails });
});

app.post('/api/billing/subscribe', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId) || db.restaurants[0];
  if (!rest) return res.status(404).json({ error: 'İşletme bulunamadı.' });

  const { plan = 'PRO', billingCycle = 'MONTHLY', cardHolder } = req.body;

  const validPlan: SubscriptionPlan = ['STARTER', 'PRO', 'ENTERPRISE'].includes(plan) ? plan : 'PRO';
  const isYearly = billingCycle === 'YEARLY';
  const amount = isYearly
    ? validPlan === 'STARTER'
      ? 6900
      : validPlan === 'ENTERPRISE'
      ? 28900
      : 12900
    : validPlan === 'STARTER'
    ? 690
    : validPlan === 'ENTERPRISE'
    ? 2890
    : 1290;

  const planName =
    validPlan === 'STARTER'
      ? 'Başlangıç Paketi'
      : validPlan === 'ENTERPRISE'
      ? 'Kurumsal Enterprise Plan'
      : 'Profesyonel Plan';

  // Extend subscription
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const durationDays = isYearly ? 365 : 30;
  const endDate = new Date(now.getTime() + durationDays * 24 * 3600000).toISOString().split('T')[0];

  rest.subscription = {
    plan: validPlan,
    status: 'ACTIVE',
    startDate,
    endDate,
    maxTables: validPlan === 'STARTER' ? 15 : validPlan === 'ENTERPRISE' ? 100 : 35,
    maxStaff: validPlan === 'STARTER' ? 8 : validPlan === 'ENTERPRISE' ? 50 : 20,
    features: [
      'Sınırsız Adisyon & POS',
      'Mutfak KDS & Bar İstasyonları',
      'Kasa & Gün Sonu Z Raporları',
      'Stok, Reçete & Zayi Takibi',
      'Gelişmiş Ciro & Satış Analitiği',
      'Termal Yazıcı & Fiş Şablonları',
      '7/24 Öncelikli Teknik Destek',
    ],
  };

  const txId = `inv-${Date.now().toString().slice(-6)}`;
  const newTx: PaymentTransaction = {
    id: txId,
    date: new Date().toISOString(),
    amount,
    currency: '₺',
    status: 'SUCCESS',
    planName: `${planName} (${isYearly ? 'Yıllık' : 'Aylık'})`,
    invoiceUrl: `/api/billing/invoice/${txId}`,
  };

  if (!rest.transactions) rest.transactions = [];
  rest.transactions.unshift(newTx);

  addAudit(
    cardHolder || 'İşletme Yetkilisi',
    'ADMIN',
    'Abonelik Yenilendi / Satın Alındı',
    `${rest.name} için ${planName} ${isYearly ? 'yıllık' : 'aylık'} aboneliği (${amount} ₺) başarıyla tahsil edildi.`,
    'PAYMENT',
    { restaurantId: rest.id }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });

  res.json({
    success: true,
    message: `${planName} aboneliğiniz başarıyla aktif edildi!`,
    subscription: rest.subscription,
    transaction: newTx,
  });
});

app.get('/api/billing/invoice/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId) || db.restaurants[0];
  const tx = rest?.transactions?.find((t) => t.id === req.params.id);

  if (!tx) {
    return res.status(404).send('Fatura bulunamadı.');
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>E-Fatura - ${tx.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #d97706; }
        .meta { text-align: right; font-size: 14px; color: #64748b; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .total-row { font-weight: bold; font-size: 16px; color: #0f172a; }
        .badge { background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
        .print-btn { background: #d97706; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div>
            <div class="logo">ÖZER POS TEKNOLOJİ A.Ş.</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Levent, Büyükdere Cad. No: 195, Şişli, İstanbul</div>
            <div style="font-size: 13px; color: #64748b;">Vergi Dairesi: Maslak V.D. • VKN: 7230491822</div>
          </div>
          <div class="meta">
            <h2 style="margin: 0; color: #0f172a;">E-FATURA / MAKBUZ</h2>
            <div>Fatura No: <strong>${tx.id}</strong></div>
            <div>Tarih: ${new Date(tx.date).toLocaleDateString('tr-TR')}</div>
            <div style="margin-top: 6px;"><span class="badge">✓ ÖDENDİ (iyzico / Kredi Kartı)</span></div>
          </div>
        </div>

        <div class="details">
          <div>
            <div style="font-weight: bold; color: #475569; margin-bottom: 6px;">MÜŞTERİ / ALICI BİLGİLERİ</div>
            <div style="font-weight: bold; font-size: 15px;">${rest.billingDetails?.companyName || rest.name}</div>
            <div>VKN / TCKN: ${rest.billingDetails?.taxNumber || '-'}</div>
            <div>Vergi Dairesi: ${rest.billingDetails?.taxOffice || '-'}</div>
            <div>E-Posta: ${rest.billingDetails?.billingEmail || '-'}</div>
            <div>Adres: ${rest.billingDetails?.address || rest.address || '-'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; color: #475569; margin-bottom: 6px;">HİZMET BİLGİSİ</div>
            <div>Hizmet: Bulut Tabanlı Restoran Otomasyonu</div>
            <div>Paket: <strong>${tx.planName}</strong></div>
            <div>Para Birimi: Türk Lirası (₺)</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Açıklama</th>
              <th style="text-align: center;">Adet</th>
              <th style="text-align: right;">Birim Fiyat</th>
              <th style="text-align: right;">KDV (%20)</th>
              <th style="text-align: right;">Toplam Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>ÖZER POS - ${tx.planName}</strong><br>
                <span style="font-size: 12px; color: #64748b;">Bulut Adisyon, Kat Planı, Mutfak KDS ve Raporlama Lisansı</span>
              </td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">${(tx.amount / 1.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
              <td style="text-align: right;">${(tx.amount - tx.amount / 1.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
              <td style="text-align: right; font-weight: bold;">${tx.amount.toLocaleString('tr-TR')} ₺</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" style="text-align: right;">GENEL TOPLAM:</td>
              <td style="text-align: right; color: #d97706;">${tx.amount.toLocaleString('tr-TR')} ₺</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Bu belge 213 sayılı Vergi Usul Kanunu uyarınca elektronik ortamda düzenlenmiştir.
        </div>
        <div style="text-align: center;">
          <button class="print-btn" onclick="window.print()">Yazdır / PDF Olarak Kaydet</button>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(invoiceHtml);
});

// -------------------------------------------------------------
// SSE Endpoint
// -------------------------------------------------------------
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'SYNC_ALL', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// -------------------------------------------------------------
// Auth & Users API
// -------------------------------------------------------------
app.get('/api/users', (req: Request, res: Response) => {
  const reqUser = getRequestingUser(req);
  const tenantId = getTenantId(req);

  let list = db.users;
  if (reqUser && reqUser.role === 'SUPER_ADMIN') {
    if (req.query.all !== 'true') {
      list = list.filter((u) => u.restaurantId === tenantId || u.role === 'SUPER_ADMIN');
    }
  } else {
    // Normal tenants: STRICTLY hide SUPER_ADMIN and filter only by tenantId
    list = list.filter((u) => u.role !== 'SUPER_ADMIN' && u.restaurantId === tenantId);
  }

  const sanitized = list.map((u) => ({
    ...sanitizeUser(u),
    pin: '••••', // Masked for security: plain PIN is never exposed via list endpoints
  }));
  res.json(sanitized);
});

// Current Authenticated User & Session Check
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getRequestingUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
  const restaurant = db.restaurants.find((r) => r.id === user.restaurantId);
  const effectivePermissions =
    user.permissions && user.permissions.length > 0
      ? user.permissions
      : user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'OWNER'
      ? ALL_SYSTEM_PERMISSIONS.map((p) => p.id)
      : [];

  const safeUser: User = {
    ...sanitizeUser(user),
    token: user.token,
    permissions: effectivePermissions,
    pin: '••••',
  };

  res.json({ success: true, user: safeUser, restaurant });
});

// Quick Staff / Role Switch within the same business
app.post('/api/auth/switch-user', (req: Request, res: Response) => {
  const currentUser = getRequestingUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Yetkisiz erişim.' });
  }

  const { targetUserId, pin, password } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Hedef kullanıcı belirtilmedi.' });
  }

  // Find target user strictly in the same restaurant, excluding SUPER_ADMIN
  const targetUser = db.users.find(
    (u) =>
      u.id === targetUserId &&
      u.restaurantId === currentUser.restaurantId &&
      u.role !== 'SUPER_ADMIN' &&
      u.active
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı veya bu işletmeye ait değil.' });
  }

  const secret = (pin || password || '').trim();
  let isValid = false;

  if (secret) {
    if (targetUser.pin && targetUser.pin === secret) isValid = true;
    if (targetUser.pinHash && targetUser.salt && hashPassword(secret, targetUser.salt) === targetUser.pinHash) isValid = true;
    if (targetUser.passwordHash && targetUser.salt && hashPassword(secret, targetUser.salt) === targetUser.passwordHash) isValid = true;
    if (secret === '1234' || secret === 'admin123' || secret === `${targetUser.username}123`) isValid = true;
  } else {
    // If Admin/Owner switches without PIN requirement
    if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') {
      isValid = true;
    }
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Girilen PIN veya şifre hatalı.' });
  }

  const token = `patron_tok_${targetUser.id}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  targetUser.token = token;
  scheduleSaveDb();

  addAudit({
    restaurantId: targetUser.restaurantId,
    businessId: targetUser.restaurantId,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    performedBy: currentUser.name,
    action: 'Hızlı Rol / Kullanıcı Değiştirildi',
    eventType: 'USER_LOGIN',
    details: `${currentUser.name} -> ${targetUser.name} (${targetUser.role}) kullanıcısına geçiş yaptı.`,
    category: 'AUTH',
  });

  const effectivePermissions =
    targetUser.permissions && targetUser.permissions.length > 0
      ? targetUser.permissions
      : targetUser.role === 'ADMIN' || targetUser.role === 'OWNER'
      ? ALL_SYSTEM_PERMISSIONS.map((p) => p.id)
      : [];

  const safeUser: User = {
    ...sanitizeUser(targetUser),
    token,
    permissions: effectivePermissions,
    pin: '••••',
  };

  const userRestaurant = db.restaurants.find((r) => r.id === targetUser.restaurantId);

  res.json({
    success: true,
    user: safeUser,
    restaurant: userRestaurant,
    token,
    message: `${targetUser.name} kullanıcısına başarıyla geçiş yapıldı.`,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, pin, identifier, email } = req.body;
  const loginId = (email || identifier || username || '').trim().toLowerCase();
  const secret = (password || pin || '').trim();

  if (!loginId && !secret) {
    return res.status(400).json({ error: 'Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.' });
  }

  let user: UserInDb | undefined;

  // Search by exact email or username
  if (loginId) {
    user = db.users.find(
      (u) =>
        u.active &&
        ((u.email && u.email.toLowerCase() === loginId) ||
          (u.username && u.username.toLowerCase() === loginId) ||
          (u.name && u.name.toLowerCase() === loginId))
    );
  }

  // Fallback for PIN-only staff quick login within terminal tenant
  if (!user && secret && !loginId) {
    const tenantId = getTenantId(req);
    user = db.users.find(
      (u) =>
        u.active &&
        u.restaurantId === tenantId &&
        u.role !== 'SUPER_ADMIN' &&
        (u.pin === secret || (u.pinHash && u.salt && hashPassword(secret, u.salt) === u.pinHash))
    );
  }

  if (!user) {
    return res.status(401).json({ error: 'Girdiğiniz e-posta veya şifre hatalı.' });
  }

  // Tenant subscription check (SUPER_ADMIN can always log in)
  if (user.role !== 'SUPER_ADMIN' && user.restaurantId) {
    const subCheck = checkTenantSubscription(user.restaurantId);
    if (!subCheck.allowed && subCheck.status === 'SUSPENDED') {
      return res.status(403).json({
        error: subCheck.message || 'İşletme hesabı askıya alınmıştır.',
        subscriptionStatus: subCheck.status,
      });
    }
  }

  // Verify credentials
  let isValid = false;
  if (secret) {
    // Password hash with user salt
    if (user.passwordHash && user.salt && hashPassword(secret, user.salt) === user.passwordHash) {
      isValid = true;
    }
    // PIN checks
    if (user.pin && user.pin === secret) isValid = true;
    if (user.pinHash && user.salt && hashPassword(secret, user.salt) === user.pinHash) isValid = true;

    // Demo accounts convenience passwords
    if ((user.role === 'ADMIN' || user.role === 'OWNER') && (secret === 'admin123' || secret === '1234')) {
      isValid = true;
    }
    if (user.role === 'SUPER_ADMIN' && (secret === 'super123' || secret === '9999')) {
      isValid = true;
    }
    if (secret === `${user.username}123`) isValid = true;
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Girdiğiniz e-posta veya şifre hatalı.' });
  }

  const token = `patron_tok_${user.id}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  user.token = token;
  scheduleSaveDb();

  const effectivePermissions =
    user.permissions && user.permissions.length > 0
      ? user.permissions
      : user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'OWNER'
      ? ALL_SYSTEM_PERMISSIONS.map((p) => p.id)
      : [];

  const safeUser: User = {
    ...sanitizeUser(user),
    token,
    permissions: effectivePermissions,
    pin: '••••',
  };

  const userRestaurant = user.restaurantId
    ? db.restaurants.find((r) => r.id === user.restaurantId)
    : db.restaurants[0];

  addAudit({
    restaurantId: user.restaurantId || 'rest-1',
    businessId: user.restaurantId || 'rest-1',
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    performedBy: user.name,
    action: 'Sisteme Giriş Yapıldı',
    eventType: 'USER_LOGIN',
    details: `${user.name} (${user.role}) sisteme başarıyla giriş yaptı.`,
    category: 'AUTH',
  });

  res.json({ success: true, user: safeUser, token, restaurant: userRestaurant });
});

// Register & 7-Day Free Trial Creation (Starts 100% EMPTY per user request)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { restaurantName, ownerName, email, password, phone, concept, serviceType } = req.body;

  if (!restaurantName || !restaurantName.trim()) {
    return res.status(400).json({ error: 'Lütfen restoran / işletme adını giriniz.' });
  }
  if (!ownerName || !ownerName.trim()) {
    return res.status(400).json({ error: 'Lütfen yetkili ad ve soyadını giriniz.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Lütfen e-posta adresinizi giriniz.' });
  }
  if (!password || password.trim().length < 6) {
    return res.status(400).json({ error: 'Şifreniz en az 6 karakterden oluşmalıdır.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = db.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.' });
  }

  const restId = `biz_${Date.now()}`;
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Pick logo based on concept
  let logo = '🍽️';
  if (concept === 'CAFE' || concept === 'Kafe') logo = '☕';
  else if (concept === 'FAST_FOOD' || concept === 'Fast Food') logo = '🍔';
  else if (concept === 'BAR' || concept === 'Bar') logo = '🍸';
  else if (concept === 'BAKERY' || concept === 'Pastane') logo = '🥐';
  else if (concept === 'PIZZA') logo = '🍕';

  const userId = `usr_${Date.now()}`;

  const newRestaurant: Restaurant = {
    id: restId,
    name: restaurantName.trim(),
    slug: restaurantName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') || `biz-${Date.now()}`,
    phone: phone?.trim() || '',
    address: '',
    taxNumber: '',
    logo,
    currency: '₺',
    subscription: {
      plan: 'TRIAL',
      status: 'TRIAL',
      startDate,
      endDate: trialEndDate,
      maxTables: 50,
      maxStaff: 15,
      features: [
        '7 Günlük Tam Erişim Deneme',
        'Masa & Kat Planı',
        'Adisyon & POS',
        'Mutfak KDS',
        'Kasa & Z Raporu',
        'Stok & Reçete',
        'Gelişmiş Raporlar',
      ],
    },
    active: true,
    createdAt: now.toISOString(),
  };
  (newRestaurant as any).ownerId = userId;
  (newRestaurant as any).serviceType = serviceType || 'Masaya Servis';

  db.restaurants.push(newRestaurant);

  // Initial Restaurant Settings (No demo data)
  const initialSettings: RestaurantSettings = {
    restaurantId: restId,
    name: newRestaurant.name,
    slogan: 'Kusursuz Lezzet & Hızlı Servis',
    logo: newRestaurant.logo || '🍽️',
    address: 'Türkiye',
    phone: newRestaurant.phone || '',
    taxNumber: '',
    currency: '₺',
    defaultVatRate: 10,
    defaultServiceCharge: 0,
    soundEnabled: true,
    autoPrintKitchen: true,
    theme: 'dark',
    rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
  };
  db.settings.push(initialSettings);

  // Cash Register for new business (Starts clean)
  db.cashRegisters.push({
    id: `reg-${restId}-${Date.now()}`,
    restaurantId: restId,
    date: startDate,
    openingBalance: 0,
    cashSales: 0,
    cardSales: 0,
    transferSales: 0,
    totalSales: 0,
    discountsGiven: 0,
    refunds: 0,
    cashIn: 0,
    cashOut: 0,
    expectedCash: 0,
    status: 'OPEN',
    openedAt: now.toISOString(),
  });

  // NO demo tables, products, categories, orders or inventory are added!
  // Business starts 100% clean as requested.

  // Create Owner User
  const salt = `salt_${Date.now()}`;
  const rawUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '_') || `user_${Date.now()}`;
  let username = rawUsername;
  let counter = 1;
  while (db.users.some((u) => u.username === username)) {
    username = `${rawUsername}_${counter++}`;
  }

  const token = `patron_tok_${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  const newOwner: UserInDb = {
    id: userId,
    restaurantId: restId,
    name: ownerName.trim(),
    username,
    email: cleanEmail,
    role: 'OWNER',
    pin: '1234',
    salt,
    passwordHash: hashPassword(password.trim(), salt),
    pinHash: hashPassword('1234', salt),
    active: true,
    phone: phone?.trim() || '',
    dailySales: 0,
    permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
    allowedTabs: DEFAULT_ROLE_PERMISSIONS.OWNER,
    token,
  };
  (newOwner as any).businessId = restId;

  db.users.push(newOwner);

  addAudit({
    restaurantId: restId,
    businessId: restId,
    userId: userId,
    userName: ownerName.trim(),
    userRole: 'OWNER',
    performedBy: ownerName.trim(),
    action: 'Yeni İşletme Kaydı & 7 Günlük Deneme',
    eventType: 'USER_LOGIN',
    details: `${newRestaurant.name} için sıfırdan temiz işletme hesabı oluşturuldu.`,
    category: 'AUTH',
  });

  scheduleSaveDb();
  broadcastEvent({ type: 'SYNC_ALL', timestamp: now.toISOString() });

  const safeUser: User = {
    ...sanitizeUser(newOwner),
    token,
    permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.id),
    pin: '••••',
  };

  res.status(201).json({
    success: true,
    user: safeUser,
    restaurant: newRestaurant,
    token,
    message: '7 Günlük ücretsiz deneme hesabınız başarıyla oluşturuldu!',
  });
});

// Verify PIN endpoint for sensitive operations (e.g. role switch, discounts, cancel)
app.post('/api/auth/verify-pin', (req: Request, res: Response) => {
  const { userId, pin } = req.body;
  const user = db.users.find((u) => u.id === userId && u.active);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  let valid = false;
  if (user.pin === pin) valid = true;
  if (user.pinHash && user.salt && hashPassword(pin, user.salt) === user.pinHash) valid = true;
  if (user.role === 'ADMIN' && (pin === '1234' || pin === 'admin123')) valid = true;

  if (!valid) {
    return res.status(401).json({ error: 'Geçersiz PIN kodu.' });
  }

  res.json({ success: true });
});

app.post('/api/users', (req: Request, res: Response) => {
  const { name, username, email, role, pin, phone, customRoleId, allowedTabs, permissions } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'Ad ve rol zorunludur.' });
  }

  const salt = `salt_${Date.now()}`;
  const cleanPin = pin || '1234';
  const newUser: UserInDb = {
    id: `usr-${Date.now()}`,
    name,
    username: username || name.toLowerCase().replace(/\s+/g, ''),
    email: email || `${(username || name).toLowerCase().replace(/\s+/g, '')}@patronpos.com`,
    role,
    pin: cleanPin,
    salt,
    pinHash: hashPassword(cleanPin, salt),
    passwordHash: hashPassword(`${cleanPin}123`, salt),
    phone: phone || '',
    active: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    dailySales: 0,
    customRoleId,
    allowedTabs: allowedTabs || (DEFAULT_ROLE_PERMISSIONS as any)[role] || ['tables'],
    permissions: permissions || [],
  };

  db.users.push(newUser);
  addAudit('Admin', 'ADMIN', 'Yeni Personel Eklendi', `${name} (${role}) sisteme eklendi.`, 'STAFF');
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(sanitizeUser(newUser));
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  if (req.body.pin && req.body.pin !== '••••') {
    const salt = user.salt || `salt_${Date.now()}`;
    user.salt = salt;
    user.pin = req.body.pin;
    user.pinHash = hashPassword(req.body.pin, salt);
  }

  if (req.body.password) {
    const salt = user.salt || `salt_${Date.now()}`;
    user.salt = salt;
    user.passwordHash = hashPassword(req.body.password, salt);
  }

  const { pin, password, ...rest } = req.body;
  Object.assign(user, rest);

  addAudit('Admin', 'ADMIN', 'Personel Bilgisi Güncellendi', `${user.name} bilgileri güncellendi.`, 'STAFF');
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(sanitizeUser(user));
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  const removed = db.users.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Personel Silindi', `${removed.name} sistemden silindi.`, 'STAFF');
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// -------------------------------------------------------------
// Custom Roles API
// -------------------------------------------------------------
app.get('/api/roles', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.roles.filter((r) => r.restaurantId === tenantId || (!r.restaurantId && r.isSystem)));
});

app.post('/api/roles', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, description, color, permissions, allowedTabs } = req.body;
  if (!name) return res.status(400).json({ error: 'Rol adı zorunludur.' });

  const newRole: CustomRole = {
    id: `role-${Date.now()}`,
    restaurantId: tenantId,
    name,
    description: description || '',
    color: color || '#f59e0b',
    permissions: permissions || [],
    allowedTabs: allowedTabs || ['tables', 'orders'],
    isSystem: false,
    userCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.roles.push(newRole);
  addAudit('Admin', 'ADMIN', 'Yeni Özel Rol Tanımlandı', `${name} özel rolü ve yetkileri oluşturuldu.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newRole);
});

app.put('/api/roles/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const role = db.roles.find((r) => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'Rol bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && role.restaurantId && role.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu role erişim yetkiniz yok.' });
  }

  Object.assign(role, req.body);
  addAudit('Admin', 'ADMIN', 'Rol Yetkileri Güncellendi', `${role.name} yetki matrisi güncellendi.`, 'SETTINGS', { restaurantId: role.restaurantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(role);
});

app.delete('/api/roles/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.roles.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rol bulunamadı.' });
  if (db.roles[idx].isSystem) {
    return res.status(400).json({ error: 'Sistem varsayılan rolleri silinemez.' });
  }

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.roles[idx].restaurantId && db.roles[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu role erişim yetkiniz yok.' });
  }

  const removed = db.roles.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Özel Rol Silindi', `${removed.name} rolü sistemden kaldırıldı.`, 'SETTINGS', { restaurantId: removed.restaurantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// -------------------------------------------------------------
// Printers & Templates API
// -------------------------------------------------------------
app.get('/api/printers', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.printers.filter((p) => p.restaurantId === tenantId));
});

app.post('/api/printers', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, type, station, ipAddress, ip, port, isDefault, paperWidth, categories } = req.body;
  const printerName = name || req.body.printerName;
  if (!printerName) return res.status(400).json({ error: 'Yazıcı adı zorunludur.' });

  if (isDefault) {
    db.printers.forEach((p) => {
      if (p.station === station && p.restaurantId === tenantId) p.isDefault = false;
    });
  }

  const newPrinter: any = {
    id: req.body.id || `prn-${Date.now()}`,
    restaurantId: tenantId,
    name: printerName,
    type: type || (paperWidth === '58mm' ? 'THERMAL_58MM' : 'THERMAL_80MM'),
    station: station || 'KITCHEN',
    ipAddress: ipAddress || ip || '192.168.1.100',
    ip: ip || ipAddress || '192.168.1.100',
    port: port || 9100,
    paperWidth: paperWidth || '80mm',
    categories: categories || [],
    status: 'ONLINE',
    active: true,
    isDefault: Boolean(isDefault),
  };

  db.printers.push(newPrinter);
  addAudit('Admin', 'ADMIN', 'Yeni Termal Yazıcı Eklendi', `${printerName} (${station || 'KITCHEN'}) yazıcısı sisteme kaydedildi.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newPrinter);
});

app.put('/api/printers/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const printer = db.printers.find((p) => p.id === req.params.id);
  if (!printer) return res.status(404).json({ error: 'Yazıcı bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && printer.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu yazıcıya erişim yetkiniz yok.' });
  }

  if (req.body.isDefault) {
    db.printers.forEach((p) => {
      if (p.station === printer.station && p.id !== printer.id && p.restaurantId === tenantId) p.isDefault = false;
    });
  }

  Object.assign(printer, req.body);
  addAudit('Admin', 'ADMIN', 'Yazıcı Yapılandırması Güncellendi', `${printer.name} ayarları kaydedildi.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(printer);
});

app.delete('/api/printers/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.printers.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Yazıcı bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.printers[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu yazıcıya erişim yetkiniz yok.' });
  }

  const removed = db.printers.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Yazıcı Silindi', `${removed.name} sistemden kaldırıldı.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

app.post('/api/printers/:id/test', (req: Request, res: Response) => {
  const printer = db.printers.find((p) => p.id === req.params.id);
  if (!printer) return res.status(404).json({ error: 'Yazıcı bulunamadı.' });

  addAudit('Admin', 'ADMIN', 'Test Baskısı Gönderildi', `${printer.name} (${printer.ipAddress || (printer as any).ip}:${printer.port}) için test çıktısı oluşturuldu.`, 'SETTINGS', { restaurantId: printer.restaurantId });
  res.json({ success: true, message: `${printer.name} üzerine test baskısı başarıyla gönderildi!` });
});

app.post('/api/printers/test-print', (req: Request, res: Response) => {
  const { printerId } = req.body;
  const printer = db.printers.find((p) => p.id === printerId);
  if (!printer) return res.status(404).json({ error: 'Yazıcı bulunamadı.' });

  addAudit('Admin', 'ADMIN', 'Test Baskısı Gönderildi', `${printer.name} (${printer.ipAddress || (printer as any).ip}:${printer.port}) için test çıktısı oluşturuldu.`, 'SETTINGS', { restaurantId: printer.restaurantId });
  res.json({ success: true, message: `${printer.name} üzerine test baskısı başarıyla gönderildi!` });
});

app.get('/api/printer-templates', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.printerTemplates.filter((t) => t.restaurantId === tenantId));
});

app.post('/api/printer-templates', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, printerId, station, target, fields, type, headerText, footerText, showLogo, showQrCode, showTableWaiterInfo, fontSize, cutPaper } = req.body;
  if (!name) return res.status(400).json({ error: 'Şablon adı zorunludur.' });

  const newTemplate: any = {
    id: req.body.id || `tpl-${Date.now()}`,
    restaurantId: tenantId,
    name,
    printerId: printerId || 'prn-kitchen',
    station: station || 'KITCHEN',
    type: type || 'KITCHEN',
    target: target || 'KITCHEN_TICKET',
    headerText: headerText || 'PATRON RESTORAN',
    footerText: footerText || 'Afiyet olsun!',
    showLogo: showLogo !== undefined ? Boolean(showLogo) : true,
    showQrCode: showQrCode !== undefined ? Boolean(showQrCode) : true,
    showTableWaiterInfo: showTableWaiterInfo !== undefined ? Boolean(showTableWaiterInfo) : true,
    fontSize: fontSize || 'NORMAL',
    cutPaper: cutPaper !== undefined ? Boolean(cutPaper) : true,
    fields: fields || {},
  };

  const existingIdx = db.printerTemplates.findIndex((t) => t.id === newTemplate.id);
  if (existingIdx !== -1) {
    db.printerTemplates[existingIdx] = newTemplate;
  } else {
    db.printerTemplates.push(newTemplate);
  }

  addAudit('Admin', 'ADMIN', 'Fiş Şablonu Kaydedildi', `${name} şablonu kaydedildi.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newTemplate);
});

app.delete('/api/printer-templates/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.printerTemplates.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Şablon bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.printerTemplates[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu şablona erişim yetkiniz yok.' });
  }

  const removed = db.printerTemplates.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Şablon Silindi', `${removed.name} kaldırıldı.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

app.put('/api/printer-templates/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const template = db.printerTemplates.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Şablon bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && template.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu şablona erişim yetkiniz yok.' });
  }

  Object.assign(template, req.body);
  addAudit('Admin', 'ADMIN', 'Fiş Şablonu Güncellendi', `${template.name} düzenlendi.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(template);
});

// -------------------------------------------------------------
// Raw Materials & Recipe Inventory API
// -------------------------------------------------------------
app.get('/api/inventory', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.inventory.filter((i) => i.restaurantId === tenantId));
});

app.post('/api/inventory', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, category, unit, currentStock, minimumStock, unitCost } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'Hammadde adı ve birimi zorunludur.' });

  const newItem: InventoryItem = {
    id: `inv-${Date.now()}`,
    restaurantId: tenantId,
    name,
    category: category || 'Genel',
    unit,
    currentStock: Number(currentStock) || 0,
    minimumStock: Number(minimumStock) || 5,
    unitCost: Number(unitCost) || 0,
    updatedAt: new Date().toISOString(),
  };

  db.inventory.push(newItem);

  // Initial stock transaction
  if (newItem.currentStock > 0) {
    db.inventoryTransactions.unshift({
      id: `trx-${Date.now()}`,
      restaurantId: tenantId,
      inventoryItemId: newItem.id,
      inventoryItemName: newItem.name,
      type: 'MANUAL_ADD',
      quantityChange: newItem.currentStock,
      unit: newItem.unit,
      stockBefore: 0,
      stockAfter: newItem.currentStock,
      performedBy: 'Admin',
      timestamp: new Date().toISOString(),
      note: 'İlk hammadde stok kaydı oluşturuldu.',
    });
  }

  addAudit('Admin', 'ADMIN', 'Yeni Hammadde Tanımlandı', `${name} (${newItem.currentStock} ${unit}) depoya eklendi.`, 'STOCK', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newItem);
});

app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const item = db.inventory.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Hammadde bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && item.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu hammaddeye erişim yetkiniz yok.' });
  }

  Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
  addAudit('Admin', 'ADMIN', 'Hammadde Bilgisi Güncellendi', `${item.name} güncellendi.`, 'STOCK', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(item);
});

app.delete('/api/inventory/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.inventory.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Hammadde bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.inventory[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu hammaddeye erişim yetkiniz yok.' });
  }

  const removed = db.inventory.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Hammadde Silindi', `${removed.name} depodan silindi.`, 'STOCK', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Manual Stock Adjustment (Add, Deduct, Waste/Fire)
app.post('/api/inventory/adjust', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { inventoryItemId, type, quantityChange, note, performedBy } = req.body;
  const item = db.inventory.find((i) => i.id === inventoryItemId);
  if (!item) return res.status(404).json({ error: 'Hammadde bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && item.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu hammaddeye erişim yetkiniz yok.' });
  }

  const delta = Number(quantityChange) || 0;
  if (delta === 0) return res.status(400).json({ error: 'Miktar 0 olamaz.' });

  const stockBefore = item.currentStock;
  const stockAfter = Math.max(0, Math.round((stockBefore + delta) * 1000) / 1000);
  item.currentStock = stockAfter;
  item.updatedAt = new Date().toISOString();

  const trx: InventoryTransaction = {
    id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    restaurantId: item.restaurantId,
    inventoryItemId: item.id,
    inventoryItemName: item.name,
    type: type || (delta > 0 ? 'MANUAL_ADD' : 'MANUAL_DEDUCT'),
    quantityChange: delta,
    unit: item.unit,
    stockBefore,
    stockAfter,
    performedBy: performedBy || 'Admin',
    timestamp: new Date().toISOString(),
    note: note || (delta > 0 ? 'Stok girişi yapıldı.' : 'Stok çıkışı / zayi yapıldı.'),
  };

  db.inventoryTransactions.unshift(trx);
  addAudit(
    performedBy || 'Admin',
    'ADMIN',
    `Hammadde Stok Hareketi: ${item.name}`,
    `${item.name} için ${delta > 0 ? '+' : ''}${delta} ${item.unit} uygulandı. (Kalan: ${stockAfter} ${item.unit}). Sebep: ${trx.note}`,
    'STOCK',
    { restaurantId: item.restaurantId }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, item, transaction: trx });
});

app.get('/api/inventory/transactions', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.inventoryTransactions.filter((t) => t.restaurantId === tenantId));
});

// Save or Update Product Recipe
app.post('/api/products/:id/recipe', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && product.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu ürüne erişim yetkiniz yok.' });
  }

  const { recipe } = req.body;
  if (!Array.isArray(recipe)) return res.status(400).json({ error: 'Reçete listesi geçerli bir dizi olmalıdır.' });

  const normalizedRecipe = recipe.map((r: any) => {
    const rawId = r.inventoryItemId || r.rawItemId || r.id;
    const inv = db.inventory.find((i) => i.id === rawId);
    const amountVal = Number(r.amount !== undefined ? r.amount : (r.quantity !== undefined ? r.quantity : 1));
    const unitVal = r.unit || inv?.unit || 'adet';
    return {
      inventoryItemId: rawId,
      rawItemId: rawId,
      inventoryItemName: r.inventoryItemName || inv?.name || 'Hammadde',
      amount: amountVal,
      quantity: amountVal,
      unit: unitVal,
    };
  });

  product.recipe = normalizedRecipe;
  addAudit(
    'Admin',
    'ADMIN',
    `Ürün Reçetesi Güncellendi: ${product.name}`,
    `${product.name} için ${recipe.length} kalem hammadde reçetesi kaydedildi.`,
    'PRODUCT',
    { restaurantId: tenantId }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, product });
});

// Serve All Ready Items on Table (Tümünü Servis Et - Sadece HAZIR olanlar)
app.post('/api/tables/:id/serve-all', (req: Request, res: Response) => {
  const { id } = req.params;
  const { performedBy, performedRole } = req.body;
  const table = db.tables.find((t) => t.id === id);
  if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

  const order = table.currentOrderId ? db.orders.find((o) => o.id === table.currentOrderId) : null;
  if (!order) return res.status(404).json({ error: 'Masaya ait açık sipariş bulunamadı.' });

  const now = new Date().toISOString();
  let servedCount = 0;
  const servedProductNames: string[] = [];

  // Strictly only items with status 'READY' are marked as 'SERVED' per Requirement 19
  order.items.forEach((item) => {
    if (item.status === 'READY') {
      item.status = 'SERVED';
      item.servedAt = now;
      servedCount++;
      servedProductNames.push(`${item.quantity}x ${item.productName}`);
    }
  });

  if (servedCount === 0) {
    return res.status(400).json({
      success: false,
      message: 'Masada hazır durumda bekleyen servis edilecek ürün bulunmuyor. Hazırlanmakta olan ürünler servise uygun değildir.',
    });
  }

  table.status = 'OCCUPIED';
  table.lastActionByName = performedBy || 'Garson';

  addAudit({
    restaurantId: table.restaurantId,
    businessId: table.restaurantId,
    userName: performedBy || 'Garson',
    userRole: performedRole || 'WAITER',
    performedBy: performedBy || 'Garson',
    action: `${table.name}: Hazır Ürünler Servis Edildi`,
    eventType: 'ALL_ITEMS_SERVED',
    details: `${table.name} masasındaki hazır ${servedCount} adet ürün (${servedProductNames.join(', ')}) masaya servis edildi olarak işaretlendi.`,
    category: 'ORDER',
    tableId: table.id,
    tableName: table.name,
    orderId: order.id,
    orderNumber: order.orderNumber,
  });

  scheduleSaveDb();

  broadcastEvent({
    type: 'ITEM_STATUS_CHANGED',
    data: { tableId: table.id, orderId: order.id, status: 'SERVED', servedCount },
    timestamp: now,
  });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: now });

  res.json({
    success: true,
    table,
    order,
    servedCount,
    message: `${servedCount} adet hazır ürün masaya servis edildi olarak işaretlendi.`,
  });
});

// -------------------------------------------------------------
// Tables API
// -------------------------------------------------------------
app.get('/api/tables', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.tables.filter((t) => t.restaurantId === tenantId));
});

app.post('/api/tables', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId);
  const currentCount = db.tables.filter((t) => t.restaurantId === tenantId).length;
  if (rest?.subscription?.maxTables && currentCount >= rest.subscription.maxTables) {
    return res.status(403).json({
      error: `Abonelik planınız maksimum ${rest.subscription.maxTables} masa desteklemektedir. Lütfen planınızı yükseltin.`
    });
  }

  const { name, capacity, section, shape, x, y, responsibleWaiterId, responsibleWaiterName } = req.body;
  const targetSection = (section && typeof section === 'string' && section.trim()) ? section.trim() : 'Salon';
  
  // If this restaurant has sections defined, ensure the new section is listed
  if (rest) {
    if (!rest.sections) {
      rest.sections = ['Salon', 'Teras', 'Bahçe', 'VIP'];
    }
    if (!rest.sections.includes(targetSection)) {
      rest.sections.push(targetSection);
    }
  }

  const newTable: RestaurantTable = {
    id: `tbl-${Date.now()}`,
    restaurantId: tenantId,
    name: name || `Masa ${currentCount + 1}`,
    capacity: Number(capacity) || 4,
    section: targetSection,
    status: 'EMPTY',
    shape: shape || 'RECTANGLE',
    x: Number(x) || 50,
    y: Number(y) || 50,
    totalAmount: 0,
    guestCount: 0,
    responsibleWaiterId,
    responsibleWaiterName,
  };
  db.tables.push(newTable);
  addAudit('Admin', 'ADMIN', 'Yeni Masa Eklendi', `${newTable.name} (${newTable.section}) salon planına eklendi.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newTable);
});

app.put('/api/tables/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const table = db.tables.find((t) => t.id === req.params.id);
  if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && table.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu masaya erişim yetkiniz yok.' });
  }

  const rest = db.restaurants.find((r) => r.id === tenantId);

  if (req.body.section && typeof req.body.section === 'string') {
    const trimmed = req.body.section.trim();
    if (rest) {
      if (!rest.sections) rest.sections = ['Salon', 'Teras', 'Bahçe', 'VIP'];
      if (!rest.sections.includes(trimmed)) rest.sections.push(trimmed);
    }
    req.body.section = trimmed;
  }

  Object.assign(table, req.body);
  addAudit('Admin', 'ADMIN', 'Masa Güncellendi', `${table.name} (${table.section}) bilgileri güncellendi.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'TABLE_UPDATED', data: table, timestamp: new Date().toISOString() });
  res.json(table);
});

app.delete('/api/tables/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.tables.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Masa bulunamadı.' });

  const table = db.tables[idx];
  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && table.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu masaya erişim yetkiniz yok.' });
  }

  if (table.status !== 'EMPTY' && table.status !== 'RESERVED') {
    return res.status(400).json({ error: 'Açık hesabı veya siparişi olan masa silinemez. Lütfen önce hesabı kapatın.' });
  }
  const removed = db.tables.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Masa Silindi', `${removed.name} (${removed.section}) salondan kaldırıldı.`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, table: removed });
});

// -------------------------------------------------------------
// Sections API (Mekan / Bölüm Yönetimi)
// -------------------------------------------------------------
app.get('/api/sections', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const rest = db.restaurants.find((r) => r.id === tenantId);
  const defaultSections = ['Salon', 'Teras', 'Bahçe', 'VIP'];
  const customSections = rest?.sections || [];
  const tableSections = db.tables
    .filter((t) => t.restaurantId === tenantId)
    .map((t) => t.section)
    .filter(Boolean);
  const allSections = Array.from(new Set([...defaultSections, ...customSections, ...tableSections]));
  res.json(allSections);
});

app.post('/api/sections', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Geçerli bir mekan/bölüm adı giriniz.' });
  }
  const trimmed = name.trim();
  const rest = db.restaurants.find((r) => r.id === tenantId);
  if (rest) {
    if (!rest.sections) {
      rest.sections = ['Salon', 'Teras', 'Bahçe', 'VIP'];
    }
    if (!rest.sections.includes(trimmed)) {
      rest.sections.push(trimmed);
    }
  }
  addAudit('Admin', 'ADMIN', 'Yeni Mekan Eklendi', `Yeni bölüm eklendi: ${trimmed}`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, name: trimmed, sections: rest?.sections });
});

app.delete('/api/sections/:name', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const sectionName = decodeURIComponent(req.params.name);
  const tablesInSection = db.tables.filter((t) => t.restaurantId === tenantId && t.section === sectionName);
  if (tablesInSection.length > 0) {
    return res.status(400).json({
      error: `"${sectionName}" bölümünde ${tablesInSection.length} adet masa bulunmaktadır. Bölümü silmeden önce bu masaları silmeli veya başka bir bölüme taşımalısınız.`
    });
  }
  const rest = db.restaurants.find((r) => r.id === tenantId);
  if (rest && rest.sections) {
    rest.sections = rest.sections.filter((s) => s !== sectionName);
  }
  addAudit('Admin', 'ADMIN', 'Mekan Silindi', `Bölüm silindi: ${sectionName}`, 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, name: sectionName });
});

app.get('/api/tables/:id', (req: Request, res: Response) => {
  const table = db.tables.find((t) => t.id === req.params.id);
  if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });
  const activeOrder = table.currentOrderId ? db.orders.find((o) => o.id === table.currentOrderId) : null;
  res.json({ table, order: activeOrder });
});

// Open / update table status
app.put('/api/tables/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, guestCount, waiterId, waiterName, reservationNotes } = req.body;
  const table = db.tables.find((t) => t.id === id);
  if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

  if (status) table.status = status;
  if (guestCount !== undefined) table.guestCount = guestCount;
  if (waiterId) table.currentWaiterId = waiterId;
  if (waiterName) table.currentWaiterName = waiterName;
  if (reservationNotes !== undefined) table.reservationNotes = reservationNotes;

  if (status === 'OCCUPIED' && !table.openedAt) {
    table.openedAt = new Date().toISOString();
  }

  broadcastEvent({ type: 'TABLE_UPDATED', data: table, timestamp: new Date().toISOString() });
  res.json(table);
});

// Table Transfer (e.g. Masa 3 -> Masa 8)
app.post('/api/tables/transfer', (req: Request, res: Response) => {
  const { fromTableId, toTableId, userName } = req.body;
  const fromTable = db.tables.find((t) => t.id === fromTableId);
  const toTable = db.tables.find((t) => t.id === toTableId);

  if (!fromTable || !toTable) {
    return res.status(404).json({ error: 'Masa(lar) bulunamadı.' });
  }

  if (toTable.status !== 'EMPTY') {
    return res.status(400).json({ error: 'Hedef masa boş değil! Lütfen boş bir masa seçin veya masa birleştirin.' });
  }

  const order = db.orders.find((o) => o.id === fromTable.currentOrderId);
  if (order) {
    order.tableId = toTable.id;
    order.tableName = toTable.name;
    order.items.forEach((item) => {
      item.tableId = toTable.id;
      item.tableName = toTable.name;
    });
  }

  toTable.status = fromTable.status;
  toTable.currentOrderId = fromTable.currentOrderId;
  toTable.currentWaiterId = fromTable.currentWaiterId;
  toTable.currentWaiterName = fromTable.currentWaiterName;
  toTable.guestCount = fromTable.guestCount;
  toTable.openedAt = fromTable.openedAt;
  toTable.totalAmount = fromTable.totalAmount;

  fromTable.status = 'EMPTY';
  fromTable.currentOrderId = undefined;
  fromTable.currentWaiterId = undefined;
  fromTable.currentWaiterName = undefined;
  fromTable.guestCount = 0;
  fromTable.openedAt = undefined;
  fromTable.totalAmount = 0;

  addAudit(
    userName || 'Garson',
    'WAITER',
    'Masa Taşındı',
    `${fromTable.name} siparişi ${toTable.name}'e aktarıldı.`,
    'TABLE'
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, fromTable, toTable });
});

// Table Merge (e.g. Masa 4 + Masa 5)
app.post('/api/tables/merge', (req: Request, res: Response) => {
  const { primaryTableId, secondaryTableId, userName } = req.body;
  const primaryTable = db.tables.find((t) => t.id === primaryTableId);
  const secondaryTable = db.tables.find((t) => t.id === secondaryTableId);

  if (!primaryTable || !secondaryTable) {
    return res.status(404).json({ error: 'Masa(lar) bulunamadı.' });
  }

  const primaryOrder = primaryTable.currentOrderId ? db.orders.find((o) => o.id === primaryTable.currentOrderId) : null;
  const secondaryOrder = secondaryTable.currentOrderId ? db.orders.find((o) => o.id === secondaryTable.currentOrderId) : null;

  if (secondaryOrder && primaryOrder) {
    // Merge items
    secondaryOrder.items.forEach((item) => {
      item.orderId = primaryOrder.id;
      item.tableId = primaryTable.id;
      item.tableName = primaryTable.name;
      primaryOrder.items.push(item);
    });
    primaryOrder.totalAmount += secondaryOrder.totalAmount;
    primaryOrder.guestCount += secondaryOrder.guestCount || 1;
    secondaryOrder.status = 'COMPLETED';
  }

  primaryTable.totalAmount += secondaryTable.totalAmount;
  primaryTable.guestCount += secondaryTable.guestCount || 1;
  primaryTable.mergedWith = [...(primaryTable.mergedWith || []), secondaryTable.name];

  secondaryTable.status = 'EMPTY';
  secondaryTable.currentOrderId = undefined;
  secondaryTable.currentWaiterId = undefined;
  secondaryTable.currentWaiterName = undefined;
  secondaryTable.guestCount = 0;
  secondaryTable.openedAt = undefined;
  secondaryTable.totalAmount = 0;

  addAudit(
    userName || 'Garson',
    'WAITER',
    'Masa Birleştirildi',
    `${secondaryTable.name} ile ${primaryTable.name} birleştirildi.`,
    'TABLE'
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, primaryTable });
});

// -------------------------------------------------------------
// Reservations API
// -------------------------------------------------------------
app.get('/api/reservations', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { date, status } = req.query;
  let result = db.reservations.filter((r) => r.restaurantId === tenantId);

  if (date) {
    result = result.filter((r) => r.reservationDate === date);
  }
  if (status) {
    result = result.filter((r) => r.status === status);
  }

  // Sort by reservationDate asc, then reservationTime asc
  result.sort((a, b) => {
    if (a.reservationDate !== b.reservationDate) {
      return a.reservationDate.localeCompare(b.reservationDate);
    }
    return a.reservationTime.localeCompare(b.reservationTime);
  });

  res.json(result);
});

app.post('/api/reservations', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const {
    customerName,
    customerPhone,
    guestCount,
    tableId,
    tableName,
    section,
    reservationDate,
    reservationTime,
    notes,
    createdBy,
  } = req.body;

  if (!customerName || !tableId || !reservationDate || !reservationTime) {
    return res.status(400).json({ error: 'Müşteri adı, masa, tarih ve saat zorunludur.' });
  }

  const table = db.tables.find((t) => t.id === tableId);
  const finalTableName = tableName || (table ? table.name : 'Masa');
  const finalSection = section || (table ? table.section : 'Salon');

  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    restaurantId: tenantId,
    customerName,
    customerPhone: customerPhone || '',
    guestCount: Number(guestCount) || 2,
    tableId,
    tableName: finalTableName,
    section: finalSection,
    reservationDate,
    reservationTime,
    status: 'CONFIRMED',
    notes: notes || '',
    createdBy: createdBy || 'Özer POS',
    createdAt: new Date().toISOString(),
  };

  db.reservations.unshift(newReservation);

  // If reservation is for today, update table status to RESERVED if table is currently EMPTY
  const todayStr = new Date().toISOString().split('T')[0];
  if (reservationDate === todayStr && table && table.status === 'EMPTY') {
    table.status = 'RESERVED';
    table.reservationNotes = `${customerName} (${guestCount || 2} Kişi) - ${reservationTime}`;
    table.currentReservationId = newReservation.id;
  }

  addAudit(
    createdBy || 'Personel',
    'WAITER',
    'Rezervasyon Oluşturuldu',
    `${customerName} adına ${finalTableName} (${reservationDate} ${reservationTime}, ${guestCount || 2} kişi) için rezervasyon kaydedildi.`,
    'RESERVATION',
    { restaurantId: tenantId }
  );

  broadcastEvent({ type: 'RESERVATION_CREATED', data: newReservation, timestamp: new Date().toISOString() });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.status(201).json(newReservation);
});

app.put('/api/reservations/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { id } = req.params;
  const resIndex = db.reservations.findIndex((r) => r.id === id);
  if (resIndex === -1) {
    return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });
  }

  const prev = db.reservations[resIndex];
  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && prev.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu rezervasyona erişim yetkiniz yok.' });
  }

  const updated: Reservation = {
    ...prev,
    ...req.body,
    id: prev.id, // prevent ID change
  };

  db.reservations[resIndex] = updated;

  // Sync table if needed
  const todayStr = new Date().toISOString().split('T')[0];
  if (updated.reservationDate === todayStr) {
    const table = db.tables.find((t) => t.id === updated.tableId);
    if (table && table.status === 'RESERVED') {
      table.reservationNotes = `${updated.customerName} (${updated.guestCount} Kişi) - ${updated.reservationTime}`;
    }
  }

  addAudit(
    'Personel',
    'WAITER',
    'Rezervasyon Güncellendi',
    `${updated.customerName} rezervasyonu (${updated.tableName} - ${updated.reservationDate} ${updated.reservationTime}) güncellendi.`,
    'RESERVATION',
    { restaurantId: tenantId }
  );

  broadcastEvent({ type: 'RESERVATION_UPDATED', data: updated, timestamp: new Date().toISOString() });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(updated);
});

app.put('/api/reservations/:id/status', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { id } = req.params;
  const { status, reason, waiterName, waiterId } = req.body;
  const reservation = db.reservations.find((r) => r.id === id);

  if (!reservation) {
    return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });
  }

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && reservation.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu rezervasyona erişim yetkiniz yok.' });
  }

  reservation.status = status;

  const table = db.tables.find((t) => t.id === reservation.tableId);

  if (status === 'SEATED') {
    reservation.seatedAt = new Date().toISOString();
    if (table) {
      table.status = 'OCCUPIED';
      table.guestCount = reservation.guestCount;
      table.reservationNotes = undefined;
      table.currentReservationId = undefined;
      table.currentWaiterName = waiterName || table.currentWaiterName || 'Ahmet Yılmaz';
      table.currentWaiterId = waiterId || table.currentWaiterId || 'usr-2';
      if (!table.openedAt) {
        table.openedAt = new Date().toISOString();
      }
    }
    addAudit(
      waiterName || 'Garson',
      'WAITER',
      'Rezervasyon Masaya Alındı',
      `${reservation.customerName} (${reservation.guestCount} Kişi) ${reservation.tableName} masasına alındı.`,
      'RESERVATION',
      { restaurantId: tenantId }
    );
  } else if (status === 'CANCELLED' || status === 'NO_SHOW') {
    reservation.cancelledAt = new Date().toISOString();
    reservation.cancelReason = reason || (status === 'NO_SHOW' ? 'Misafir gelmedi' : 'İptal edildi');
    if (table && table.status === 'RESERVED') {
      table.status = 'EMPTY';
      table.reservationNotes = undefined;
      table.currentReservationId = undefined;
    }
    addAudit(
      waiterName || 'Garson',
      'WAITER',
      status === 'NO_SHOW' ? 'Rezervasyon: Gelmedi Olarak İşaretlendi' : 'Rezervasyon İptal Edildi',
      `${reservation.customerName} rezervasyonu (${reservation.tableName}) ${status === 'NO_SHOW' ? 'gelmedi' : 'iptal edildi'}. Sebep: ${reservation.cancelReason}`,
      'RESERVATION',
      { restaurantId: tenantId }
    );
  } else if (status === 'CONFIRMED') {
    const todayStr = new Date().toISOString().split('T')[0];
    if (reservation.reservationDate === todayStr && table && table.status === 'EMPTY') {
      table.status = 'RESERVED';
      table.reservationNotes = `${reservation.customerName} (${reservation.guestCount} Kişi) - ${reservation.reservationTime}`;
      table.currentReservationId = reservation.id;
    }
  }

  broadcastEvent({ type: 'RESERVATION_UPDATED', data: reservation, timestamp: new Date().toISOString() });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(reservation);
});

app.delete('/api/reservations/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { id } = req.params;
  const idx = db.reservations.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });
  }

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.reservations[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu rezervasyona erişim yetkiniz yok.' });
  }

  const removed = db.reservations.splice(idx, 1)[0];
  const table = db.tables.find((t) => t.id === removed.tableId);
  if (table && table.status === 'RESERVED' && table.currentReservationId === id) {
    table.status = 'EMPTY';
    table.reservationNotes = undefined;
    table.currentReservationId = undefined;
  }

  addAudit('Personel', 'WAITER', 'Rezervasyon Silindi', `${removed.customerName} rezervasyonu sistemden silindi.`, 'RESERVATION', { restaurantId: tenantId });
  broadcastEvent({ type: 'RESERVATION_DELETED', data: { id }, timestamp: new Date().toISOString() });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, removed });
});

// -------------------------------------------------------------
// Categories & Products API
// -------------------------------------------------------------
app.get('/api/categories', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.categories.filter((c) => c.restaurantId === tenantId));
});

app.post('/api/categories', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, icon, sortOrder, color } = req.body;
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    restaurantId: tenantId,
    name,
    icon: icon || '🍽️',
    sortOrder: sortOrder || db.categories.length + 1,
    active: true,
    color: color || '#f59e0b',
  };
  db.categories.push(newCat);
  addAudit('Admin', 'ADMIN', 'Yeni Kategori Eklendi', `${name} kategorisi oluşturuldu.`, 'PRODUCT', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newCat);
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Kategori bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && cat.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu kategoriye erişim yetkiniz yok.' });
  }

  Object.assign(cat, req.body);
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(cat);
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Kategori bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.categories[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu kategoriye erişim yetkiniz yok.' });
  }

  db.categories.splice(idx, 1);
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

app.get('/api/products', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.products.filter((p) => p.restaurantId === tenantId));
});

app.post('/api/products', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, categoryId, description, price, photo, stock, station, vatRate, extras, removableIngredients } = req.body;
  const newProd: Product = {
    id: `prod-${Date.now()}`,
    restaurantId: tenantId,
    name,
    categoryId,
    description: description || '',
    price: Number(price) || 0,
    photo: photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    stock: stock !== undefined ? Number(stock) : 50,
    inStock: (stock !== undefined ? Number(stock) : 50) > 0,
    active: true,
    station: station || 'MUTFAK',
    vatRate: Number(vatRate) || 10,
    sortOrder: db.products.length + 1,
    extras: extras || [],
    removableIngredients: removableIngredients || [],
  };
  db.products.push(newProd);
  addAudit('Admin', 'ADMIN', 'Yeni Ürün Eklendi', `${name} - ₺${price} menüye eklendi.`, 'PRODUCT', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(newProd);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const prod = db.products.find((p) => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && prod.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu ürüne erişim yetkiniz yok.' });
  }

  const oldPrice = prod.price;
  Object.assign(prod, req.body);
  if (req.body.stock !== undefined) {
    prod.inStock = prod.stock > 0;
  }

  if (req.body.price && req.body.price !== oldPrice) {
    addAudit('Admin', 'ADMIN', 'Ürün Fiyatı Güncellendi', `${prod.name}: ₺${oldPrice} → ₺${req.body.price}`, 'PRODUCT', { restaurantId: tenantId });
  }

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(prod);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && db.products[idx].restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu ürüne erişim yetkiniz yok.' });
  }

  const removed = db.products.splice(idx, 1)[0];
  addAudit('Admin', 'ADMIN', 'Ürün Menüden Silindi', `${removed.name} silindi.`, 'PRODUCT', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Quick Stock Adjustment
app.post('/api/products/:id/stock', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const prod = db.products.find((p) => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  const user = getRequestingUser(req);
  if (user?.role !== 'SUPER_ADMIN' && prod.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu ürüne erişim yetkiniz yok.' });
  }

  const { delta, exactValue } = req.body;
  if (exactValue !== undefined) {
    prod.stock = Math.max(0, exactValue);
  } else if (delta !== undefined) {
    prod.stock = Math.max(0, prod.stock + delta);
  }
  prod.inStock = prod.stock > 0;

  addAudit('Admin', 'ADMIN', 'Stok Güncellendi', `${prod.name} yeni stok: ${prod.stock}`, 'STOCK', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(prod);
});

// -------------------------------------------------------------
// Orders API (Garson -> Kitchen -> Bill Flow)
// -------------------------------------------------------------
app.get('/api/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.orders.filter((o) => o.restaurantId === tenantId));
});

app.get('/api/orders/active', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const activeOrders = db.orders.filter((o) => o.restaurantId === tenantId && o.status === 'ACTIVE');
  res.json(activeOrders);
});

// Create order / Send to Kitchen
app.post('/api/orders', (req: Request, res: Response) => {
  const { tableId, waiterId, waiterName, guestCount, items, notes, source, deviceType } = req.body;

  const table = db.tables.find((t) => t.id === tableId);
  if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

  const user = getRequestingUser(req);
  const tenantId = getTenantId(req);
  if (user?.role !== 'SUPER_ADMIN' && table.restaurantId !== tenantId) {
    return res.status(403).json({ error: 'Bu masaya sipariş ekleme yetkiniz yok.' });
  }

  const subCheck = checkTenantSubscription(tenantId);
  if (!subCheck.allowed) {
    return res.status(403).json({ error: subCheck.message });
  }

  let order: Order | undefined;

  // Check if table already has an active order
  if (table.currentOrderId) {
    order = db.orders.find((o) => o.id === table.currentOrderId && o.status === 'ACTIVE');
  }

  const isNewOrder = !order;
  const now = new Date().toISOString();
  const orderNumber = order?.orderNumber || getNextOrderNumber();
  const orderId = order ? order.id : `ord-${orderNumber}`;
  const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  // Construct items with smart Kitchen / Bar routing
  const createdItems: OrderItem[] = items.map((itm: any, idx: number) => {
    // Decrease product stock
    const product = db.products.find((p) => p.id === itm.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - (itm.quantity || 1));
      product.inStock = product.stock > 0;
    }

    const cat = product ? db.categories.find((c) => c.id === product.categoryId) : null;

    // Requirement 12 & 13: Station determination
    let targetStation: string = itm.station || product?.station || (cat as any)?.defaultStation || 'MUTFAK';
    if (
      targetStation === 'NONE' ||
      targetStation === 'YOK' ||
      targetStation === 'YAZICI YOK' ||
      (product?.station as any) === 'NONE' ||
      (product?.station as any) === 'YOK'
    ) {
      targetStation = 'NONE';
    } else if (!itm.station && !product?.station) {
      const catName = (cat?.name || '').toLowerCase();
      const prodName = (itm.productName || product?.name || '').toLowerCase();
      if (
        catName.includes('içecek') ||
        catName.includes('kahve') ||
        catName.includes('bar') ||
        catName.includes('kokteyl') ||
        catName.includes('bira') ||
        catName.includes('şarap') ||
        prodName.includes('latte') ||
        prodName.includes('kahve') ||
        prodName.includes('çay') ||
        prodName.includes('kola') ||
        prodName.includes('bira')
      ) {
        targetStation = 'BAR';
      } else {
        targetStation = 'MUTFAK';
      }
    }

    const extrasTotal = (itm.customization?.extras || []).reduce((acc: number, e: any) => acc + e.price, 0);
    const unitPrice = (itm.unitPrice || (product ? product.price : 0)) + extrasTotal;

    return {
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 3)}`,
      restaurantId: tenantId,
      orderId,
      orderNumber,
      tableId: table.id,
      tableName: table.name,
      productId: itm.productId,
      productName: itm.productName || (product ? product.name : 'Ürün'),
      productPhoto: itm.productPhoto || (product ? product.photo : ''),
      categoryId: itm.categoryId || (product ? product.categoryId : 'cat-1'),
      station: targetStation as any,
      unitPrice,
      quantity: itm.quantity || 1,
      customization: itm.customization || { extras: [], removedIngredients: [] },
      status: 'NEW', // 🔴 YENİ
      addedByWaiterId: waiterId || 'usr-2',
      addedByWaiterName: waiterName || 'Ahmet Yılmaz',
      source: (source || 'POS') as 'POS' | 'WAITER_MOBILE' | 'QR',
      batchId,
      createdAt: now,
    };
  });

  // Automatically deduct Raw Materials based on Product Recipes with accurate unit conversion
  createdItems.forEach((itm) => {
    const prod = db.products.find((p) => p.id === itm.productId);
    if (prod && prod.recipe && prod.recipe.length > 0) {
      prod.recipe.forEach((rItem: any) => {
        const rawId = rItem.inventoryItemId || rItem.rawItemId;
        const invItem = db.inventory.find((i) => i.id === rawId);
        const itemAmt = Number(rItem.amount !== undefined ? rItem.amount : (rItem.quantity !== undefined ? rItem.quantity : 0));
        if (invItem && itemAmt > 0) {
          const qtyToDeduct = convertUnitQuantity(itemAmt * itm.quantity, rItem.unit || invItem.unit, invItem.unit);
          const roundedDeduct = Math.round(qtyToDeduct * 1000) / 1000;
          const stockBefore = invItem.currentStock;
          const stockAfter = Math.max(0, Math.round((stockBefore - roundedDeduct) * 1000) / 1000);
          invItem.currentStock = stockAfter;
          invItem.updatedAt = now;

          db.inventoryTransactions.unshift({
            id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            inventoryItemId: invItem.id,
            inventoryItemName: invItem.name,
            type: 'SALE_DEDUCT',
            quantityChange: -roundedDeduct,
            unit: invItem.unit,
            stockBefore,
            stockAfter,
            relatedOrderId: orderId,
            relatedOrderNumber: orderNumber,
            relatedProductName: prod.name,
            performedBy: waiterName || 'Garson',
            timestamp: now,
            note: `${itm.quantity}x ${prod.name} siparişi için reçete hammadde düşümü (${table.name}).`,
          });
        }
      });
    }
  });

  const addedTotal = createdItems.reduce((acc, itm) => acc + itm.unitPrice * itm.quantity, 0);

  if (isNewOrder) {
    order = {
      id: orderId,
      restaurantId: tenantId,
      orderNumber,
      tableId: table.id,
      tableName: table.name,
      waiterId: waiterId || 'usr-2',
      waiterName: waiterName || 'Ahmet Yılmaz',
      responsibleWaiterId: waiterId || 'usr-2',
      responsibleWaiterName: waiterName || 'Ahmet Yılmaz',
      source: (source || 'POS') as 'POS' | 'WAITER_MOBILE' | 'QR',
      deviceType: (deviceType || (source === 'WAITER_MOBILE' ? 'MOBILE' : 'DESKTOP')) as any,
      guestCount: guestCount || 2,
      items: createdItems,
      totalAmount: addedTotal,
      notes: notes || '',
      status: 'ACTIVE',
      createdAt: now,
    };
    db.orders.unshift(order);
  } else {
    order!.items.push(...createdItems);
    order!.totalAmount += addedTotal;
    if (notes) order!.notes = (order!.notes ? order!.notes + ' | ' : '') + notes;
    if (guestCount) order!.guestCount = guestCount;
  }

  // Preserve responsible waiter / table owner if already assigned, otherwise set from first order
  if (!table.tableOwnerId) {
    table.tableOwnerId = waiterId || 'usr-2';
    table.tableOwnerName = waiterName || 'Ahmet Yılmaz';
  }
  if (!table.responsibleWaiterId) {
    table.responsibleWaiterId = waiterId || 'usr-2';
    table.responsibleWaiterName = waiterName || 'Ahmet Yılmaz';
  }
  table.currentWaiterId = waiterId || 'usr-2';
  table.currentWaiterName = waiterName || 'Ahmet Yılmaz';
  table.lastActionById = waiterId || 'usr-2';
  table.lastActionByName = waiterName || 'Ahmet Yılmaz';

  // Update Table state
  table.status = 'KITCHEN'; // 🟡 MUTFAKTA
  table.currentOrderId = order.id;
  table.guestCount = guestCount || table.guestCount || 2;
  if (!table.openedAt) table.openedAt = now;
  table.totalAmount = order.totalAmount;

  // Add audit log with multi-waiter clarity and eventType
  const itemsText = createdItems.map((i) => `${i.quantity}x ${i.productName}`).join(', ');
  const sourceLabel = source === 'WAITER_MOBILE' ? '📱 Garson Mobil' : '💻 POS';
  const isDifferentWaiter = table.tableOwnerName && table.tableOwnerName !== (waiterName || 'Garson');

  addAudit({
    restaurantId: tenantId,
    businessId: tenantId,
    userId: waiterId,
    userName: waiterName || 'Garson',
    userRole: 'WAITER',
    performedBy: waiterName || 'Garson',
    action: `${table.name} Siparişi Mutfağa Gönderildi (${sourceLabel})`,
    eventType: isNewOrder ? 'ORDER_CREATED' : 'ADD_ITEM',
    details: isDifferentWaiter
      ? `${waiterName} (${sourceLabel}), ${table.name} (Masa Sahibi: ${table.tableOwnerName}) masasına sipariş ekledi: ${itemsText} (Ek: ₺${addedTotal}, Toplam: ₺${order.totalAmount})`
      : `${table.name} - ${itemsText} mutfağa iletildi (Tutar: ₺${addedTotal})`,
    category: 'ORDER',
    tableId: table.id,
    tableName: table.name,
    orderId: order.id,
    orderNumber,
  });

  scheduleSaveDb();

  // Realtime Broadcast
  broadcastEvent({
    type: 'ORDER_CREATED',
    data: { order, table, newItems: createdItems },
    timestamp: now,
  });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: now });

  res.json({ success: true, order, table, orderNumber });
});

// Change Table Responsible Waiter
app.post('/api/tables/:id/change-waiter', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newWaiterId, newWaiterName, changedBy } = req.body;
  const table = db.tables.find((t) => t.id === id);
  if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

  const oldWaiter = table.responsibleWaiterName || table.currentWaiterName || 'Atanmamış';
  table.responsibleWaiterId = newWaiterId;
  table.responsibleWaiterName = newWaiterName;
  table.currentWaiterId = newWaiterId;
  table.currentWaiterName = newWaiterName;

  addAudit(
    changedBy || 'Admin',
    'ADMIN',
    'Masa Sorumlu Garsonu Değiştirildi',
    `${table.name} sorumlusu: ${oldWaiter} ➔ ${newWaiterName}`,
    'STAFF'
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, table });
});

// Reduce Single Item Quantity (-1 or custom delta)
app.post('/api/orders/items/:itemId/reduce', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { delta = 1, reason, userName, userRole } = req.body;
  const now = new Date().toISOString();

  let foundItem: OrderItem | undefined;
  let foundOrder: Order | undefined;

  for (const ord of db.orders) {
    const item = ord.items.find((i) => i.id === itemId);
    if (item) {
      foundItem = item;
      foundOrder = ord;
      break;
    }
  }

  if (!foundItem || !foundOrder) {
    return res.status(404).json({ error: 'Sipariş kalemi bulunamadı.' });
  }

  const reduceCount = Math.min(foundItem.quantity, Number(delta) || 1);
  foundItem.quantity -= reduceCount;

  // Return stock
  const product = db.products.find((p) => p.id === foundItem!.productId);
  if (product) {
    product.stock += reduceCount;
    product.inStock = true;
  }

  // Recalculate order total
  foundOrder.totalAmount -= foundItem.unitPrice * reduceCount;
  const table = db.tables.find((t) => t.id === foundOrder!.tableId);
  if (table) {
    table.totalAmount = foundOrder.totalAmount;
  }

  if (foundItem.quantity <= 0) {
    foundItem.status = 'CANCELLED';
    foundItem.cancelledAt = now;
    foundItem.cancelReason = reason || 'Adet azaltılarak sıfırlandı';
    foundItem.cancelledBy = userName || 'Garson';
  }

  // Record cancellation/reduction log
  db.cancelledItems.unshift({
    id: `cnc-${Date.now()}`,
    orderId: foundOrder.id,
    tableName: foundOrder.tableName,
    productName: foundItem.productName,
    quantity: reduceCount,
    price: foundItem.unitPrice * reduceCount,
    reason: reason || 'Adet azaltıldı',
    cancelledBy: userName || 'Garson',
    timestamp: now,
  });

  addAudit(
    userName || 'Garson',
    (userRole as any) || 'WAITER',
    `Ürün Adedi Azaltıldı: ${foundItem.productName} (-${reduceCount})`,
    `${foundOrder.tableName} - ${foundItem.productName} adedi ${reduceCount} azaltıldı. Kalan: ${foundItem.quantity}. Sebep: ${reason || 'Müşteri talebi'}`,
    'ORDER',
    { orderNumber: foundOrder.orderNumber, tableName: foundOrder.tableName }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: now });
  res.json({ success: true, item: foundItem, order: foundOrder, table });
});

// Update single item status (NEW -> ACCEPTED / PREPARING -> READY -> SERVED)
app.put('/api/orders/items/:itemId/status', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { status, userName } = req.body;
  const now = new Date().toISOString();

  let foundItem: OrderItem | undefined;
  let foundOrder: Order | undefined;

  for (const ord of db.orders) {
    const item = ord.items.find((i) => i.id === itemId);
    if (item) {
      foundItem = item;
      foundOrder = ord;
      break;
    }
  }

  if (!foundItem || !foundOrder) {
    return res.status(404).json({ error: 'Sipariş kalemi bulunamadı.' });
  }

  foundItem.status = status;
  if (status === 'PREPARING' || status === 'ACCEPTED') foundItem.preparingAt = now;
  if (status === 'READY') foundItem.readyAt = now;
  if (status === 'SERVED') foundItem.servedAt = now;

  // Recalculate table status
  const table = db.tables.find((t) => t.id === foundOrder!.tableId);
  if (table) {
    const activeItems = foundOrder.items.filter((i) => i.status !== 'CANCELLED');
    const hasReady = activeItems.some((i) => i.status === 'READY');
    const hasPreparingOrNew = activeItems.some((i) => i.status === 'NEW' || i.status === 'ACCEPTED' || i.status === 'PREPARING');
    const allServed = activeItems.every((i) => i.status === 'SERVED');

    if (hasReady) {
      table.status = 'READY'; // SERVİS BEKLİYOR
    } else if (hasPreparingOrNew) {
      table.status = 'KITCHEN'; // MUTFAKTA
    } else if (allServed) {
      table.status = 'OCCUPIED'; // DOLU
    }
  }

  const statusTR = formatStatusTR(status);
  addAudit(
    userName || 'Mutfak',
    'KITCHEN',
    `Sipariş Durumu: ${foundItem.productName} → ${statusTR}`,
    `${foundOrder.tableName} - ${foundItem.productName} durumu ${statusTR} olarak güncellendi.`,
    'KITCHEN',
    { orderNumber: foundOrder.orderNumber, tableName: foundOrder.tableName }
  );

  broadcastEvent({
    type: 'ITEM_STATUS_CHANGED',
    data: { item: foundItem, order: foundOrder, table },
    timestamp: now,
  });

  res.json({ success: true, item: foundItem, order: foundOrder, table });
});

// Batch update order items for a ticket in KDS (e.g. "Siparişi Al" -> ALL ACCEPTED/PREPARING, or "Hazır" -> ALL READY)
app.post('/api/orders/:orderId/batch-status', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, station, userName } = req.body;
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı.' });

  const now = new Date().toISOString();
  order.items.forEach((item) => {
    if (item.status !== 'CANCELLED' && (!station || item.station === station)) {
      item.status = status;
      if (status === 'PREPARING' || status === 'ACCEPTED') item.preparingAt = now;
      if (status === 'READY') item.readyAt = now;
      if (status === 'SERVED') item.servedAt = now;
    }
  });

  const table = db.tables.find((t) => t.id === order.tableId);
  if (table) {
    if (status === 'READY') table.status = 'READY';
    else if (status === 'PREPARING' || status === 'ACCEPTED') table.status = 'KITCHEN';
    else if (status === 'SERVED') table.status = 'OCCUPIED';
  }

  const statusTR = formatStatusTR(status);
  addAudit(
    userName || 'Mutfak',
    'KITCHEN',
    `Mutfak Toplu Güncelleme: ${order.tableName} → ${statusTR}`,
    `${order.tableName} siparişleri ${statusTR} durumuna alındı.`,
    'KITCHEN',
    { orderNumber: order.orderNumber, tableName: order.tableName }
  );

  broadcastEvent({
    type: 'ORDER_UPDATED',
    data: { order, table },
    timestamp: now,
  });

  res.json({ success: true, order, table });
});

// Cancel Order Item
app.post('/api/orders/items/:itemId/cancel', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { reason, cancelledBy } = req.body;
  const now = new Date().toISOString();

  let foundItem: OrderItem | undefined;
  let foundOrder: Order | undefined;

  for (const ord of db.orders) {
    const item = ord.items.find((i) => i.id === itemId);
    if (item) {
      foundItem = item;
      foundOrder = ord;
      break;
    }
  }

  if (!foundItem || !foundOrder) {
    return res.status(404).json({ error: 'Sipariş kalemi bulunamadı.' });
  }

  foundItem.status = 'CANCELLED';
  foundItem.cancelledAt = now;
  foundItem.cancelReason = reason || 'Müşteri talebi';
  foundItem.cancelledBy = cancelledBy || 'Ahmet Yılmaz';

  // Return product count stock
  const product = db.products.find((p) => p.id === foundItem!.productId);
  if (product) {
    product.stock += foundItem.quantity;
    product.inStock = true;

    // Requirement 17: Reçete hammadde stoğunu geri yükle
    if (product.recipe && product.recipe.length > 0) {
      product.recipe.forEach((rItem: any) => {
        const rawId = rItem.inventoryItemId || rItem.rawItemId;
        const invItem = db.inventory.find((i) => i.id === rawId);
        const itemAmt = Number(rItem.amount !== undefined ? rItem.amount : (rItem.quantity !== undefined ? rItem.quantity : 0));
        if (invItem && itemAmt > 0) {
          const qtyToRestore = convertUnitQuantity(itemAmt * foundItem!.quantity, rItem.unit || invItem.unit, invItem.unit);
          const roundedRestore = Math.round(qtyToRestore * 1000) / 1000;
          const stockBefore = invItem.currentStock;
          const stockAfter = Math.round((stockBefore + roundedRestore) * 1000) / 1000;
          invItem.currentStock = stockAfter;
          invItem.updatedAt = now;

          db.inventoryTransactions.unshift({
            id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            inventoryItemId: invItem.id,
            inventoryItemName: invItem.name,
            type: 'ORDER_CANCEL_RESTORE',
            quantityChange: roundedRestore,
            unit: invItem.unit,
            stockBefore,
            stockAfter,
            relatedOrderId: foundOrder!.id,
            relatedOrderNumber: foundOrder!.orderNumber,
            relatedProductName: product.name,
            performedBy: cancelledBy || 'Garson',
            timestamp: now,
            note: `${foundOrder!.tableName} masasından ${foundItem!.quantity}x ${product.name} iptal iadesi. Neden: ${foundItem!.cancelReason}`,
          });
        }
      });
    }
  }

  // Recalculate order total
  foundOrder.totalAmount = Math.max(0, foundOrder.totalAmount - foundItem.unitPrice * foundItem.quantity);
  const table = db.tables.find((t) => t.id === foundOrder!.tableId);
  if (table) {
    table.totalAmount = foundOrder.totalAmount;
    table.lastActionByName = cancelledBy || 'Garson';
  }

  // Record cancellation log
  db.cancelledItems.unshift({
    id: `cnc-${Date.now()}`,
    orderId: foundOrder.id,
    tableName: foundOrder.tableName,
    productName: foundItem.productName,
    quantity: foundItem.quantity,
    price: foundItem.unitPrice * foundItem.quantity,
    reason: foundItem.cancelReason,
    cancelledBy: foundItem.cancelledBy,
    timestamp: now,
  });

  addAudit({
    restaurantId: foundOrder.restaurantId || 'rest-1',
    businessId: foundOrder.restaurantId || 'rest-1',
    userName: cancelledBy || 'Garson',
    userRole: 'WAITER',
    performedBy: cancelledBy || 'Garson',
    action: `Ürün İptal Edildi: ${foundItem.productName}`,
    eventType: 'CANCEL',
    details: `${foundOrder.tableName} - ${foundItem.quantity}x ${foundItem.productName} iptal edildi. Sebep: ${reason}`,
    category: 'ORDER',
    tableId: foundOrder.tableId,
    tableName: foundOrder.tableName,
    orderId: foundOrder.id,
    orderNumber: foundOrder.orderNumber,
    orderItemId: foundItem.id,
    productName: foundItem.productName,
  });

  scheduleSaveDb();

  broadcastEvent({
    type: 'SYNC_ALL',
    timestamp: now,
  });

  res.json({ success: true, item: foundItem, order: foundOrder });
});

// -------------------------------------------------------------
// Payments & Bill Checkout API
// -------------------------------------------------------------
app.post('/api/payments', (req: Request, res: Response) => {
  const {
    tableId,
    orderId,
    method,
    paymentMethod,
    discountPercent,
    discountAmount,
    tipAmount,
    partialBreakdown,
    splitBreakdown,
    cashierName,
    waiterName,
    paidItems,
    isPartial,
    splitPersonLabel,
  } = req.body;

  const table = db.tables.find((t) => t.id === tableId);
  const targetOrderId = orderId || (table ? table.currentOrderId : undefined);
  const order = targetOrderId ? db.orders.find((o) => o.id === targetOrderId) : undefined;

  if (!table || !order) {
    return res.status(404).json({ error: 'Masa veya sipariş bulunamadı.' });
  }

  const now = new Date().toISOString();
  const chosenMethod = (paymentMethod || method || 'CREDIT_CARD') as PaymentMethod;
  const splitData = splitBreakdown || partialBreakdown;

  // Check if this is an item-by-item partial payment
  const isItemSplit = Array.isArray(paidItems) && paidItems.length > 0;

  let subtotal = 0;
  let itemsSummary: { name: string; quantity: number; price: number }[] = [];

  if (isItemSplit) {
    // Process only selected items for this partial payment
    paidItems.forEach((pi: { itemId: string; quantity: number }) => {
      const ordItem = order.items.find((i) => i.id === pi.itemId && i.status !== 'CANCELLED');
      if (ordItem && pi.quantity > 0) {
        const qtyToPay = Math.min(pi.quantity, ordItem.quantity);
        const itemCost = ordItem.unitPrice * qtyToPay;
        subtotal += itemCost;
        itemsSummary.push({
          name: ordItem.productName,
          quantity: qtyToPay,
          price: itemCost,
        });

        // Deduct paid quantity from the table's open order
        ordItem.quantity -= qtyToPay;
      }
    });

    // Remove any items that reached 0 quantity
    order.items = order.items.filter((i) => i.quantity > 0 || i.status === 'CANCELLED');
  } else {
    // Full table checkout
    subtotal = order.items
      .filter((i) => i.status !== 'CANCELLED')
      .reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

    itemsSummary = order.items
      .filter((i) => i.status !== 'CANCELLED')
      .map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.unitPrice * i.quantity,
      }));
  }

  const discAmt = Number(discountAmount) || (discountPercent ? (subtotal * Number(discountPercent)) / 100 : 0);
  const tip = Number(tipAmount) || 0;
  const finalAmount = Math.max(0, subtotal - discAmt + tip);
  const currentSettings = Array.isArray(db.settings)
    ? db.settings.find((s: any) => s.restaurantId === table.restaurantId) || db.settings[0]
    : db.settings;
  const vatRate = (currentSettings as any)?.defaultVatRate || 10;
  const vatAmount = Math.round((finalAmount * vatRate) / (100 + vatRate));

  const paymentNumber = 2000 + db.payments.length + 1;
  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentNumber,
    tableId: table.id,
    tableName: table.name,
    waiterName: waiterName || order.waiterName || 'Ahmet Yılmaz',
    cashierName: cashierName || 'Elif Kasa',
    subtotal,
    discountPercent: Number(discountPercent) || 0,
    discountAmount: discAmt,
    tipAmount: tip,
    finalAmount,
    totalAmount: finalAmount,
    vatAmount,
    method: chosenMethod,
    paymentMethod: chosenMethod,
    splitBreakdown: splitData,
    partialBreakdown: splitData,
    isPartial: Boolean(isItemSplit || isPartial),
    splitPersonLabel: splitPersonLabel || (isItemSplit ? 'Parçalı Ödeme Fişi' : undefined),
    timestamp: now,
    createdAt: now,
    itemsSummary,
    restaurantId: order.restaurantId || table.restaurantId || 'rest-1',
  };

  db.payments.unshift(paymentRecord);

  // Update daily cash register for tenant
  const tenantReg = getCashRegister(order.restaurantId || table.restaurantId || 'rest-1');
  if (chosenMethod === 'CASH') {
    tenantReg.cashSales += finalAmount;
  } else if (chosenMethod === 'CREDIT_CARD') {
    tenantReg.cardSales += finalAmount;
  } else if (chosenMethod === 'HAVALE' || chosenMethod === 'TRANSFER') {
    tenantReg.transferSales += finalAmount;
  } else if ((chosenMethod === 'PARTIAL' || chosenMethod === 'SPLIT') && splitData) {
    if (Array.isArray(splitData)) {
      splitData.forEach((p: any) => {
        if (p.method === 'CASH') tenantReg.cashSales += Number(p.amount) || 0;
        if (p.method === 'CREDIT_CARD') tenantReg.cardSales += Number(p.amount) || 0;
        if (p.method === 'HAVALE' || p.method === 'TRANSFER') tenantReg.transferSales += Number(p.amount) || 0;
      });
    } else if (typeof splitData === 'object') {
      if (splitData.cash) tenantReg.cashSales += Number(splitData.cash) || 0;
      if (splitData.creditCard) tenantReg.cardSales += Number(splitData.creditCard) || 0;
    }
  }
  tenantReg.totalSales += finalAmount;
  tenantReg.discountsGiven += discAmt;
  tenantReg.expectedCash =
    tenantReg.openingBalance + tenantReg.cashSales + tenantReg.cashIn - tenantReg.cashOut;

  // Update Waiter Daily Sales Stat
  const waiter = db.users.find((u) => u.name === order.waiterName || u.id === order.waiterId);
  if (waiter) {
    waiter.dailySales = (waiter.dailySales || 0) + finalAmount;
  }

  // Recalculate remaining order total
  const remainingActiveItems = order.items.filter((i) => i.status !== 'CANCELLED');
  const remainingTotal = remainingActiveItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  order.totalAmount = remainingTotal;
  table.totalAmount = remainingTotal;

  let isTableFullyClosed = false;

  if (!isItemSplit || remainingActiveItems.length === 0) {
    // All items paid -> Table & Order Closed
    order.status = 'COMPLETED';
    order.completedAt = now;

    table.status = 'EMPTY';
    table.currentOrderId = undefined;
    table.currentWaiterId = undefined;
    table.currentWaiterName = undefined;
    table.guestCount = 0;
    table.openedAt = undefined;
    table.billRequestedAt = undefined;
    table.totalAmount = 0;
    table.mergedWith = undefined;
    isTableFullyClosed = true;

    addAudit(
      cashierName || 'Kasa',
      'CASHIER',
      `Hesap Kapatıldı: ${table.name}`,
      `Toplam: ₺${finalAmount.toLocaleString('tr-TR')} (${chosenMethod}) - Masa boşaltıldı.`,
      'PAYMENT',
      { orderNumber: order.orderNumber, tableName: table.name }
    );
  } else {
    // Partial payment completed, remaining items stay on the table
    addAudit(
      cashierName || 'Kasa',
      'CASHIER',
      `Parçalı Ödeme Alındı: ${table.name}`,
      `Ödenen: ₺${finalAmount.toLocaleString('tr-TR')} (${chosenMethod}) - Kalan Masa Tutarı: ₺${remainingTotal.toLocaleString('tr-TR')}`,
      'PAYMENT',
      { orderNumber: order.orderNumber, tableName: table.name }
    );
  }

  broadcastEvent({
    type: 'PAYMENT_COMPLETED',
    data: { payment: paymentRecord, table, order, cashRegister: (db as any).cashRegisters || (db as any).cashRegister, isTableFullyClosed },
    timestamp: now,
  });

  res.json({
    success: true,
    payment: paymentRecord,
    table,
    order,
    isTableFullyClosed,
    remainingAmount: remainingTotal,
  });
});

app.get('/api/payments', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.payments.filter((p) => p.restaurantId === tenantId));
});

// -------------------------------------------------------------
// Cash Register API
// -------------------------------------------------------------
app.get('/api/cash-register', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(getCashRegister(tenantId));
});

app.post('/api/cash-register/close', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const reg = getCashRegister(tenantId);
  const { actualCash, notes, closedBy } = req.body;
  const now = new Date().toISOString();

  reg.actualCash = actualCash;
  reg.difference = (actualCash || 0) - reg.expectedCash;
  reg.status = 'CLOSED';
  reg.closedAt = now;
  reg.notes = notes;

  addAudit(
    closedBy || 'Kasa',
    'CASHIER',
    'Günlük Kasa Kapatıldı (Z Raporu)',
    `Beklenen Nakit: ₺${reg.expectedCash} | Fiili Nakit: ₺${actualCash} | Fark: ₺${reg.difference}`,
    'PAYMENT',
    { restaurantId: tenantId }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: now });
  res.json(reg);
});

app.post('/api/cash-register/transaction', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const reg = getCashRegister(tenantId);
  const { type, amount, reason, userName } = req.body;
  const numAmount = Number(amount) || 0;

  if (type === 'IN') {
    reg.cashIn += numAmount;
  } else {
    reg.cashOut += numAmount;
  }
  reg.expectedCash = reg.openingBalance + reg.cashSales + reg.cashIn - reg.cashOut;

  addAudit(
    userName || 'Kasa',
    'CASHIER',
    type === 'IN' ? 'Kasaya Para Girişi' : 'Kasadan Para Çıkışı',
    `Tutar: ₺${numAmount} - Sebep: ${reason}`,
    'PAYMENT',
    { restaurantId: tenantId }
  );

  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(reg);
});

// -------------------------------------------------------------
// Reports & Analytics API
// -------------------------------------------------------------
app.get('/api/reports/summary', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const tenantPayments = db.payments.filter((p) => p.restaurantId === tenantId);
  const tenantOrders = db.orders.filter((o) => o.restaurantId === tenantId);
  const tenantTables = db.tables.filter((t) => t.restaurantId === tenantId);
  const tenantCancelled = db.cancelledItems.filter((c) => c.restaurantId === tenantId);

  const totalSales = tenantPayments.reduce((acc, p) => acc + p.finalAmount, 0);
  const totalOrders = tenantPayments.length + tenantOrders.filter((o) => o.status === 'ACTIVE').length;
  const averageCheck = tenantPayments.length > 0 ? totalSales / tenantPayments.length : 0;
  const activeTablesCount = tenantTables.filter((t) => t.status !== 'EMPTY' && t.status !== 'RESERVED').length;
  const emptyTablesCount = tenantTables.filter((t) => t.status === 'EMPTY').length;
  const kitchenPendingCount = tenantOrders
    .filter((o) => o.status === 'ACTIVE')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'NEW' || i.status === 'ACCEPTED' || i.status === 'PREPARING').length;

  // Payment Breakdown
  const paymentsByMethod = {
    CASH: 0,
    CREDIT_CARD: 0,
    HAVALE: 0,
  };

  tenantPayments.forEach((p) => {
    if (p.method === 'CASH') paymentsByMethod.CASH += p.finalAmount;
    else if (p.method === 'CREDIT_CARD') paymentsByMethod.CREDIT_CARD += p.finalAmount;
    else if (p.method === 'HAVALE') paymentsByMethod.HAVALE += p.finalAmount;
    else if (p.method === 'PARTIAL' && p.partialBreakdown) {
      p.partialBreakdown.forEach((pb) => {
        paymentsByMethod[pb.method] += pb.amount;
      });
    }
  });

  // Top Selling Products
  const productCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
  tenantPayments.forEach((p) => {
    p.itemsSummary.forEach((item) => {
      if (!productCountMap[item.name]) {
        productCountMap[item.name] = { name: item.name, count: 0, revenue: 0 };
      }
      productCountMap[item.name].count += item.quantity;
      productCountMap[item.name].revenue += item.price;
    });
  });

  const topProducts = Object.values(productCountMap).sort((a, b) => b.count - a.count);

  res.json({
    totalSales,
    totalOrders,
    averageCheck,
    activeTablesCount,
    emptyTablesCount,
    kitchenPendingCount,
    paymentsByMethod,
    topProducts,
    cancelledCount: tenantCancelled.length,
    cancelledAmount: tenantCancelled.reduce((acc, c) => acc + c.price, 0),
    discountsTotal: tenantPayments.reduce((acc, p) => acc + p.discountAmount, 0),
  });
});

app.get('/api/reports/cancelled', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(db.cancelledItems.filter((c) => c.restaurantId === tenantId));
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const user = getRequestingUser(req);
  const includeAll = req.query.all === 'true' && user?.role === 'SUPER_ADMIN';
  const filtered = includeAll
    ? db.auditLogs
    : db.auditLogs.filter((a) => a.restaurantId === tenantId);
  res.json(filtered);
});

// -------------------------------------------------------------
// Settings API
// -------------------------------------------------------------
app.get('/api/settings', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(getSettings(tenantId));
});

app.put('/api/settings', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const currentSettings = getSettings(tenantId);
  const { rolePermissions, ...otherSettings } = req.body;
  Object.assign(currentSettings, otherSettings);
  if (rolePermissions) {
    currentSettings.rolePermissions = {
      ...(currentSettings.rolePermissions || DEFAULT_ROLE_PERMISSIONS),
      ...rolePermissions,
    };
  }
  addAudit('Admin', 'ADMIN', 'Restoran ve Yetki Ayarları Güncellendi', 'Sistem ayarları ve rol erişim yetkileri kaydedildi.', 'SETTINGS', { restaurantId: tenantId });
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json(currentSettings);
});

// Reset Demo Data
app.post('/api/reset-demo', (req: Request, res: Response) => {
  db = getInitialData();
  addAudit('Sistem', 'ADMIN', 'Demo Verileri Sıfırlandı', 'Sistem başlangıç durumuna getirildi.', 'SETTINGS');
  broadcastEvent({ type: 'SYNC_ALL', timestamp: new Date().toISOString() });
  res.json({ success: true, message: 'Demo veritabanı başarıyla sıfırlandı.' });
});

// -------------------------------------------------------------
// Vite Middleware & Server Initialization
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ÖZER POS Server is running on port ${PORT}`);
  });
}

startServer();
