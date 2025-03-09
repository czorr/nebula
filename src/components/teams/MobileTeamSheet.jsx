import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

export default function MobileTeamSheet({ 
  title, 
  agents, 
  isOpen, 
  onOpenChange, 
  onSelectTeam, 
  side 
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full bg-black/50 backdrop-blur-md border border-gray-700 text-white">
          <Users className="mr-2 h-4 w-4" />
          {title} ({agents.length}/5)
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="bg-black/90 backdrop-blur-md border-gray-800 text-white">
        <SheetHeader>
          <SheetTitle className="text-white">{title}</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <Button size="sm" variant="outline" onClick={() => {
            onSelectTeam();
            onOpenChange(false);
          }} className="bg-white/10 text-white hover:bg-white/20 border-gray-600 mb-4">
            Select Team
          </Button>
          <ScrollArea className="h-[70vh]">
            <div className="flex flex-col gap-2">
              {agents.length === 0 ? (
                <div className="text-center py-6 text-white/70 italic">No agents selected</div>
              ) : (
                agents.map((agent) => (
                  <div 
                    key={agent.uuid} 
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-700 bg-black/30 transition-all duration-200 hover:bg-black/50" 
                    style={{ 
                      background: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), ${agent.backgroundGradientColors ? `linear-gradient(to right, ${agent.backgroundGradientColors[0]}40, ${agent.backgroundGradientColors[1]}40)` : 'none'}` 
                    }}
                  >
                    <Avatar className="h-8 w-8 border border-gray-600">
                      <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                      <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm text-white">{agent.displayName}</span>
                      <span className="text-xs text-white/70">
                        {agent?.role?.displayName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
} 