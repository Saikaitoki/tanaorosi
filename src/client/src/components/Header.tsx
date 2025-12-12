import { useState, useEffect } from 'react';
import { User, MapPin, Edit2, X } from 'lucide-react';

interface Props {
    operatorName: string;
    onOperatorChange: (name: string) => void;
    location: string;
    onLocationChange: (loc: string) => void;
}

export function Header({ operatorName, onOperatorChange, location, onLocationChange }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(operatorName === '');
    // Open modal by default if no operator set? User request said "Display Operator and Location in header. Clicking opens modal."
    // But login flow usually implies forcing it if empty. For now, keep it simple.

    const [tempOperator, setTempOperator] = useState(operatorName);
    const [tempLocation, setTempLocation] = useState(location);

    // Sync input when props change (if not editing? or just for initial)
    useEffect(() => {
        if (!isModalOpen) {
            setTempOperator(operatorName);
            setTempLocation(location);
        }
    }, [operatorName, location, isModalOpen]);

    const handleSave = () => {
        onOperatorChange(tempOperator.trim());
        onLocationChange(tempLocation.trim());
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Header Bar */}
            <div
                className="bg-blue-600 text-white p-3 shadow-md flex items-center justify-between cursor-pointer active:bg-blue-700 transition-colors select-none sticky top-0 z-30"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-center gap-4 mx-auto">
                    <div className="flex items-center gap-1">
                        <User size={18} />
                        <span className="font-bold">
                            {operatorName || '担当者未設定'}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/30" />
                    <div className="flex items-center gap-1">
                        <MapPin size={18} />
                        <span className="font-bold">
                            {location || 'ロケーション未設定'}
                        </span>
                    </div>
                    <Edit2 size={14} className="opacity-70 ml-2" />
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h2 className="font-bold text-lg text-gray-800">作業設定</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1 flex items-center gap-1">
                                    <User size={16} /> 担当者名
                                </label>
                                <input
                                    type="text"
                                    value={tempOperator}
                                    onChange={(e) => setTempOperator(e.target.value)}
                                    className="w-full text-lg p-3 border border-gray-300 rounded focus:border-blue-500 outline-none"
                                    placeholder="例: 山田 太郎"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1 flex items-center gap-1">
                                    <MapPin size={16} /> ロケーション
                                </label>
                                <input
                                    type="text"
                                    value={tempLocation}
                                    onChange={(e) => setTempLocation(e.target.value)}
                                    className="w-full text-lg p-3 border border-gray-300 rounded focus:border-blue-500 outline-none"
                                    placeholder="例: A-1, 1F倉庫"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all active:scale-[0.98]"
                        >
                            保存して開始
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
