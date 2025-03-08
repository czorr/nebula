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
import { addMessage, setLoading, setError } from './redux/features/chat.js';
import { Loader2 } from "lucide-react";
import { marked } from 'marked';

function StratsContent() {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [agents, setAgents] = useState([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { attackers, defenders } = useSelector((state) => state.teams);
  const [maps, setMaps] = useState([]);
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);
  const { map } = useSelector((state) => state.maps);
  const chatMessages = useSelector(state => state.chat.messages);
  const isLoadingChat = useSelector(state => state.chat.isLoading);
  
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
      
      // Add the AI response to messages
      dispatch(addMessage(data.message));
      
      // If there were tool calls, add them as messages to show the AI's thought process
      if (data.toolCalls) {
        data.toolCalls.forEach(tool => {
          // Solo mostrar herramientas que contribuyeron a la respuesta final o la herramienta final
          if (tool.phase === "contributing" || tool.phase === "final") {
            // No mostrar la herramienta finishTask
            if (tool.name !== "finishTask") {
              // Primero añadimos un mensaje de inicio (generado localmente)
              dispatch(addMessage({
                role: "tool_call",
                content: `🔍 Using ${tool.name} with parameters: ${JSON.stringify(tool.arguments)}`,
                tool_info: {
                  name: tool.name,
                  arguments: tool.arguments
                },
                phase: "start"
              }));
              
              // Luego añadimos un mensaje de finalización (generado localmente)
              dispatch(addMessage({
                role: "tool_call",
                content: `✓ Completed ${tool.name} operation`,
                tool_info: {
                  name: tool.name,
                  arguments: tool.arguments
                },
                phase: "end"
              }));
            }
          }
        });
      }

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

      <main className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-4 gap-4 flex flex-col max-w-[90vw] mx-auto w-full">

          {/* Map Selection Topbar */}
          <Card 
            className="flex justify-between items-center p-6 w-full border border-gray-200 relative overflow-hidden"
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

            {/* Dark overlay */}
            {map && (
              <div className="absolute inset-0 bg-black/30 z-0" />
            )}
          </Card>

          <div className="flex w-full gap-4">

            {/* Left Sidebar - Attacker Team */}
            <Card className="h-[700px] w-[350px] shrink-0">
              <div className="border-b flex justify-between items-center px-6 py-4 pr-4">
                <CardHeader>
                  <CardTitle>Attacker Team</CardTitle>
                </CardHeader>
                <Button variant="outline" onClick={() => setIsTeamModalOpen(true)}>
                  Select Team
                </Button>
              </div>
              <CardContent>
                <ScrollArea className="p-4 h-[500px] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {attackers.map((agent) => (
                      <div key={agent.uuid} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200" style={{ background: `${agent.backgroundGradientColors ? `linear-gradient(to right, ${agent.backgroundGradientColors[0]}, ${agent.backgroundGradientColors[1]})` : 'none'}` }}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                          <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{agent.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {agent.role.displayName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className="h-[700px] w-full">
              
              <ScrollArea className="p-4 h-[650px] overflow-y-auto">
                <div className="space-y-4">

                  {chatMessages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        message.role === "user" ? "items-end" : "items-start"
                      }`}
                    >

                      {/* Message container */}
                      <div
                        className={`p-3 rounded-lg max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.role === "error"
                            ? "bg-destructive text-destructive-foreground"
                            : message.role === "tool_call" && message.phase === "start"
                            ? "bg-blue-100 text-blue-800 text-xs font-mono"
                            : message.role === "tool_call" && message.phase === "end"
                            ? "bg-green-100 text-green-800 text-xs font-mono"
                            : message.role === "tool_call"
                            ? "bg-muted text-muted-foreground text-xs italic"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >

                        {/* Message content */}
                        {!message.function_call && (
                          <div className={`${message.role === "user" ? "prose-invert" : "prose"}`}>
                            {message.content}
                          </div>
                        )}

                        {/* Function call */}
                        {message.function_call && (
                          <div className="mt-2 text-xs bg-background text-background-foreground p-2 rounded">
                            <p>Function: {message.function_call.name}</p>
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(message.function_call.arguments, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Tool info */}
                        {message.tool_info && (
                          <div className="mt-2 text-xs bg-background text-background-foreground p-2 rounded">
                            <p>Tool: {message.tool_info.name}</p>
                            {message.phase === "start" && (
                              <pre className="whitespace-pre-wrap">
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
                      <div className="p-3 rounded-lg bg-muted text-muted-foreground max-w-[80%]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}

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
            <Card className="h-[700px] w-[350px] shrink-0">
              <div className="border-b flex justify-between items-center px-6 py-4 pr-4">
                <CardHeader>
                  <CardTitle>Defender Team</CardTitle>
                </CardHeader>
                <Button variant="outline" onClick={() => setIsTeamModalOpen(true)}>
                  Select Team
                </Button>
              </div>

              <CardContent>
                <ScrollArea className="p-4 h-[500px] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {defenders.map((agent) => (
                      <div key={agent.uuid} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.displayIcon} alt={agent.displayName} />
                          <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{agent.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {agent?.role?.displayName}
                          </span>
                        </div>
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