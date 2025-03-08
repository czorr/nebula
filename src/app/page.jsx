"use client";

import { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "@/app/redux/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TeamSelectionModal from "@/components/modals/TeamSelection";
import MapSelectionModal from "@/components/modals/MapSelection";
import { resetMap } from "@/app/redux/features/maps";
function StratsContent() {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [agents, setAgents] = useState([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { attackers, defenders } = useSelector((state) => state.teams);
  const [maps, setMaps] = useState([]);
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);
  const { map } = useSelector((state) => state.maps);
  
  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      const response = await fetch("/api/agents");
      const data = await response.json();
      setAgents(data.data);
    };
    fetchAgents();
  }, []);

  // Fetch Maps
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setIsLoadingMaps(true);
        const response = await fetch("/api/maps");
        const data = await response.json();
        setMaps(data.data);
      } catch (error) {
        console.error("Error fetching maps:", error);
      } finally {
        setIsLoadingMaps(false);
      }
    };
    fetchMaps();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    const response = await fetch("/api/strats/evaluate", {
      method: "POST",
      body: JSON.stringify({ prompt: input }),
    });
    const data = await response.json();

    setMessages((prev) => [...prev, data.message]);
  };

  return (
    <>
      <TeamSelectionModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        agents={agents}
      />

      <MapSelectionModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        maps={maps || []}
        isLoading={isLoadingMaps}
      />

      <main className="flex flex-col items-center justify-center min-h-screen">
        <div className="container mx-auto p-4 max-w-7xl gap-4 flex flex-col">

          {/* Map Selection Topbar */}
          <Card 
            className="flex justify-between items-center p-6 w-full border border-gray-200 rounded-lg relative overflow-hidden"
            style={{
              backgroundImage: map ? `url(${map.listViewIcon})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="flex items-center gap-2 relative z-10">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (map) {
                    dispatch(resetMap());
                  } else {
                    setIsMapModalOpen(true);
                  }
                }}
                className="bg-white/90 hover:bg-white/100"
              >
                {map ? 'Reset' : 'Map Selection'}
              </Button>
              {map && (
                <span className="text-sm font-semibold text-white drop-shadow-md">{map.displayName}</span>
              )}
            </div>
            {/* Add a dark overlay when map is selected */}
            {map && (
              <div className="absolute inset-0 bg-black/30 z-0" />
            )}
          </Card>

          <div className="grid grid-cols-[250px_1fr_250px] gap-4">
            {/* Left Sidebar - Attacker Team */}
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>Attacker Team</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="flex flex-col gap-2">
                    {attackers.map((agent) => (
                      <div key={agent.uuid} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                          <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{agent.displayName}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className="h-[600px] flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-2xl font-bold">Valorant Strategy Planner</h2>
                <p className="text-sm text-muted-foreground">
                  Chat with AI to create your perfect strategy
                </p>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <Avatar>
                          <AvatarFallback>AI</AvatarFallback>
                          <AvatarImage src="/bot-avatar.png" />
                        </Avatar>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "user" && (
                        <Avatar>
                          <AvatarFallback>ME</AvatarFallback>
                          <AvatarImage src="/user-avatar.png" />
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Send</Button>
              </form>
            </Card>

            {/* Right Sidebar - Defender Team */}
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>Defender Team</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="flex flex-col gap-2">
                    {defenders.map((agent) => (
                      <div key={agent.uuid} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                          <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{agent.displayName}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

export default function Strats() {
  return (
    <Provider store={store}>
      <StratsContent />
    </Provider>
  );
}