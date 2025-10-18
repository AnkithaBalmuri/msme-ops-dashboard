import { Invoice, InvoiceStatus, Vendor, AgentName, MockEmail, User, UserRole } from './types';

// --- Starbucks Franchise Financial Data ---

export const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'West Coast Roasting Co.', gstin: '29ABCDE1234F1Z5', email: 'orders@westcoastroasting.com', phone: '555-0101', normalized_name: 'west coast roasting co' },
  { id: 'v2', name: 'Dairy Farmers Cooperative', gstin: '27FGHIJ5678K1Z4', email: 'accounts@dairycoop.com', phone: '555-0102', normalized_name: 'dairy farmers cooperative' },
  { id: 'v3', name: 'Artisan Bakery Supplies', gstin: '36LMNOP9012Q1Z3', email: 'billing@artisanbakery.net', phone: '555-0103', normalized_name: 'artisan bakery supplies' },
  { id: 'v4', name: 'Uniform Solutions LLC', gstin: '21RSTUV3456W1Z2', email: 'contact@uniformsolutions.com', phone: '555-0104', normalized_name: 'uniform solutions llc' },
  { id: 'v5', name: 'Eco-Friendly Packaging Inc.', gstin: '33XYZAB7890C1Z1', email: 'sales@ecopackaging.eco', phone: '555-0105', normalized_name: 'eco-friendly packaging inc' },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1', invoice_no: 'WCR-8821', vendor: MOCK_VENDORS[0],
    invoice_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 4500.00, taxable_amount: 4275.00, tax_amount: 225.00, currency: 'USD',
    status: InvoiceStatus.PENDING_REVIEW, parsing_confidence: 0.98, line_items: [{ description: 'Pike Place Roast Beans - 50lbs' }]
  },
  {
    id: 'inv-2', invoice_no: 'DFC-2024-05-103', vendor: MOCK_VENDORS[1],
    invoice_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 1250.50, taxable_amount: 1190.95, tax_amount: 59.55, currency: 'USD',
    status: InvoiceStatus.APPROVED, parsing_confidence: 0.95, line_items: [{ description: 'Whole Milk Delivery - 100 Gal' }]
  },
  {
    id: 'inv-3', invoice_no: 'ABS-INV-934', vendor: MOCK_VENDORS[2],
    invoice_date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 875.00, taxable_amount: 833.33, tax_amount: 41.67, currency: 'USD',
    status: InvoiceStatus.OVERDUE, parsing_confidence: 0.99, line_items: [{ description: 'Croissant Dough, Chocolate Chips' }]
  },
  {
    id: 'inv-4', invoice_no: 'US-5512', vendor: MOCK_VENDORS[3],
    invoice_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 2100.00, taxable_amount: 2000.00, tax_amount: 100.00, currency: 'USD',
    status: InvoiceStatus.PAID, parsing_confidence: 1.00, line_items: [{ description: 'Barista Aprons - Qty 20' }]
  },
  {
    id: 'inv-5', invoice_no: 'ECP-2024-Q2-08', vendor: MOCK_VENDORS[4],
    invoice_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 3200.75, taxable_amount: 3048.33, tax_amount: 152.42, currency: 'USD',
    status: InvoiceStatus.MISMATCHED, parsing_confidence: 0.88, line_items: [{ description: 'Grande Hot Cups - 5000 units' }]
  },
  {
    id: 'inv-6', invoice_no: 'WCR-8950', vendor: MOCK_VENDORS[0],
    invoice_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 4800.00, taxable_amount: 4560.00, tax_amount: 240.00, currency: 'USD',
    status: InvoiceStatus.PAID, parsing_confidence: 0.99, line_items: [{ description: 'Espresso Roast Beans - 60lbs' }]
  },
  {
    id: 'inv-7', invoice_no: 'DFC-2024-04-210', vendor: MOCK_VENDORS[1],
    invoice_date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 1350.75, taxable_amount: 1286.43, tax_amount: 64.32, currency: 'USD',
    status: InvoiceStatus.PAID, parsing_confidence: 0.97, line_items: [{ description: 'Organic Milk Delivery - 120 Gal' }]
  },
  {
    id: 'inv-8', invoice_no: 'ABS-INV-998', vendor: MOCK_VENDORS[2],
    invoice_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 950.00, taxable_amount: 904.76, tax_amount: 45.24, currency: 'USD',
    status: InvoiceStatus.APPROVED, parsing_confidence: 0.98, line_items: [{ description: 'Pastry Flour, Sugar, Butter' }]
  },
  {
    id: 'inv-9', invoice_no: 'ECP-2024-Q2-15', vendor: MOCK_VENDORS[4],
    invoice_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 3500.00, taxable_amount: 3333.33, tax_amount: 166.67, currency: 'USD',
    status: InvoiceStatus.PAID, parsing_confidence: 0.92, line_items: [{ description: 'Venti Cold Cups - 5000 units' }]
  },
  {
    id: 'inv-10', invoice_no: 'WCR-9021', vendor: MOCK_VENDORS[0],
    invoice_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 4650.00, taxable_amount: 4417.50, tax_amount: 232.50, currency: 'USD',
    status: InvoiceStatus.PAID, parsing_confidence: 1.00, line_items: [{ description: 'Pike Place Roast Beans - 50lbs' }]
  },
];


// --- Financial App Constants ---

export const STATUS_COLORS: { [key: string]: string } = {
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-orange-100 text-orange-800',
    MISMATCHED: 'bg-purple-100 text-purple-800',
    RECONCILED: 'bg-teal-100 text-teal-800',
};

export const INGESTION_WORKFLOW_SEQUENCE: AgentName[] = [
    AgentName.EMAIL_AGENT,
    AgentName.GST_AGENT,
    AgentName.FINANCE_AGENT,
    AgentName.SHEET_SYNC_AGENT,
];

export const WORKFLOW_AGENTS = {
    [AgentName.EMAIL_AGENT]: { id: AgentName.EMAIL_AGENT, title: 'Invoice Parser', description: 'Extracts data from email attachments using AI.' },
    [AgentName.FINANCE_AGENT]: { id: AgentName.FINANCE_AGENT, title: 'Finance Logger', description: 'Logs invoice data into the accounting system.' },
    [AgentName.GST_AGENT]: { id: AgentName.GST_AGENT, title: 'GST Validator', description: 'Verifies vendor GSTIN and tax details.' },
    [AgentName.SHEET_SYNC_AGENT]: { id: AgentName.SHEET_SYNC_AGENT, title: 'Sheet Sync', description: 'Updates a Google Sheet with new data.' },
};

export const MOCK_EMAILS: MockEmail[] = [
    { id: 'email1', sender: 'West Coast Roasting Co.', subject: 'Your Invoice WCR-8821 is available', timestamp: new Date(Date.now() - 3600000).toISOString(), hasAttachment: true, attachmentFileName: 'wcr-invoice-sept.pdf' },
    { id: 'email2', sender: 'Dairy Farmers Cooperative', subject: 'Invoice for your recent delivery', timestamp: new Date(Date.now() - 86400000).toISOString(), hasAttachment: true, attachmentFileName: 'dairy-invoice.pdf' },
    { id: 'email3', sender: 'Corporate HR', subject: 'Q3 Town Hall Meeting', timestamp: new Date(Date.now() - 172800000).toISOString(), hasAttachment: false },
    { id: 'email4', sender: 'Artisan Bakery Supplies', subject: 'Your bill for invoice ABS-INV-934 is due', timestamp: new Date(Date.now() - 259200000).toISOString(), hasAttachment: true, attachmentFileName: 'bakery-bill.pdf' },
];

export const MOCK_USERS: User[] = [
    { id: 'user2', email: 'lagishettyvmkrishna@gmail.com', name: 'Krishna', rewardsPoints: 150, role: UserRole.ORG_ADMIN },
    { id: 'user1', email: 'alex@starbucks-franchise.com', name: 'Alex', rewardsPoints: 450, role: UserRole.FINANCE_MANAGER },
    { id: 'user3', email: 'charlie@starbucks-franchise.com', name: 'Charlie', rewardsPoints: 50, role: UserRole.ACCOUNTANT },
    { id: 'user4', email: 'dana@starbucks-franchise.com', name: 'Dana', rewardsPoints: 200, role: UserRole.ORG_MEMBER },
];