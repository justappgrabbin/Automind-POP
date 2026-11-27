import { CharacterPicker } from './CharacterPicker';

export function GameUI() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <CharacterPicker />
      
      <div className="fixed bottom-4 right-4 pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-purple-500/50 text-white">
          <h4 className="font-bold text-purple-400 mb-2">Controls</h4>
          <div className="space-y-1 text-sm text-gray-300">
            <div><kbd className="px-2 py-1 bg-purple-900/50 rounded">Click</kbd> Select agent</div>
            <div><kbd className="px-2 py-1 bg-purple-900/50 rounded">Drag</kbd> Rotate camera</div>
            <div><kbd className="px-2 py-1 bg-purple-900/50 rounded">Scroll</kbd> Zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
}
