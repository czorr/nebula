import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeamCard({ title, agents, onSelectTeam }) {
  return (
    <Card className="hidden lg:block lg:max-w-[250px] xl:max-w-[300px] w-full lg:shrink-0 bg-black/40 backdrop-blur-md border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="border-b border-gray-700 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 pr-2 sm:pr-4">
        <CardHeader className="p-0 sm:p-1">
          <CardTitle className="text-base sm:text-lg text-white">{title}</CardTitle>
        </CardHeader>
        <Button size="sm" variant="outline" onClick={onSelectTeam} className="bg-white/10 text-white hover:bg-white/20 border-gray-600">
          Select
        </Button>
      </div>
      <CardContent className="p-2 sm:p-4">
        <ScrollArea className="overflow-y-auto max-h-[30vh] lg:max-h-[60vh]">
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
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-gray-600">
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
      </CardContent>
    </Card>
  );
} 