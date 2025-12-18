import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, Search, Send, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

import { lookupJan, sendRecords } from '../lib/kintoneApi';
import { Numpad } from './Numpad';
import type { InventoryItem } from '../types';
import type { DeviceMode } from '../hooks/useSettings';

interface Props {
    items: InventoryItem[];
    onAdd: (item: Omit<InventoryItem, 'id'>) => void;
    onUpdate: (id: string, partial: Partial<InventoryItem>) => void;
    onDelete: (id: string) => void;
    operatorName: string;
    location: string;
    deviceMode: DeviceMode;
    onClear: () => void;
}

export function InventoryTable({ items, onAdd, onUpdate, onDelete, operatorName, location, deviceMode, onClear }: Props) {
    // Input State
    const [jan, setJan] = useState('');
    const [qty, setQty] = useState(''); // String to handle empty state
    const [name, setName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Keyboard State
    const [qtyInputMode, setQtyInputMode] = useState<'numeric' | 'none'>('numeric');

    // Update input mode when deviceMode changes
    useEffect(() => {
        if (deviceMode === 'ios') {
            setQtyInputMode('none');
        } else {
            setQtyInputMode('numeric');
        }
    }, [deviceMode]);

    // Focus & Numpad State
    const janInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);
    const [showNumpad, setShowNumpad] = useState(false);
    const [activeInputId, setActiveInputId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');


    // Helper: Focus JAN
    const focusJan = useCallback(() => {
        // Small delay to ensure UI ready
        requestAnimationFrame(() => {
            janInputRef.current?.focus();
        });
    }, []);

    // Helper: Reset Input
    const resetInput = useCallback(() => {
        setJan('');
        setQty('');
        setName('');
        focusJan();
    }, [focusJan]);

    // Handler: JAN Enter
    const handleJanKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cleanJan = jan.trim().replace(/\D/g, ''); // Numbers only
            if (!cleanJan) return;

            setJan(cleanJan); // normalize
            setIsSearching(true);

            try {
                const res = await lookupJan(cleanJan);
                if (res.ok) {
                    setName(res.name || '');
                    toast.success('商品が見つかりました');
                } else {
                    setName('');
                    toast.warning('該当商品なし（そのまま登録可能です）');
                }
            } catch (err) {
                console.error(err);
                toast.error('通信エラー');
            } finally {
                setIsSearching(false);
                // Move to Qty
                requestAnimationFrame(() => {
                    qtyInputRef.current?.focus();
                    if (deviceMode === 'ios') {
                        // iOS: Force Numpad, Native KB is hidden by inputMode=none
                        setShowNumpad(true);
                    } else {
                        // Android: inputMode=numeric (default), so Native KB appears.
                        // Do we show Numpad? User implies Android uses "Standard Keyboard".
                        // So hide Numpad by default.
                        setShowNumpad(false);
                    }
                });
            }
        }
    };

    // Handler: Add Item
    const handleAddItem = () => {
        const q = parseInt(qty, 10);
        if (isNaN(q) || q <= 0) {
            toast.error('数量は1以上の数値を入力してください');
            return;
        }
        if (!jan) {
            toast.error('JANコードを入力してください');
            focusJan();
            return;
        }

        onAdd({
            jan,
            qty: q,
            name: name,
        });

        // toast.success(`${jan} を追加しました`, { duration: 1500 }); // Optional, might be noisy

        // Reset but keep numpad open? No, close numpad and go to JAN
        setActiveInputId(null);
        setShowNumpad(false);
        resetInput();
    };

    const handleQtyKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    };

    // Handle Send
    const handleSend = async () => {
        if (items.length === 0) return;
        if (!window.confirm(`${items.length}件のデータを送信しますか？`)) return;

        setIsSending(true);
        try {
            await sendRecords(items, operatorName, location);
            toast.success('送信しました！');
            resetInput();
            onClear();
        } catch (e: any) {
            toast.error(`送信失敗: ${e.message}`);
        } finally {
            setIsSending(false);
        }
    };

    // Numpad handlers
    const onNumpadInput = (char: string) => {
        if (activeInputId) {
            // Edit existing item
            let next = editValue + char;
            // Sanitize leading zero (e.g. "05" -> "5")
            if (next.length > 1 && next.startsWith('0')) {
                next = next.replace(/^0+/, '');
            }
            setEditValue(next);
            // Update item (empty -> 0)
            const newQty = next === '' ? 0 : parseInt(next, 10);
            if (!isNaN(newQty)) {
                onUpdate(activeInputId, { qty: newQty });
            }
        } else {
            // Add new item
            setQty(prev => prev + char);
        }
    };
    const onNumpadBackspace = () => {
        if (activeInputId) {
            const next = editValue.slice(0, -1);
            setEditValue(next);
            const val = next === '' ? 0 : parseInt(next, 10);
            onUpdate(activeInputId, { qty: val });
        } else {
            setQty(prev => prev.slice(0, -1));
        }
    };
    const onNumpadClear = () => {
        if (activeInputId) {
            setEditValue('');
            onUpdate(activeInputId, { qty: 0 });
        } else {
            setQty('');
        }
    };

    // Toggle Input Mode
    const toggleQtyInputMode = () => {
        setQtyInputMode(prev => (prev === 'none' ? 'numeric' : 'none'));
        // Re-focus to apply input mode change
        setTimeout(() => qtyInputRef.current?.focus(), 50);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Input Area */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-16 z-20">
                <div className="grid grid-cols-[2fr_1fr] gap-2 mb-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">JANコード</label>
                        <input
                            ref={janInputRef}
                            type="number"
                            inputMode="none" // Scanner only!
                            value={jan}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Full-width to half-width
                                const normalized = val.replace(/[０-９]/g, (s) =>
                                    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
                                );
                                // Only numbers
                                const numeric = normalized.replace(/[^0-9]/g, '');
                                setJan(numeric);
                            }}
                            onKeyDown={handleJanKeyDown}
                            placeholder="スキャン"
                            className="w-full text-lg p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            autoComplete="off"
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex justify-between">
                            数量
                            <button
                                onClick={toggleQtyInputMode}
                                className={clsx("text-xs flex items-center gap-1 px-1 rounded hover:bg-gray-100",
                                    qtyInputMode === 'numeric' ? "text-blue-600" : "text-gray-400"
                                )}
                                title="キーボード切替"
                            >
                                <Keyboard size={14} />
                            </button>
                        </label>
                        <input
                            ref={qtyInputRef}
                            type="number"
                            inputMode={qtyInputMode}
                            value={qty}
                            onFocus={() => {
                                if (deviceMode === 'ios') {
                                    setShowNumpad(true);
                                }
                            }}
                            onChange={(e) => setQty(e.target.value)}
                            onKeyDown={handleQtyKeyDown}
                            onClick={() => {
                                if (deviceMode === 'ios') setShowNumpad(true);
                                setActiveInputId(null);
                            }}
                            placeholder="0"
                            className="w-full text-lg p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right font-mono"
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* Product Name & Status */}
                <div className="min-h-[1.5rem] mb-2">
                    {isSearching ? (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Search size={14} className="animate-spin" /> 検索中...
                        </span>
                    ) : name ? (
                        <span className="text-sm font-medium text-green-700">{name}</span>
                    ) : jan && jan.length > 8 ? (
                        <span className="text-xs text-gray-400">商品名未登録</span>
                    ) : null}
                </div>

                {/* Manual Add Button (usually Enter is enough, but for safety) */}
                {!showNumpad && (
                    <button
                        onClick={handleAddItem}
                        disabled={!jan || !qty}
                        className="w-full py-3 bg-gray-800 text-white rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    >
                        追加
                    </button>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-2 w-10 font-semibold text-center text-gray-400">No.</th>
                            <th className="p-2 font-semibold">JAN / 商品名</th>
                            <th className="p-2 font-semibold text-right w-14">数量</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                                    データがありません
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={item.id} className={clsx("group active:bg-blue-50 transition-colors", idx === 0 ? "bg-blue-50/50" : "")}>
                                    <td className="p-2 text-center text-gray-400 font-mono text-xs align-top pt-3">
                                        {items.length - idx}
                                    </td>
                                    <td className="p-2 align-top">
                                        <div className="font-mono text-gray-900 font-medium">{item.jan}</div>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                                            className="text-sm text-gray-500 w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none placeholder-gray-300"
                                            placeholder="商品名..."
                                        />
                                    </td>
                                    <td className="p-2 text-right font-mono text-lg font-bold text-gray-800">
                                        <input
                                            type="number"
                                            inputMode={qtyInputMode}
                                            value={activeInputId === item.id ? editValue : item.qty}
                                            onChange={(e) => {
                                                let v = e.target.value;
                                                // Sanitize leading zero
                                                if (v.length > 1 && v.startsWith('0')) {
                                                    v = v.replace(/^0+/, '');
                                                }
                                                setEditValue(v);
                                                onUpdate(item.id, { qty: v === '' ? 0 : parseInt(v, 10) });
                                            }}
                                            onFocus={() => {
                                                setActiveInputId(item.id);
                                                setEditValue(item.qty.toString());
                                                if (deviceMode === 'ios') setShowNumpad(true);
                                            }}
                                            onClick={() => {
                                                setActiveInputId(item.id);
                                                setEditValue(item.qty.toString());
                                                if (deviceMode === 'ios') setShowNumpad(true);
                                            }}
                                            className="w-14 text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none p-0"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Send Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-gray-200 backdrop-blur-sm z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleSend}
                    disabled={items.length === 0 || isSending}
                    className={clsx(
                        "w-full max-w-3xl mx-auto flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white text-lg shadow-lg active:scale-[0.98] transition-all",
                        isSending ? "bg-gray-400 cursor-wait" : items.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"
                    )}
                >
                    {isSending ? (
                        <>送信中...</>
                    ) : (
                        <><Send size={20} /> 送信する ({items.length}件)</>
                    )}
                </button>
            </div>

            {/* Spacer for saved bottom bar */}
            <div className="h-20" />

            <Numpad
                isOpen={showNumpad && deviceMode === 'ios'}
                onClose={() => setShowNumpad(false)}
                onInput={onNumpadInput}
                onBackspace={onNumpadBackspace}
                onClear={onNumpadClear}
                onEnter={() => {
                    if (activeInputId) {
                        setShowNumpad(false);
                        setActiveInputId(null);
                    } else {
                        handleAddItem();
                    }
                }}
            />
        </div>
    );
}
