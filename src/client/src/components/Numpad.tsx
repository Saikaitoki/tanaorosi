import { Delete, Check, X } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    onInput: (char: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    onEnter: () => void;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function Numpad({ onInput, onBackspace, onClear, onEnter, isOpen, onClose, className }: Props) {
    if (!isOpen) return null;

    const btnClass = "flex items-center justify-center p-4 text-2xl font-bold bg-white active:bg-gray-200 rounded-lg shadow border border-gray-200 select-none touch-manipulation h-16 sm:h-20";

    return (
        <div className={clsx("fixed bottom-0 left-0 right-0 bg-gray-100 p-2 sm:p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform duration-200 ease-out pb-safe", isOpen ? "translate-y-0" : "translate-y-full", className)}>
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-gray-500 text-sm font-medium">数量を入力</span>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-transparent">
                    <X size={24} />
                </button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
                {['7', '8', '9'].map(k => (
                    <button key={k} onClick={() => onInput(k)} className={btnClass}>{k}</button>
                ))}
                <button onClick={onBackspace} className={clsx(btnClass, "text-red-500")} data-label="backspace">
                    <Delete />
                </button>

                {['4', '5', '6'].map(k => (
                    <button key={k} onClick={() => onInput(k)} className={btnClass}>{k}</button>
                ))}
                <button onClick={onClear} className={clsx(btnClass, "text-orange-500 text-lg")} data-label="clear">
                    C
                </button>

                {['1', '2', '3'].map(k => (
                    <button key={k} onClick={() => onInput(k)} className={btnClass}>{k}</button>
                ))}
                <button onClick={onEnter} className={clsx(btnClass, "row-span-2 bg-blue-600 text-white active:bg-blue-700 active:text-white border-blue-600 flex-col gap-1")} data-label="enter">
                    <Check />
                    <span className="text-xs">OK</span>
                </button>

                <button onClick={() => onInput('0')} className={clsx(btnClass, "col-span-3")}>0</button>
            </div>
        </div>
    );
}
