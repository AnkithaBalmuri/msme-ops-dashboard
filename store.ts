import { create } from 'zustand';
import {
    Invoice, Anomaly, TaxAdvisory, ActionableInsight, AgentName,
    ChatMessage, User, UserRole, TodoTask, Notification, Vendor, InvoiceStatus
} from './types';
import { api } from './services/api';
import { aiService } from './services/aiService';
import { reminderService } from './services/reminderService';
import { MOCK_USERS, INGESTION_WORKFLOW_SEQUENCE } from './constants';
import { ChatCompletionMessage } from './services/openAIService';
// FIX: Add imports for Gemini Live API
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession } from "@google/genai";


// --- Invoices Store ---
interface InvoicesState {
    invoices: Invoice[];
    loading: boolean;
    error: string | null;
    initialized: boolean;
    fetchInvoices: () => Promise<void>;
    addInvoice: (invoice: Invoice) => void;
    updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
}
export const useInvoicesStore = create<InvoicesState>((set, get) => ({
    invoices: [],
    loading: false,
    error: null,
    initialized: false,
    fetchInvoices: async () => {
        if (get().initialized) return;
        set({ loading: true, error: null });
        try {
            const invoices = await api.getInvoices({});
            set({ invoices, loading: false, initialized: true });
        } catch (err)
        {
            set({ error: 'Failed to fetch invoices.', loading: false, initialized: true });
        }
    },
    addInvoice: (invoice) => {
        set(state => ({ invoices: [invoice, ...state.invoices] }));
    },
    updateInvoice: async (id, updates) => {
        try {
            const updatedInvoice = await api.updateInvoice(id, updates);
            set(state => ({
                invoices: state.invoices.map(inv => inv.id === id ? { ...inv, ...updatedInvoice } : inv)
            }));
        } catch (error) {
            console.error("Failed to update invoice:", error);
        }
    },
}));

// --- Dashboard Store ---
interface DashboardState {
    insights: ActionableInsight[];
    loadingInsights: boolean;
    error: string | null;
    insightsInitialized: boolean;
    cashflowOutlook: { status: string; summary: string; dailyBreakdown: { date: string, balance: number }[] } | null;
    loadingCashflow: boolean;
    fetchDashboardData: () => Promise<void>;
    dismissInsight: (id: string) => void;
}
export const useDashboardStore = create<DashboardState>((set, get) => ({
    insights: [],
    loadingInsights: false,
    error: null,
    insightsInitialized: false,
    cashflowOutlook: null,
    loadingCashflow: false,
    fetchDashboardData: async () => {
        if (get().insightsInitialized || get().loadingInsights) {
            return;
        }

        const invoices = useInvoicesStore.getState().invoices;
        if (invoices.length === 0) {
            return;
        }

        set({ loadingInsights: true, loadingCashflow: true, error: null });

        try {
            const { anomalies, taxAdvisory } = await aiService.generateDashboardInsights(invoices);
            
            const anomalyInsights: ActionableInsight[] = anomalies.map((a, i) => ({
                id: `anom-${i}`, category: 'Anomaly', title: a.type, description: a.description, severity: a.severity, relatedInvoiceIds: a.relatedInvoiceIds, isDismissed: false
            }));

            const mapTaxSeverity = (severity: 'Info' | 'Action Required' | 'High Priority'): ActionableInsight['severity'] => {
                switch (severity) {
                    case 'High Priority':
                        return 'High';
                    case 'Action Required':
                        return 'Medium';
                    case 'Info':
                    default:
                        return 'Info';
                }
            };

            const taxInsights: ActionableInsight[] = taxAdvisory.insights.map((t, i) => ({
                id: `tax-${i}`, category: 'Tax', title: t.category, description: t.description, severity: mapTaxSeverity(t.severity), relatedInvoiceIds: t.relatedInvoiceIds, isDismissed: false
            }));

            set({ insights: [...anomalyInsights, ...taxInsights], loadingInsights: false, insightsInitialized: true });

            const tasks = useTodoStore.getState().tasks;
            const proactiveReminders = reminderService.generateProactiveReminders(invoices, tasks);
            useNotificationStore.getState().addSystemNotifications(proactiveReminders);

        } catch (e) {
            console.error("Error generating dashboard insights:", e);
            set({ loadingInsights: false, error: (e as Error).message, insightsInitialized: true });
        }

        setTimeout(() => {
            const dailyBreakdown = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return {
                    date: date.toISOString().split('T')[0],
                    balance: (Math.random() - 0.4) * 5000 + 10000
                }
            });
            set({
                cashflowOutlook: {
                    status: 'Healthy',
                    summary: 'Positive cash flow expected over the next 30 days with a significant surplus by month-end.',
                    dailyBreakdown,
                },
                loadingCashflow: false
            });
        }, 1500);
    },
    dismissInsight: (id) => {
        set(state => ({
            insights: state.insights.map(i => i.id === id ? { ...i, isDismissed: true } : i)
        }));
    },
}));

const parseTimePeriod = (timePeriod: string): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const lowerPeriod = timePeriod.toLowerCase();

    if (lowerPeriod.includes('last month')) {
        return { startDate: new Date(year, month - 1, 1), endDate: new Date(year, month, 0) };
    }
    if (lowerPeriod.includes('this month')) {
        return { startDate: new Date(year, month, 1), endDate: new Date(year, month + 1, 0) };
    }
    if (lowerPeriod.includes('this year')) {
        return { startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31) };
    }
    const quarterMatch = lowerPeriod.match(/q(\d)\s*(\d{4})/);
    if (quarterMatch) {
        const q = parseInt(quarterMatch[1]);
        const y = parseInt(quarterMatch[2]);
        const startMonth = (q - 1) * 3;
        return { startDate: new Date(y, startMonth, 1), endDate: new Date(y, startMonth + 3, 0) };
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    return { startDate, endDate };
};

// --- Chat Store ---
interface ChatState {
    isOpen: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
    toggleChat: () => void;
    initializeChat: () => void;
    sendMessage: (message: string) => Promise<void>;
}
export const useChatStore = create<ChatState>((set, get) => ({
    isOpen: false,
    messages: [],
    isLoading: false,
    toggleChat: () => set(state => ({ isOpen: !state.isOpen })),
    initializeChat: () => {
        if (get().messages.length > 0) return;
        set({
            messages: [{ id: 0, role: 'assistant', content: 'Hello! I am your financial Co-Pilot. How can I help you today?' }]
        });
    },
    sendMessage: async (message) => {
        const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: message };
        const history = [...get().messages, userMessage];
        set({ messages: history, isLoading: true });

        try {
            const assistantResponse = await aiService.startChat(history as ChatCompletionMessage[]);

            if (assistantResponse.tool_calls) {
                set(state => ({ messages: [...state.messages, assistantResponse] }));
                const toolCall = assistantResponse.tool_calls[0];
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);
                let toolResultContent = 'An unknown error occurred with the tool.';

                if (toolName === 'update_invoice_status') {
                    const { invoice_no, new_status } = toolArgs;
                    const { invoices, updateInvoice } = useInvoicesStore.getState();
                    const invoiceToUpdate = invoices.find(inv => inv.invoice_no === invoice_no);
                    if (invoiceToUpdate) {
                        await updateInvoice(invoiceToUpdate.id, { status: new_status as InvoiceStatus });
                        toolResultContent = `Successfully updated invoice ${invoice_no} to ${new_status}.`;
                    } else {
                        toolResultContent = `Could not find invoice with number ${invoice_no}.`;
                    }
                } else if (toolName === 'set_reminder') {
                    const { reminder_text, due_date } = toolArgs;
                    useTodoStore.getState().addTask(reminder_text, due_date);
                    toolResultContent = `OK. I've added a reminder to your to-do list.`;
                } else if (toolName === 'schedule_purchase') {
                    const { vendor_name, item_description, amount } = toolArgs;
                    const taskText = `Schedule purchase from ${vendor_name} for ${item_description} (approx. $${amount})`;
                    useTodoStore.getState().addTask(taskText, new Date().toISOString().split('T')[0]);
                    toolResultContent = `I've added a to-do item to schedule the purchase.`;
                } else if (toolName === 'prepare_vendor_spending_report') {
                    const { vendor_name, time_period } = toolArgs;
                    const { invoices } = useInvoicesStore.getState();
                    const vendors = await api.getVendors();
                    const targetVendor = vendors.find(v => v.name.toLowerCase().includes(vendor_name.toLowerCase()));
                    if (!targetVendor) {
                        toolResultContent = `Could not find a vendor named '${vendor_name}'.`;
                    } else {
                        const { startDate, endDate } = parseTimePeriod(time_period);
                        const relevantInvoices = invoices.filter(inv => {
                            const invoiceDate = new Date(inv.invoice_date);
                            return inv.vendor.id === targetVendor.id && invoiceDate >= startDate && invoiceDate <= endDate;
                        });
                        if (relevantInvoices.length === 0) {
                            toolResultContent = `No invoices found for ${targetVendor.name} in '${time_period}'.`;
                        } else {
                            const total = relevantInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
                            let report = `Spending for ${targetVendor.name} (${time_period}): ${relevantInvoices.length} invoices totaling ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}.`;
                            toolResultContent = report;
                        }
                    }
                }

                const toolResponseMessage: ChatMessage = {
                    id: Date.now() + 1,
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: toolName,
                    content: toolResultContent,
                };

                const historyWithToolResponse = [...get().messages, toolResponseMessage];
                set({ messages: historyWithToolResponse });
                
                const finalResponse = await aiService.startChat(historyWithToolResponse as ChatCompletionMessage[]);
                set(state => ({ messages: [...state.messages, {id: Date.now() + 2, ...finalResponse}], isLoading: false }));

            } else {
                set(state => ({ messages: [...state.messages, {id: Date.now() + 1, ...assistantResponse}], isLoading: false }));
            }
        } catch (e) {
            console.error("Chat error:", e);
            const errorMessage: ChatMessage = { id: Date.now() + 1, role: 'assistant', content: `Sorry, I encountered an error: ${(e as Error).message}` };
            set(state => ({ messages: [...state.messages, errorMessage], isLoading: false }));
        }
    },
}));

// FIX: Add a new store for the AI Calling Agent.
// --- Agent Store for Voice Calls ---
type CallStatus = 'idle' | 'connecting' | 'active' | 'error' | 'closed';

interface Transcript {
    id: number;
    speaker: 'user' | 'assistant';
    text: string;
}

interface AgentState {
    callStatus: CallStatus;
    transcripts: Transcript[];
    session: Promise<LiveSession> | null;
    startCall: (context: { invoices: Invoice[], vendors: Vendor[] }) => void;
    endCall: () => void;
    // Private state for internal management
    _currentInputTranscription: string;
    _currentOutputTranscription: string;
    _transcriptIdCounter: number;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    callStatus: 'idle',
    transcripts: [],
    session: null,
    _currentInputTranscription: '',
    _currentOutputTranscription: '',
    _transcriptIdCounter: 0,
    startCall: (context) => {
        if (get().callStatus !== 'idle') return;

        set({ callStatus: 'connecting', transcripts: [], _currentInputTranscription: '', _currentOutputTranscription: '', _transcriptIdCounter: 0 });

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const relevantInvoices = context.invoices.filter(i => i.status === InvoiceStatus.OVERDUE || i.status === InvoiceStatus.PENDING_REVIEW);

        const systemInstruction = `You are an AI assistant for a Starbucks franchise. Your task is to make a phone call to a vendor to follow up on invoices. Be professional, polite, and concise. You have the following context:
        - Invoices needing attention: ${JSON.stringify(relevantInvoices.map(i => ({ invoice_no: i.invoice_no, vendor: i.vendor.name, due_date: i.due_date, total: i.total_amount, status: i.status })))}
        - All known vendors: ${JSON.stringify(context.vendors.map(v => ({ name: v.name, phone: v.phone })))}
        Start the conversation by introducing yourself. For example: "Hello, I'm the AI assistant calling from Starbucks regarding a few invoices." Then, proceed based on the conversation.`;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                systemInstruction,
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    set({ callStatus: 'active' });
                    // The component will handle streaming microphone audio.
                },
                onmessage: (message: LiveServerMessage) => {
                    let { _currentInputTranscription, _currentOutputTranscription, _transcriptIdCounter } = get();

                    if (message.serverContent?.outputTranscription) {
                        _currentOutputTranscription += message.serverContent.outputTranscription.text;
                    }
                    if (message.serverContent?.inputTranscription) {
                        _currentInputTranscription += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.turnComplete) {
                        const newTranscripts: Transcript[] = [];
                        if (_currentInputTranscription.trim()) {
                            newTranscripts.push({
                                id: _transcriptIdCounter++,
                                speaker: 'user',
                                text: _currentInputTranscription.trim(),
                            });
                        }
                        if (_currentOutputTranscription.trim()) {
                             newTranscripts.push({
                                id: _transcriptIdCounter++,
                                speaker: 'assistant',
                                text: _currentOutputTranscription.trim(),
                            });
                        }
                        
                        set(state => ({
                            transcripts: [...state.transcripts, ...newTranscripts],
                            _currentInputTranscription: '',
                            _currentOutputTranscription: '',
                            _transcriptIdCounter: _transcriptIdCounter,
                        }));
                    } else {
                        set({
                            _currentInputTranscription,
                            _currentOutputTranscription,
                        });
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    set({ callStatus: 'error' });
                },
                onclose: (e: CloseEvent) => {
                    set({ callStatus: 'closed' });
                },
            },
        });

        set({ session: sessionPromise });
    },
    endCall: async () => {
        const session = get().session;
        if (session) {
            try {
                const s = await session;
                s.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        set({ callStatus: 'idle', transcripts: [], session: null, _currentInputTranscription: '', _currentOutputTranscription: '' });
    },
}));

// --- Workflow Store ---
interface WorkflowState {
    agentSequence: AgentName[];
    updateSequence: (newSequence: AgentName[]) => void;
}
export const useWorkflowStore = create<WorkflowState>((set) => ({
    agentSequence: INGESTION_WORKFLOW_SEQUENCE,
    updateSequence: (newSequence) => set({ agentSequence: newSequence }),
}));


// --- User Store ---
interface UserState {
    users: User[];
    addUser: (email: string, role: UserRole) => void;
    updateUserRole: (userId: string, role: UserRole) => void;
    removeUser: (userId: string) => void;
}
export const useUserStore = create<UserState>((set) => ({
    users: MOCK_USERS,
    addUser: (email, role) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            email,
            name: email.split('@')[0],
            rewardsPoints: 0,
            role,
        };
        set(state => ({ users: [...state.users, newUser] }));
    },
    updateUserRole: (userId, role) => {
        set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, role } : u)
        }));
    },
    removeUser: (userId) => {
        set(state => ({ users: state.users.filter(u => u.id !== userId) }));
    },
}));

// --- Todo Store ---
interface TodoState {
    tasks: TodoTask[];
    addTask: (text: string, dueDate: string) => void;
    toggleTask: (id: string) => void;
    removeTask: (id: string) => void;
}
export const useTodoStore = create<TodoState>((set) => ({
    tasks: [
        { id: 'todo-1', text: 'Follow up with Artisan Bakery on overdue invoice', isCompleted: false, dueDate: new Date().toISOString().split('T')[0] },
        { id: 'todo-2', text: 'Prepare Q3 vendor spending report', isCompleted: false, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 'todo-3', text: 'Review new uniform designs', isCompleted: true, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 'todo-4', text: 'Discuss Q4 budget with Alex', isCompleted: false, dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ],
    addTask: (text, dueDate) => {
        const newTask: TodoTask = { id: `todo-${Date.now()}`, text, isCompleted: false, dueDate };
        set(state => ({ tasks: [newTask, ...state.tasks] }));
    },
    toggleTask: (id) => {
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
        }));
    },
    removeTask: (id) => {
        set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    }
}));


// --- Notification Store ---
interface NotificationState {
    notifications: Notification[];
    addSystemNotifications: (newNotifications: Notification[]) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addSystemNotifications: (newNotifications) => set(state => {
        const existingIds = new Set(state.notifications.map(n => n.id));
        const trulyNew = newNotifications.filter(n => !existingIds.has(n.id));
        if (trulyNew.length === 0) return state;
        return {
            notifications: [...state.notifications, ...trulyNew].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        }
    }),
    markAsRead: (id) => set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    })),
    markAllAsRead: () => set(state => ({
        notifications: state.notifications.map(n => ({...n, isRead: true}))
    })),
}));
