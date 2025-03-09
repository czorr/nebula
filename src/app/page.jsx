"use client";

import { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "@/app/redux/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import TeamSelectionModal from "@/components/modals/TeamSelection";
import MapSelectionModal from "@/components/modals/MapSelection";
import { resetMap } from "@/app/redux/features/maps";
import { addMessage, setLoading, setError } from './redux/features/chat.js';
import { Loader2, Users } from "lucide-react";
import Markdown from 'react-markdown';

function StratsContent() {

  const dispatch = useDispatch(); 
  const [input, setInput] = useState(""); // Input
  const [agents, setAgents] = useState([]); // Agents
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false); // Team selection modal
  const [isMapModalOpen, setIsMapModalOpen] = useState(false); // Map selection modal
  const { attackers, defenders } = useSelector((state) => state.teams); // Attacker and defender teams
  const [maps, setMaps] = useState([]); // Maps
  const [isLoadingMaps, setIsLoadingMaps] = useState(true); // Loading state for maps
  const { map } = useSelector((state) => state.maps); // Selected map
  const chatMessages = useSelector(state => state.chat.messages); // Chat messages
  const isLoadingChat = useSelector(state => state.chat.isLoading); // Loading state for chat
  const agentStatus = useSelector(state => state.agentStatus.agentStatus); // Agent status
  const [openAttackers, setOpenAttackers] = useState(false);
  const [openDefenders, setOpenDefenders] = useState(false);

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

  //! Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      role: "user",
      content: input,
    };

    dispatch(addMessage(newMessage));
    dispatch(setLoading(true));
    setInput("");

    try {
      const response = await fetch("/api/strat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          attackers,
          defenders,
          selectedMap: map,
          messageHistory: chatMessages,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      //* First process the tools
      const toolMessages = [];
      
      //* If there are tool calls
      if (data.toolCalls) {
        // Sort tools by their index
        const sortedTools = [...data.toolCalls].sort((a, b) => a.order - b.order);
        
        sortedTools.forEach(tool => {
          // Only show relevant tools (ignore the finishTask tool)
          if (tool.phase === "contributing" || tool.phase === "final") {

            //! Can be removed after the repo demo to Seals (just showing the start phase for demo purposes)
            if (tool.name !== "finishTask") {
              toolMessages.push({
                role: "tool_call",
                content: `🔍 Using ${tool.name} with parameters: ${JSON.stringify(tool.arguments)}`,
                tool_info: {
                  name: tool.name,
                  arguments: tool.arguments
                },
                phase: "start"
              });
              
              // Add the end phase of the tool call
              toolMessages.push({
                role: "tool_call",
                content: `✓ Completed ${tool.name} operation`,
                tool_info: {
                  name: tool.name,
                  arguments: tool.arguments
                },
                phase: "end"
              });
            }
          }
        });
      }
      
      // Add the tool messages to the chat
      toolMessages.forEach(msg => {
        dispatch(addMessage(msg));
      });
      
      // Finally add the model response
      dispatch(addMessage(data.message));

    } catch (error) {
      console.error("Error sending message:", error);
      dispatch(setError(error.message));
      dispatch(addMessage({
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
      }));
    } finally {
      dispatch(setLoading(false));
    }
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

      <main 
        className="flex flex-col items-center justify-center min-h-screen w-full bg-black/80 bg-blend-overlay bg-gradient-to-b from-black/10 to-black/70" 
        style={{ 
          backgroundImage: `url(${map ? map.splash : 'none'})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          transition: 'background-image 0.5s ease-in-out'
        }}
      >
        <div className="p-2 sm:p-4 gap-2 sm:gap-4 flex flex-col w-full max-w-[80vw] mx-auto">

          {/* Map Selection Topbar */}
          <Card className="flex justify-between bg-black/50 backdrop-blur-md items-center p-3 sm:p-6 w-full border border-gray-800 relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between gap-2 relative z-10 w-full">

              {map ? (
                <span className="text-xl sm:text-2xl font-semibold text-white drop-shadow-md transition-all duration-300">{map.displayName}</span>
              ) : (
                <span className="text-xl sm:text-2xl font-semibold text-white drop-shadow-md">Select a Map</span>
              )}

              <Button variant="outline" className="bg-white/90 hover:bg-white/100 text-xs sm:text-sm shadow-md transition-all duration-200 hover:shadow-lg" 
                onClick={() => {
                  if (map) {
                    dispatch(resetMap());
                  } else {
                    setIsMapModalOpen(true);
                  }
                }}
              >
                {map ? 'Reset' : 'Map Selection'}
              </Button>

            </div>

            {/* Dark overlay */}
            {map && (
              <div className="absolute inset-0 bg-black/40 z-0" />
            )}
          </Card>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row w-full gap-2 sm:gap-4">

            {/* MOBILE: Left Sidebar - Attacker Team */}
            <div className="lg:hidden">
              <Sheet open={openAttackers} onOpenChange={setOpenAttackers}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full bg-black/50 backdrop-blur-md border border-gray-700 text-white">
                    <Users className="mr-2 h-4 w-4" />
                    Attackers ({attackers.length}/5)
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-black/90 backdrop-blur-md border-gray-800 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-white">Attacker Team</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <Button size="sm" variant="outline" onClick={() => {
                      setIsTeamModalOpen(true);
                      setOpenAttackers(false);
                    }} className="bg-white/10 text-white hover:bg-white/20 border-gray-600 mb-4">
                      Select Team
                    </Button>
                    <ScrollArea className="h-[70vh]">
                      <div className="flex flex-col gap-2">
                        {attackers.length === 0 ? (
                          <div className="text-center py-6 text-white/70 italic">No agents selected</div>
                        ) : (
                          attackers.map((agent) => (
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
                                  {agent.role.displayName}
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
            </div>

            {/* DESKTOP: Left Sidebar - Attacker Team */}
            <Card className="hidden lg:block lg:max-w-[250px] xl:max-w-[300px] w-full lg:shrink-0 bg-black/40 backdrop-blur-md border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="border-b border-gray-700 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 pr-2 sm:pr-4">
                <CardHeader className="p-0 sm:p-1">
                  <CardTitle className="text-base sm:text-lg text-white">Attacker Team</CardTitle>
                </CardHeader>
                <Button size="sm" variant="outline" onClick={() => setIsTeamModalOpen(true)} className="bg-white/10 text-white hover:bg-white/20 border-gray-600">
                  Select
                </Button>
              </div>
              <CardContent className="p-2 sm:p-4">
                <ScrollArea className="overflow-y-auto max-h-[30vh] lg:max-h-[60vh]">
                  <div className="flex flex-col gap-2">
                    {attackers.length === 0 ? (
                      <div className="text-center py-6 text-white/70 italic">No agents selected</div>
                    ) : (
                      attackers.map((agent) => (
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
                              {agent.role.displayName}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className="h-full w-full flex flex-1 flex-col bg-black/40 backdrop-blur-md border border-gray-800 shadow-lg lg:w-[calc(100%-520px)] xl:w-[calc(100%-620px)]">
              
              <ScrollArea className="p-2 sm:p-4 h-[60vh] sm:h-[65vh] md:h-[70vh] overflow-y-auto">
                <div className="space-y-3 sm:space-y-4">

                  {chatMessages.length === 0 && !isLoadingChat && (
                    <div className="flex items-center justify-center h-full py-10">
                      <div className="flex flex-col gap-2 h-full items-center justify-center text-center text-white/70 p-8">
                        <img src="https://media1.giphy.com/media/HuIiWZekURnZzBMAXK/source.gif" alt="Valorant Jett sticker thinking about strategy" width={200} height={200} className="opacity-50 hover:opacity-100 transition-all duration-300"/>
                        <h3 className="text-lg font-semibold mb-2">Ready for your strategy</h3>
                        <p className="text-sm max-w-md">{attackers.length === 0 && defenders.length === 0 && !map ? 'Select your team and map to get started.' : 'Great! Now ask for strategy advice below.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Chat messages (including tool calls) */}
                  {chatMessages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        message.role === "user" ? "items-end" : "items-start"
                      }`}
                    >

                      {/* Message container */}
                      <div
                        className={`p-2 sm:p-4 rounded-lg max-w-[95%] sm:max-w-[85%] md:max-w-[75%] text-sm animate-fadeIn ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.role === "error"
                            ? "bg-destructive text-destructive-foreground"
                            : message.role === "tool_call" && message.phase === "start"
                            ? "bg-blue-300 text-blue-800 text-xs font-mono"
                            : message.role === "tool_call" && message.phase === "end"
                            ? "bg-green-300 text-green-800 text-xs font-mono"
                            : message.role === "tool_call"
                            ? "bg-muted text-muted-foreground text-xs italic"
                            : "bg-primary"
                        }`}
                      >

                        {/* Message content */}
                        {!message.function_call && !message.tool_info && (
                          <div className="text-sm prose prose-sm prose-invert">
                            <Markdown>{message.content}</Markdown>
                          </div>
                        )}

                        {/* Agent Redux toolkit store status [TODO - AFTER DEMO W/HEBER] */}
                        {agentStatus && (
                          <div className="mt-2 text-xs bg-background text-background-foreground p-2 rounded">
                            <p>{agentStatus}</p>
                          </div>
                        )}

                        {/* Function call [DEPRECATED - TO BE REMOVED] */}
                        {message.function_call && (
                          <div className="mt-2 text-xs bg-background text-background-foreground p-2 rounded">
                            <p>Function: {message.function_call.name}</p>
                            <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                              {JSON.stringify(message.function_call.arguments, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Message Tool Info */}
                        {message.tool_info && (
                          <div className="text-xs">
                            <Markdown>{message.content}</Markdown>
                          </div>
                        )}

                        {/* PRE - Tool info */}
                        {message.tool_info && (
                          <div className="mt-2 text-xs bg-black/50 text-white p-2 rounded-md">
                            <p>Tool: {message.tool_info.name}</p>
                            {message.phase === "start" && (
                              <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                                {JSON.stringify(message.tool_info.arguments, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  ))}

                  {isLoadingChat && (
                    <div className="flex items-start">
                      <div className="p-3 rounded-lg bg-white/90 text-gray-900 max-w-[80%] flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating strategy...</span>
                      </div>
                    </div>
                  )}

                </div>
              </ScrollArea>

              {/* Chat input */}
              <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-gray-700 flex gap-2 mt-auto">
                <Input
                  placeholder="Type your strat here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-white/10 border-gray-700 placeholder:text-white/50 text-white"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="sm:size-default bg-white/90 text-black hover:bg-white"
                  disabled={isLoadingChat || (!map && attackers.length === 0 && defenders.length === 0)}
                >
                  Send
                </Button>
              </form>
            </Card>

            {/* MOBILE: Right Sidebar - Defender Team */}
            <div className="lg:hidden">
              <Sheet open={openDefenders} onOpenChange={setOpenDefenders}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full bg-black/50 backdrop-blur-md border border-gray-700 text-white">
                    <Users className="mr-2 h-4 w-4" />
                    Defenders ({defenders.length}/5)
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-black/90 backdrop-blur-md border-gray-800 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-white">Defender Team</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <Button size="sm" variant="outline" onClick={() => {
                      setIsTeamModalOpen(true);
                      setOpenDefenders(false);
                    }} className="bg-white/10 text-white hover:bg-white/20 border-gray-600 mb-4">
                      Select Team
                    </Button>
                    <ScrollArea className="h-[70vh]">
                      <div className="flex flex-col gap-2">
                        {defenders.length === 0 ? (
                          <div className="text-center py-6 text-white/70 italic">No agents selected</div>
                        ) : (
                          defenders.map((agent) => (
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
            </div>

            {/* DESKTOP: Right Sidebar - Defender Team */}
            <Card className="hidden lg:block lg:max-w-[250px] xl:max-w-[300px] w-full lg:shrink-0 bg-black/40 backdrop-blur-md border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="border-b border-gray-700 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 pr-2 sm:pr-4">
                <CardHeader className="p-0 sm:p-1">
                  <CardTitle className="text-base sm:text-lg text-white">Defender Team</CardTitle>
                </CardHeader>
                <Button size="sm" variant="outline" onClick={() => setIsTeamModalOpen(true)} className="bg-white/10 text-white hover:bg-white/20 border-gray-600">
                  Select
                </Button>
              </div>

              <CardContent className="p-2 sm:p-4">
                <ScrollArea className="overflow-y-auto max-h-[30vh] lg:max-h-[60vh]">
                  <div className="flex flex-col gap-2">
                    {defenders.length === 0 ? (
                      <div className="text-center py-6 text-white/70 italic">No agents selected</div>
                    ) : (
                      defenders.map((agent) => (
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