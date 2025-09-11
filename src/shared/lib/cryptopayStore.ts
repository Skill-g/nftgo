import { promises as fs } from "fs";
import path from "path";

export type DepositStatus = "active" | "paid" | "credited" | "expired";
export type Deposit = {
    id: number;
    userId: number;
    amount: number;
    status: DepositStatus;
    cryptopayInvoiceId: number | null;
    invoiceUrl: string | null;
    paidAsset: string | null;
    paidAmount: number | null;
    creditedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

const filePath = path.join(process.cwd(), "data", "deposits.json");
let mem: { lastId: number; rows: Deposit[] } | null = null;

async function ensureFile() {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, JSON.stringify({ lastId: 0, rows: [] }), "utf8");
    }
}

async function load() {
    if (mem) return mem;
    await ensureFile();
    const raw = await fs.readFile(filePath, "utf8");
    mem = JSON.parse(raw) as { lastId: number; rows: Deposit[] };
    return mem!;
}

async function save() {
    if (!mem) return;
    await fs.writeFile(filePath, JSON.stringify(mem), "utf8");
}

export async function createDeposit(input: { userId: number; amount: number; invoiceUrl: string | null; cryptopayInvoiceId: number | null }) {
    const state = await load();
    const now = new Date().toISOString();
    const id = ++state.lastId;
    const row: Deposit = {
        id,
        userId: input.userId,
        amount: input.amount,
        status: "active",
        cryptopayInvoiceId: input.cryptopayInvoiceId,
        invoiceUrl: input.invoiceUrl,
        paidAsset: null,
        paidAmount: null,
        creditedAt: null,
        createdAt: now,
        updatedAt: now,
    };
    state.rows.push(row);
    await save();
    return row;
}

export async function getDepositForUser(id: number, userId: number) {
    const state = await load();
    return state.rows.find((r) => r.id === id && r.userId === userId) || null;
}

export async function updateDeposit(id: number, patch: Partial<Deposit>) {
    const state = await load();
    const idx = state.rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    state.rows[idx] = { ...state.rows[idx], ...patch, updatedAt: new Date().toISOString() };
    await save();
    return state.rows[idx];
}

export async function findByCryptoPayInvoiceId(invoiceId: number) {
    const state = await load();
    return state.rows.find((r) => r.cryptopayInvoiceId === invoiceId) || null;
}
