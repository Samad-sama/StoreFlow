import {
  db,
  Product,
  Category,
  Brand,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  Payment,
  Expense,
  ExpenseCategory,
  InventoryMovement,
} from './schema';
import { generateId } from '@/lib/utils';

export async function seedDemoData(currency: string = 'DZD'): Promise<void> {
  const now = new Date().toISOString();

  // Categories - Pure Single Language
  const categories: Category[] = [
    {
      id: 'cat-1',
      name: 'إلكترونيات وكهربائيات',
      description: 'أجهزة وإلكترونيات استهلاكية وملحقاتها',
      parentId: null,
      icon: 'Laptop',
      imageUrl: '',
      sortOrder: 1,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cat-2',
      name: 'هواتف وإكسسوارات',
      description: 'هواتف ذكية وكابلات وشواحن وحافظات',
      parentId: null,
      icon: 'Smartphone',
      imageUrl: '',
      sortOrder: 2,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cat-3',
      name: 'ملابس وأزياء',
      description: 'ملابس رجالية ونسائية وأطفال',
      parentId: null,
      icon: 'Shirt',
      imageUrl: '',
      sortOrder: 3,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cat-4',
      name: 'مواد غذائية وتموينية',
      description: 'سلع غذائية واستهلاكية يومية',
      parentId: null,
      icon: 'ShoppingBasket',
      imageUrl: '',
      sortOrder: 4,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Brands
  const brands: Brand[] = [
    { id: 'brand-1', name: 'Apple', description: 'Apple Inc.', logoUrl: '', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'brand-2', name: 'Samsung', description: 'Samsung Electronics', logoUrl: '', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'brand-3', name: 'Anker', description: 'Chargers & Audio', logoUrl: '', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'brand-4', name: 'Zara', description: 'Apparel & Style', logoUrl: '', isDemo: true, createdAt: now, updatedAt: now },
  ];

  // Suppliers - Algerian Locations & Phone numbers
  const suppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'شركة الأوراس للتوزيع والتجارة',
      phone: '023 45 67 89',
      email: 'contact@auras-distrib.dz',
      address: 'الجزائر العاصمة، باب الزوار',
      contactPerson: 'كريم بلحاج',
      notes: 'المورد الرئيسي للإلكترونيات والأجهزة المنزلية',
      outstandingBalance: 0,
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup-2',
      name: 'مؤسسة الهضاب للاستيراد والتصدير',
      phone: '031 92 10 20',
      email: 'commercial@hidhab-import.dz',
      address: 'سطيف، المنطقة الصناعية',
      contactPerson: 'أحمد بن عيسى',
      notes: 'مورد ملحقات الهواتف والملابس',
      outstandingBalance: 24000,
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Customers - Algerian names & realistic debt amounts
  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'محمد بن علي',
      phone: '0550 12 34 56',
      email: 'mohamed.benali@gmail.com',
      address: 'الجزائر العاصمة، القبة',
      notes: 'عميل دائم وموثوق',
      totalPurchases: 45000,
      outstandingBalance: 0,
      credit: 0,
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust-2',
      name: 'فاطمة الزهراء بلقاسم',
      phone: '0770 98 76 54',
      email: 'fz.belkacem@yahoo.fr',
      address: 'وهران، حي العقيد لطفي',
      notes: 'تسدد حسابها بانتظام نهاية الشهر',
      totalPurchases: 32500,
      outstandingBalance: 6500,
      credit: 0,
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust-3',
      name: 'يوسف مهدي بوجمعة',
      phone: '0661 45 88 12',
      email: 'youssef.boudjemaa@outlook.com',
      address: 'قسنطينة، سيدي مبروك',
      notes: 'مشتريات بالجملة والتجزئة',
      totalPurchases: 88000,
      outstandingBalance: 14200,
      credit: 0,
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust-4',
      name: 'عبد القادر عماري',
      phone: '0552 33 44 55',
      email: 'amari.kader@gmail.com',
      address: 'البليدة، أولاد يعيش',
      notes: 'عميل ممتاز، لا توجد عليه أي ديون',
      totalPurchases: 21000,
      outstandingBalance: 0,
      credit: 0,
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Products - Algerian Dinar (DZD) Realistic Pricing
  const products: Product[] = [
    {
      id: 'prod-1',
      name: 'شاحن سريع Anker 65W GaN Charger',
      sku: 'ANK-65W-GAN',
      barcode: '694000111222',
      description: 'شاحن جداري فائق السرعة بتقنية GaN مع 3 منافذ USB-C و USB-A',
      imageUrl: '',
      additionalImages: [],
      categoryId: 'cat-2',
      brandId: 'brand-3',
      supplierId: 'sup-2',
      purchasePrice: 3800,
      sellingPrice: 5200,
      wholesalePrice: 4400,
      discount: 0,
      discountType: 'percentage',
      taxRate: 19,
      quantity: 32,
      minimumStock: 5,
      unit: 'قطعة',
      status: 'active',
      customAttributes: { Power: '65W', Ports: '3' },
      hasVariants: false,
      expirationDate: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-2',
      name: 'سماعات لاسلكية AirPods Pro 2 USB-C',
      sku: 'APP-PRO2-USBC',
      barcode: '194253397472',
      description: 'سماعات مع إلغاء الضجيج النشط ومقاومة للماء والغبار',
      imageUrl: '',
      additionalImages: [],
      categoryId: 'cat-1',
      brandId: 'brand-1',
      supplierId: 'sup-1',
      purchasePrice: 28000,
      sellingPrice: 36500,
      wholesalePrice: 32000,
      discount: 1000,
      discountType: 'fixed',
      taxRate: 19,
      quantity: 14,
      minimumStock: 3,
      unit: 'قطعة',
      status: 'active',
      customAttributes: { Color: 'White', Warranty: '1 Year' },
      hasVariants: false,
      expirationDate: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-3',
      name: 'كابل شحن نايلون Type-C to Type-C 2M',
      sku: 'CBL-TC-2M-NYL',
      barcode: '694000333444',
      description: 'كابل مضفر متين عالي السرعة 100W PD',
      imageUrl: '',
      additionalImages: [],
      categoryId: 'cat-2',
      brandId: 'brand-3',
      supplierId: 'sup-2',
      purchasePrice: 650,
      sellingPrice: 1200,
      wholesalePrice: 900,
      discount: 0,
      discountType: 'percentage',
      taxRate: 19,
      quantity: 4, // Low stock on purpose
      minimumStock: 10,
      unit: 'قطعة',
      status: 'active',
      customAttributes: { Length: '2 Meters' },
      hasVariants: false,
      expirationDate: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-4',
      name: 'محول طاقة سيارة 30W Dual Port',
      sku: 'CAR-CHG-30W',
      barcode: '694000555666',
      description: 'شاحن سيارة ذكي يدعم الشحن السريع QC 3.0 و PD',
      imageUrl: '',
      additionalImages: [],
      categoryId: 'cat-2',
      brandId: 'brand-3',
      supplierId: 'sup-2',
      purchasePrice: 950,
      sellingPrice: 1600,
      wholesalePrice: 1200,
      discount: 0,
      discountType: 'percentage',
      taxRate: 19,
      quantity: 0, // Out of stock on purpose
      minimumStock: 5,
      unit: 'قطعة',
      status: 'active',
      customAttributes: {},
      hasVariants: false,
      expirationDate: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-5',
      name: 'قميص أكسفورد قطن كلاسيكي Oxford Shirt',
      sku: 'SHIRT-OXF-BLU',
      barcode: '843800011122',
      description: 'قميص قطني 100% مناسب للعمل والمناسبات',
      imageUrl: '',
      additionalImages: [],
      categoryId: 'cat-3',
      brandId: 'brand-4',
      supplierId: 'sup-1',
      purchasePrice: 2200,
      sellingPrice: 3800,
      wholesalePrice: 2900,
      discount: 0,
      discountType: 'percentage',
      taxRate: 19,
      quantity: 40,
      minimumStock: 8,
      unit: 'قطعة',
      status: 'active',
      customAttributes: { Material: 'Cotton 100%' },
      hasVariants: true,
      expirationDate: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-6',
      name: 'زيت زيتون بكر ممتاز 1 لتر',
      sku: 'OIL-OLV-1L',
      barcode: '613000998877',
      description: 'زيت زيتون طبيعي معصور على البارد من منطقة القبائل',
      imageUrl: '',
      additionalImages: [],
      categoryId: 'cat-4',
      brandId: null,
      supplierId: 'sup-1',
      purchasePrice: 900,
      sellingPrice: 1250,
      wholesalePrice: 1050,
      discount: 0,
      discountType: 'percentage',
      taxRate: 9,
      quantity: 65,
      minimumStock: 15,
      unit: 'لتر',
      status: 'active',
      customAttributes: {},
      hasVariants: false,
      expirationDate: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Inventory movements
  const movements: InventoryMovement[] = products.map((p) => ({
    id: generateId(),
    productId: p.id,
    variantId: null,
    productName: p.name,
    type: 'initial',
    quantity: p.quantity,
    previousQuantity: 0,
    newQuantity: p.quantity,
    reason: 'رصيد افتتاحي للمنتج',
    referenceId: null,
    referenceType: 'manual',
    isDemo: true,
    createdAt: now,
  }));

  // Invoices & Sales
  const sale1Id = 'sale-1001';
  const sale2Id = 'sale-1002';
  const sale3Id = 'sale-1003';

  const sales: Sale[] = [
    {
      id: sale1Id,
      saleNumber: 'INV-2026-0001',
      customerId: 'cust-1',
      customerName: 'محمد بن علي',
      employeeId: null,
      subtotal: 10400,
      discountAmount: 0,
      taxAmount: 1976,
      totalAmount: 12376,
      paidAmount: 12376,
      changeAmount: 0,
      status: 'completed',
      notes: 'طلب كاش مكتمل',
      isDemo: true,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: sale2Id,
      saleNumber: 'INV-2026-0002',
      customerId: 'cust-2',
      customerName: 'فاطمة الزهراء بلقاسم',
      employeeId: null,
      subtotal: 36500,
      discountAmount: 1000,
      taxAmount: 6745,
      totalAmount: 42245,
      paidAmount: 35745, // remaining 6,500 recorded as debt!
      changeAmount: 0,
      status: 'completed',
      notes: 'دفع جزئي والباقي مسجل كدَين',
      isDemo: true,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: sale3Id,
      saleNumber: 'INV-2026-0003',
      customerId: 'cust-3',
      customerName: 'يوسف مهدي بوجمعة',
      employeeId: null,
      subtotal: 11933,
      discountAmount: 0,
      taxAmount: 2267,
      totalAmount: 14200,
      paidAmount: 0, // full debt!
      changeAmount: 0,
      status: 'completed',
      notes: 'فاتورة على الحساب بالكامل',
      isDemo: true,
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ];

  const saleItems: SaleItem[] = [
    {
      id: generateId(),
      saleId: sale1Id,
      productId: 'prod-1',
      variantId: null,
      productName: 'شاحن سريع Anker 65W GaN Charger',
      sku: 'ANK-65W-GAN',
      quantity: 2,
      unitPrice: 5200,
      purchasePrice: 3800,
      discount: 0,
      discountType: 'percentage',
      taxRate: 19,
      taxAmount: 1976,
      totalAmount: 12376,
      createdAt: now,
    },
    {
      id: generateId(),
      saleId: sale2Id,
      productId: 'prod-2',
      variantId: null,
      productName: 'سماعات لاسلكية AirPods Pro 2 USB-C',
      sku: 'APP-PRO2-USBC',
      quantity: 1,
      unitPrice: 36500,
      purchasePrice: 28000,
      discount: 1000,
      discountType: 'fixed',
      taxRate: 19,
      taxAmount: 6745,
      totalAmount: 42245,
      createdAt: now,
    },
    {
      id: generateId(),
      saleId: sale3Id,
      productId: 'prod-5',
      variantId: null,
      productName: 'قميص أكسفورد قطن كلاسيكي Oxford Shirt',
      sku: 'SHIRT-OXF-BLU',
      quantity: 3,
      unitPrice: 3800,
      purchasePrice: 2200,
      discount: 0,
      discountType: 'percentage',
      taxRate: 19,
      taxAmount: 2267,
      totalAmount: 14200,
      createdAt: now,
    },
  ];

  const payments: Payment[] = [
    {
      id: generateId(),
      saleId: sale1Id,
      purchaseId: null,
      type: 'sale',
      method: 'cash',
      amount: 12376,
      reference: 'CSH-001',
      notes: 'دفع نقدي كامل',
      isDemo: true,
      createdAt: now,
    },
    {
      id: generateId(),
      saleId: sale2Id,
      purchaseId: null,
      type: 'sale',
      method: 'card',
      amount: 35745,
      reference: 'CARD-TX-9921',
      notes: 'دفع بالبطاقة البنكية',
      isDemo: true,
      createdAt: now,
    },
  ];

  // Expense Categories & Expenses
  const expCategories: ExpenseCategory[] = [
    { id: 'expcat-1', name: 'إيجار المحل والمستودع', description: 'إيجار المقر التجاري', isDemo: true, createdAt: now },
    { id: 'expcat-2', name: 'فواتير الطاقة والمياه', description: 'كهرباء سونلغاز والمياه', isDemo: true, createdAt: now },
    { id: 'expcat-3', name: 'لوازم التغليف والطباعة', description: 'أكياس وعلب وفواتير مطبوعة', isDemo: true, createdAt: now },
  ];

  const expenses: Expense[] = [
    {
      id: generateId(),
      categoryId: 'expcat-2',
      categoryName: 'فواتير الطاقة والمياه',
      amount: 8500,
      description: 'فاتورة الكهرباء سونلغاز للثلاثي الحالي',
      paymentMethod: 'bank_transfer',
      receiptUrl: '',
      date: new Date().toISOString().split('T')[0],
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      categoryId: 'expcat-3',
      categoryName: 'لوازم التغليف والطباعة',
      amount: 4200,
      description: 'أكياس تغليف بشعار المتجر وورق طباعة فواتير',
      paymentMethod: 'cash',
      receiptUrl: '',
      date: new Date().toISOString().split('T')[0],
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Save to Dexie
  await db.transaction(
    'rw',
    [
      db.categories,
      db.brands,
      db.suppliers,
      db.customers,
      db.products,
      db.inventoryMovements,
      db.sales,
      db.saleItems,
      db.payments,
      db.expenseCategories,
      db.expenses,
    ],
    async () => {
      await db.categories.bulkPut(categories);
      await db.brands.bulkPut(brands);
      await db.suppliers.bulkPut(suppliers);
      await db.customers.bulkPut(customers);
      await db.products.bulkPut(products);
      await db.inventoryMovements.bulkPut(movements);
      await db.sales.bulkPut(sales);
      await db.saleItems.bulkPut(saleItems);
      await db.payments.bulkPut(payments);
      await db.expenseCategories.bulkPut(expCategories);
      await db.expenses.bulkPut(expenses);
    }
  );
}

export async function clearDemoData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      if ('where' in table) {
        try {
          await (table as any).where('isDemo').equals(1).delete();
          await (table as any).where('isDemo').equals(true as any).delete();
        } catch {
          const items = await table.toArray();
          const demoIds = items.filter((item: any) => item.isDemo === true).map((item: any) => item.id);
          if (demoIds.length > 0) {
            await table.bulkDelete(demoIds);
          }
        }
      }
    }
  });
}
