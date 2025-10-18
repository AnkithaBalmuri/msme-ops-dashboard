// FIX: Add React import for React.ReactNode type.
import React from 'react';

// Data models for the Starbucks application

export enum ProductCategory {
  DRINKS = 'DRINKS',
  FOOD = 'FOOD',
  MERCHANDISE = 'MERCHANDISE',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  calories?: number;
  isNew?: boolean;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  amenities: string[];
}

// FIX: Added UserRole enum for permissions.
export enum UserRole {
    READ_ONLY = 'READ_ONLY',
    ORG_MEMBER = 'ORG_MEMBER',
    ACCOUNTANT = 'ACCOUNTANT',
    FINANCE_MANAGER = 'FINANCE_MANAGER',
    ORG_ADMIN = 'ORG_ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  rewardsPoints: number;
  favoriteStoreId?: string;
  // FIX: Added role for permissions.
  role?: UserRole;
}

export interface Reward {
  id: string;
  title: string;
  pointsRequired: number;
  description: string;
}


// --- Chat Types ---
export interface ChatMessage {
    id?: number; // Optional for React keys
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string; // For tool role
}

// For useNotificationStore
export interface Notification {
  id: number;
  title: string;
  description: string;
  link: string;
  isRead: boolean;
  timestamp: string;
}

// --- Financial App Types ---

// FIX: Added Vendor type.
export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  normalized_name: string;
}

// FIX: Added InvoiceStatus enum.
export enum InvoiceStatus {
    PENDING_REVIEW = 'PENDING_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    MISMATCHED = 'MISMATCHED',
    RECONCILED = 'RECONCILED',
}

// FIX: Added Invoice type.
export interface Invoice {
  id: string;
  invoice_no: string;
  vendor: Vendor;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  taxable_amount: number;
  tax_amount: number;
  currency: string;
  status: InvoiceStatus;
  parsing_confidence: number;
  line_items: { description: string }[];
}

// FIX: Added SortConfig type.
export interface SortConfig<T> {
  key: keyof T | 'vendor';
  direction: 'ascending' | 'descending';
}

// FIX: Added Report type.
export interface Report {
  id: string;
  period: string;
  generated_at: string;
  content?: string;
  file_url?: string;
}

// FIX: Added AgentName enum.
export enum AgentName {
    EMAIL_AGENT = 'EMAIL_AGENT',
    FINANCE_AGENT = 'FINANCE_AGENT',
    GST_AGENT = 'GST_AGENT',
    REMINDER_AGENT = 'REMINDER_AGENT',
    SHEET_SYNC_AGENT = 'SHEET_SYNC_AGENT',
    REPORT_AGENT = 'REPORT_AGENT',
}

// FIX: Added AgentStatus and Workflow types.
export type AgentStatus = 'idle' | 'processing' | 'success' | 'error' | 'skipped';

export interface WorkflowStep {
    agentId: AgentName;
    status: AgentStatus;
    message: string;
    duration?: number;
}

export interface WorkflowRun {
    id: string;
    fileName: string;
    startTime: string;
    status: 'running' | 'completed' | 'failed';
    steps: { [key in AgentName]?: WorkflowStep };
    finalInvoiceId?: string;
}

// FIX: Added MockEmail type.
export interface MockEmail {
  id: string;
  sender: string;
  subject: string;
  timestamp: string;
  hasAttachment: boolean;
  attachmentFileName?: string;
}

// FIX: Added Anomaly type.
export interface Anomaly {
    type: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    relatedInvoiceIds: string[];
}

// FIX: Added Forecast types.
export interface MonthlyForecast {
    month: string;
    predictedOutflow: number;
}

export interface Forecast {
    summary: string;
    monthlyForecasts: MonthlyForecast[];
    keyTrends: string[];
    potentialRisks: string[];
    actionableInsights: string[];
}

// FIX: Added TaxAdvisory types.
export interface TaxInsight {
    category: 'Compliance Check' | 'Savings Opportunity' | 'Potential Red Flag';
    severity: 'Info' | 'Action Required' | 'High Priority';
    description: string;
    relatedInvoiceIds: string[];
}

export interface TaxAdvisory {
    summary: string;
    insights: TaxInsight[];
}

// FIX: Added ActionableInsight type.
export interface ActionableInsight {
    id: string;
    category: 'Anomaly' | 'Tax';
    title: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Info';
    relatedInvoiceIds: string[];
    isDismissed: boolean;
}

// FIX: Added TodoTask type.
export interface TodoTask {
  id: string;
  text: string;
  isCompleted: boolean;
  dueDate: string;
}

// FIX: Moved Integration type here to be shared across settings components.
export interface Integration {
    name: string;
    description: string;
    isConnected: boolean;
    logo: React.ReactNode;
}
