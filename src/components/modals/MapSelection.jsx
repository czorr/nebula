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

export default function MapSelectionModal({ isOpen, onClose, maps }) {
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
      <DialogContent className="max-w-[60vw] min-w-[60vw] max-h-[90vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Select Map</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-3 gap-4">
            {maps.map((map) => (
              <div
                key={map.uuid}
                onClick={() => handleMapSelection(map)}
                className={`cursor-pointer rounded-lg p-4 border border-gray-200 ${
                  selectedMap === map ? 'bg-gray-100' : ''
                }`}
              >
                <Avatar className="w-16 h-16">
                  <AvatarImage src={map.displayIcon} alt={map.displayName} />
                  <AvatarFallback>{map.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="mt-2 font-bold">{map.displayName}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Select Map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

