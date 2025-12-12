import { X, Smartphone } from 'lucide-react';
import clsx from 'clsx';
import type { DeviceMode } from '../hooks/useSettings';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentMode: DeviceMode;
    onModeChange: (mode: DeviceMode) => void;
}

export function SettingsDialog({ isOpen, onClose, currentMode, onModeChange }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="font-bold text-lg text-gray-800">設定</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">
                            動作モード (端末設定)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => onModeChange('android')}
                                className={clsx(
                                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                                    currentMode === 'android'
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                )}
                            >
                                <Smartphone size={24} className="mb-2" />
                                <span className="font-bold text-sm">Android</span>
                                <span className="text-[10px] opacity-75 mt-1">標準キーボード</span>
                            </button>

                            <button
                                onClick={() => onModeChange('ios')}
                                className={clsx(
                                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                                    currentMode === 'ios'
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                )}
                            >
                                <Smartphone size={24} className="mb-2" />
                                <span className="font-bold text-sm">iOS (iPhone)</span>
                                <span className="text-[10px] opacity-75 mt-1">画面テンキーのみ</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 text-xs text-gray-500">
                    ※ 動作モードを変更すると、数量入力時のキーボードの挙動が変わります。
                </div>
            </div>
        </div>
    );
}
