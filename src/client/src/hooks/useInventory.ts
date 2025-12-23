import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem } from '../types';

const STORAGE_KEY = 'tanaoroshi_data';
const OPERATOR_KEY = 'tanaoroshi_operator';
const LOCATION_KEY = 'tanaoroshi_location';

export function useInventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [operatorName, setOperatorName] = useState('');
    const [location, setLocation] = useState('');
    const [deletedItem, setDeletedItem] = useState<{ item: InventoryItem; index: number } | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setItems(JSON.parse(saved));
            }
            const savedOp = localStorage.getItem(OPERATOR_KEY);
            if (savedOp) {
                setOperatorName(savedOp);
            }
            const savedLoc = localStorage.getItem(LOCATION_KEY);
            if (savedLoc) {
                setLocation(savedLoc);
            }
        } catch (e) {
            console.error('Failed to load data', e);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        localStorage.setItem(OPERATOR_KEY, operatorName);
    }, [operatorName]);

    useEffect(() => {
        localStorage.setItem(LOCATION_KEY, location);
    }, [location]);

    const addItem = useCallback((newItem: Omit<InventoryItem, 'id'>) => {
        const id = crypto.randomUUID();
        setItems((prev) => [{ ...newItem, id }, ...prev]); // Add to top
    }, []);

    const updateItem = useCallback((id: string, partial: Partial<InventoryItem>) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...partial } : item)));
    }, []);

    const deleteItem = useCallback((id: string) => {
        setItems((prev) => {
            const idx = prev.findIndex((i) => i.id === id);
            if (idx === -1) return prev;
            const target = prev[idx];
            setDeletedItem({ item: target, index: idx });
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
    }, []);

    const undoDelete = useCallback(() => {
        if (!deletedItem) return;
        setItems((prev) => {
            const next = [...prev];
            next.splice(deletedItem.index, 0, deletedItem.item);
            return next;
        });
        setDeletedItem(null);
    }, [deletedItem]);

    const clearAll = useCallback((force: boolean = false) => {
        if (force || window.confirm('全てのデータを削除しますか？')) {
            setItems([]);
            setDeletedItem(null);
        }
    }, []);

    return {
        items,
        operatorName,
        setOperatorName,
        location,
        setLocation,
        addItem,
        updateItem,
        deleteItem,
        undoDelete,
        canUndo: !!deletedItem,
        clearAll,
    };
}
