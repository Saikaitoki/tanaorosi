import type { InventoryItem } from '../types';

export interface LookupResult {
    ok: boolean;
    name?: string;
    error?: string;
    record?: any;
}

export async function lookupJan(jan: string): Promise<LookupResult> {
    try {
        const res = await fetch(`/kintone/lookup?jan=${encodeURIComponent(jan)}`);
        if (!res.ok) {
            return { ok: false, error: `HTTP Error: ${res.status}` };
        }
        const data = await res.json();
        return data; // { ok: true, name: "...", record: ... } or { ok: false, error: ... }
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

export async function sendRecords(items: InventoryItem[], operatorName: string, location: string) {
    if (items.length === 0) return;

    // Split into chunks of 100
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
        const tableRows = chunk.map(item => ({
            value: {
                ['JAN']: { value: String(item.jan) },
                ['qty']: { value: String(item.qty) },
                ['商品名']: { value: item.name || '' }
            }
        }));

        const payload = {
            record: {
                ['subtable']: { value: tableRows },
                '担当者': { value: operatorName || '' },
                'ロケーション': { value: location || '' }
            }
        };

        const res = await fetch('/kintone/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Unknown error');
        }
    }
}
