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
      <DialogContent className="max-w-[60vw] min-w-[60vw] max-h-[90vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Select Team Compositions</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          {/* Attackers */}
          <div>
            <h3 className="font-bold mb-2">Attackers ({selectedAttackers.length}/5)</h3>
            <ScrollArea className="border rounded-lg p-4">
              <div className="grid grid-cols-7 gap-2">
                {agents.map((agent) => (
                  <div
                    key={agent.uuid}
                    onClick={() => handleAgentSelection(agent, 'attackers')}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100
                      ${selectedAttackers.find(a => a.uuid === agent.uuid) ? 'bg-primary/20' : ''}`}
                  >
                    <Avatar>
                      <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                      <AvatarFallback>{agent.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{agent.displayName}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Defenders */}
          <div>
            <h3 className="font-bold mb-2">Defenders ({selectedDefenders.length}/5)</h3>
            <ScrollArea className="border rounded-lg p-4">
              <div className="grid grid-cols-7 gap-2">
                {agents.map((agent) => (
                  <div
                    key={agent.uuid}
                    onClick={() => handleAgentSelection(agent, 'defenders')}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100
                      ${selectedDefenders.find(a => a.uuid === agent.uuid) ? 'bg-primary/20' : ''}`}
                  >
                    <Avatar>
                      <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                      <AvatarFallback>{agent.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{agent.displayName}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={selectedAttackers.length !== 5 || selectedDefenders.length !== 5}
          >
            Save Compositions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 