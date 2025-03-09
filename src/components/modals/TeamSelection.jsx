import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAttackers, setDefenders } from '@/app/redux/features/teams';
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

export default function TeamSelectionModal({ isOpen, onClose, agents }) {
  const dispatch = useDispatch();
  const [selectedAttackers, setSelectedAttackers] = useState([]);
  const [selectedDefenders, setSelectedDefenders] = useState([]);

  const handleAgentSelection = (agent, team) => {
    if (team === 'attackers') {
      if (selectedAttackers.find(a => a.uuid === agent.uuid)) {
        setSelectedAttackers(selectedAttackers.filter(a => a.uuid !== agent.uuid));
      } else if (selectedAttackers.length < 5) {
        setSelectedAttackers([...selectedAttackers, agent]);
      }
    } else {
      if (selectedDefenders.find(a => a.uuid === agent.uuid)) {
        setSelectedDefenders(selectedDefenders.filter(a => a.uuid !== agent.uuid));
      } else if (selectedDefenders.length < 5) {
        setSelectedDefenders([...selectedDefenders, agent]);
      }
    }
  };

  const handleSave = () => {
    dispatch(setAttackers(selectedAttackers));
    dispatch(setDefenders(selectedDefenders));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] max-h-[90vh] rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Select Team Compositions</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Attackers */}
          <div>
            <h3 className="font-bold mb-1 sm:mb-2">Attackers ({selectedAttackers.length}/5)</h3>
            <ScrollArea className="border rounded-lg p-2 sm:p-4 h-[20vh] sm:h-[25vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                {agents.map((agent) => (
                  <div
                    key={agent.uuid}
                    onClick={() => handleAgentSelection(agent, 'attackers')}
                    className={`flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg cursor-pointer hover:bg-gray-200 active:scale-95 transition-all duration-200
                      ${selectedAttackers.find(a => a.uuid === agent.uuid) ? 'bg-primary/20' : ''}`}
                  >
                    <Avatar className="h-8 w-8 rounded-lg border border-gray-200">
                      <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                      <AvatarFallback>{agent.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold">{agent.displayName}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{agent?.role?.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Defenders */}
          <div>
            <h3 className="font-bold mb-1 sm:mb-2">Defenders ({selectedDefenders.length}/5)</h3>
            <ScrollArea className="border rounded-lg p-2 sm:p-4 h-[20vh] sm:h-[25vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                {agents.map((agent) => (
                  <div
                    key={agent.uuid}
                    onClick={() => handleAgentSelection(agent, 'defenders')}
                    className={`flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg cursor-pointer hover:bg-gray-200 active:scale-95 transition-all duration-200
                      ${selectedDefenders.find(a => a.uuid === agent.uuid) ? 'bg-primary/20' : ''}`}
                  >
                    <Avatar className="h-8 w-8 rounded-lg border border-gray-200">
                      <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                      <AvatarFallback>{agent.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold">{agent.displayName}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{agent?.role?.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} size="sm" className="sm:size-default">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedAttackers.length !== 5 || selectedDefenders.length !== 5}
            size="sm"
            className="sm:size-default"
          >
            Save Compositions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 