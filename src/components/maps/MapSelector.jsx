import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MapSelector({ map, onSelectMap, onResetMap }) {
  return (
    <Card className="flex justify-between bg-black/50 backdrop-blur-md items-center p-3 sm:p-6 w-full border border-gray-800 relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between gap-2 relative z-10 w-full">
        {map ? (
          <span className="text-xl sm:text-2xl font-semibold text-white drop-shadow-md transition-all duration-300">{map.displayName}</span>
        ) : (
          <span className="text-xl sm:text-2xl font-semibold text-white drop-shadow-md">Select a Map</span>
        )}

        <Button 
          variant="outline" 
          className="bg-white/90 hover:bg-white/100 text-xs sm:text-sm shadow-md transition-all duration-200 hover:shadow-lg" 
          onClick={() => map ? onResetMap() : onSelectMap()}
        >
          {map ? 'Reset' : 'Map Selection'}
        </Button>
      </div>

      {/* Dark overlay */}
      {map && (
        <div className="absolute inset-0 bg-black/40 z-0" />
      )}
    </Card>
  );
} 