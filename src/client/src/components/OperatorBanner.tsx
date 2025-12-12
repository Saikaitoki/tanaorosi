import { useState, useRef, useEffect } from 'react';
import { User, Edit2 } from 'lucide-react';

interface Props {
    name: string;
    onChange: (name: string) => void;
}

export function OperatorBanner({ name, onChange }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempName(name);
    }, [name]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const trimmed = tempName.trim();
        if (trimmed) {
            onChange(trimmed);
            setIsEditing(false);
        } else {
            // Revert if empty
            setTempName(name);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setTempName(name);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-blue-600 text-white p-2 flex items-center justify-center shadow-md">
                <input
                    ref={inputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-black px-2 py-1 rounded w-48 text-center"
                    placeholder="担当者名を入力"
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white p-3 flex items-center justify-center gap-2 shadow-md cursor-pointer active:bg-blue-700 transition-colors select-none"
        >
            <User size={18} />
            <span className="font-bold text-lg">
                {name ? `${name} さん` : '担当者未設定'}
            </span>
            <Edit2 size={14} className="opacity-70" />
        </div>
    );
}
