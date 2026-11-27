import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ResonantUtilityDashboard } from './ResonantUtilityDashboard';
import { QuantumCoordinateDisplay } from './QuantumCoordinateDisplay';
import { AwarenessCenterUI } from './AwarenessCenterUI';
import { ElementalOperatorUI } from './ElementalOperatorUI';

export function ResponsiveOraclePanels() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg pointer-events-auto"
            aria-label="Open Oracle Panels"
          >
            🔮 Oracle
          </button>
        )}
        
        {isOpen && (
          <div className="fixed inset-0 pointer-events-none">
            <div className="fixed top-0 left-0 right-0 pointer-events-auto z-50 bg-black/95">
              <div className="flex items-center justify-between p-2 border-b border-purple-500/50">
                <h2 className="text-white text-sm font-bold">Consciousness Oracle</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-purple-400 px-3 py-1"
                  aria-label="Close Oracle Panels"
                >
                  ✕
                </button>
              </div>
              <Tabs defaultValue="oracle" className="w-full">
            <TabsList className="w-full grid grid-cols-4 bg-black/90 border-b border-purple-500/50">
              <TabsTrigger value="oracle" className="text-xs px-2" aria-label="Resonant Utility Oracle">
                <span aria-hidden="true">⚛️</span>
                <span className="sr-only">Oracle</span>
              </TabsTrigger>
              <TabsTrigger value="quantum" className="text-xs px-2" aria-label="Quantum Coordinates">
                <span aria-hidden="true">🌌</span>
                <span className="sr-only">Quantum</span>
              </TabsTrigger>
              <TabsTrigger value="awareness" className="text-xs px-2" aria-label="Awareness Centers">
                <span aria-hidden="true">⚡</span>
                <span className="sr-only">Awareness</span>
              </TabsTrigger>
              <TabsTrigger value="resonance" className="text-xs px-2" aria-label="Elemental Resonance">
                <span aria-hidden="true">✨</span>
                <span className="sr-only">Resonance</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="oracle" className="m-0">
              <div className="p-2 max-h-[calc(100vh-3rem)] overflow-y-auto">
                {/* Override absolute positioning from child components for mobile layout
                    IMPORTANT: Child oracle panels use absolute positioning for desktop.
                    These overrides neutralize that positioning within the mobile tabs. */}
                <div className="[&>*]:!static [&>*]:!transform-none [&>*]:!max-w-full [&>*]:!w-full [&>*]:!m-0">
                  <ResonantUtilityDashboard />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quantum" className="m-0">
              <div className="p-2 max-h-[calc(100vh-3rem)] overflow-y-auto">
                <div className="[&>*]:!static [&>*]:!transform-none [&>*]:!max-w-full [&>*]:!w-full [&>*]:!m-0">
                  <QuantumCoordinateDisplay />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="awareness" className="m-0">
              <div className="p-2 max-h-[calc(100vh-3rem)] overflow-y-auto">
                <div className="[&>*]:!static [&>*]:!transform-none [&>*]:!max-w-full [&>*]:!w-full [&>*]:!m-0">
                  <AwarenessCenterUI />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="resonance" className="m-0">
              <div className="p-2 max-h-[calc(100vh-3rem)] overflow-y-auto">
                <div className="[&>*]:!static [&>*]:!transform-none [&>*]:!max-w-full [&>*]:!w-full [&>*]:!m-0">
                  <ElementalOperatorUI />
                </div>
              </div>
            </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <ResonantUtilityDashboard />
        <QuantumCoordinateDisplay />
        <AwarenessCenterUI />
        <ElementalOperatorUI />
      </div>
    </>
  );
}
