export interface InventoryItem {
    id: string;
    jan: string;
    qty: number;
    name: string;
}

export type InventoryState = {
    items: InventoryItem[];
    operatorName: string;
};
