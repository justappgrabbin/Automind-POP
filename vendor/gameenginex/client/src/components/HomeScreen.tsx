import { useState } from 'react';
import { Button } from './ui/button';

interface HomeScreenProps {
  onEnter: () => void;
}

export function HomeScreen({ onEnter }: HomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleEnter = () => {
    setIsVisible(false);
    setTimeout(onEnter, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-indigo-900 transition-opacity duration-300">
      <div className="text-center space-y-8 px-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Consciousness Oracle
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore your consciousness through the 9-body field system
          </p>
          <div className="flex gap-4 justify-center text-sm text-gray-400">
            <span>🌟 Mind-Body-Heart Balance</span>
            <span>•</span>
            <span>🔮 3-Chart Astrology</span>
            <span>•</span>
            <span>⚛️ SYSTEM X Fields</span>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleEnter}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-12 py-6 text-lg font-bold rounded-full shadow-2xl transition-all hover:scale-105"
          >
            Enter the Oracle
          </Button>
          
          <p className="text-xs text-gray-500">
            Powered by SYSTEM X • Sidereal • Tropical • Draconic
          </p>
        </div>
      </div>
    </div>
  );
}
