import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setMap } from '@/app/redux/features/maps';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MapSelectionModal({ isOpen, onClose, maps, isLoading }) {
  const dispatch = useDispatch();
  const [selectedMap, setSelectedMap] = useState(null);

  const handleMapSelection = (map) => {
    setSelectedMap(map);
  };

  const handleSave = () => {
    dispatch(setMap(selectedMap));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] max-h-[90vh] rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Select Map</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[40vh] sm:h-[50vh] md:h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              maps.map((map) => (
                <div
                  key={map.uuid}
                  onClick={() => handleMapSelection(map)}
                  className={`cursor-pointer rounded-lg p-3 sm:p-4 border border-gray-200 hover:bg-gray-50 transition-colors ${
                    selectedMap?.uuid === map.uuid ? 'bg-gray-100 ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                      <AvatarImage src={map.displayIcon} alt={map.displayName} />
                      <AvatarFallback>{map.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="mt-2 sm:mt-0 font-bold text-center sm:text-left">{map.displayName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose} size="sm" className="sm:size-default">
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleSave} 
            disabled={!selectedMap}
            size="sm" 
            className="sm:size-default"
          >
            Select Map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

