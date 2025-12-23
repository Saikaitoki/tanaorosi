import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { InventoryTable } from './components/InventoryTable';
import { SettingsDialog } from './components/SettingsDialog';
import { useInventory } from './hooks/useInventory';
import { useSettings } from './hooks/useSettings';
import { useState } from 'react';
import { Settings } from 'lucide-react';

function App() {
  const {
    items,
    operatorName,
    setOperatorName,
    addItem,
    updateItem,
    deleteItem,
    undoDelete,
    canUndo,
    clearAll,
    location,
    setLocation
  } = useInventory();

  const { settings, setDeviceMode } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32">
      <Toaster position="top-right" richColors />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentMode={settings.deviceMode}
        onModeChange={setDeviceMode}
      />

      {/* Header / Operator */}
      <Header
        operatorName={operatorName}
        onOperatorChange={setOperatorName}
        location={location}
        onLocationChange={setLocation}
      />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-2 sm:p-4 flex flex-col gap-4">
        {/* Actions Bar (Undo/Clear/Settings) */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-700">棚卸しリスト ({items.length}件)</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              title="設定"
            >
              <Settings size={20} />
            </button>

            {canUndo && (
              <button
                onClick={undoDelete}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium border border-yellow-300 hover:bg-yellow-200 transition-colors"
              >
                元に戻す
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={() => clearAll()}
                className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                全削除
              </button>
            )}
          </div>
        </div>

        <InventoryTable
          items={items}
          onAdd={addItem}
          onUpdate={updateItem}
          onDelete={deleteItem}
          operatorName={operatorName}
          location={location}

          deviceMode={settings.deviceMode}
          onClear={clearAll}
        />
      </main>

    </div>
  );
}

export default App;
