"use client";

import { useState, useEffect, useCallback } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "@/app/redux/store";
import { Card } from "@/components/ui/card";
import TeamSelectionModal from "@/components/modals/TeamSelection";
import MapSelectionModal from "@/components/modals/MapSelection";
import { resetMap } from "@/app/redux/features/maps";
import { addMessage, setLoading, setError } from './redux/features/chat.js';

// Componentes refactorizados
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";
import TeamCard from "@/components/teams/TeamCard";
import MobileTeamSheet from "@/components/teams/MobileTeamSheet";
import MapSelector from "@/components/maps/MapSelector";

function StratsContent() {
  const dispatch = useDispatch(); 
  const [agents, setAgents] = useState([]); 
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { attackers, defenders } = useSelector((state) => state.teams);
  const [maps, setMaps] = useState([]);
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);
  const { map } = useSelector((state) => state.maps);
  const chatMessages = useSelector(state => state.chat.messages);
  const isLoadingChat = useSelector(state => state.chat.isLoading);
  const agentStatus = useSelector(state => state.agentStatus.agentStatus);
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
  const handleSendMessage = useCallback(async (inputText) => {
    if (!inputText.trim()) return;

    const newMessage = {
      role: "user",
      content: inputText,
    };

    dispatch(addMessage(newMessage));
    dispatch(setLoading(true));

    try {
      const response = await fetch("/api/strat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputText,
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
  }, [attackers, defenders, map, chatMessages, dispatch]);

  const handleMapReset = useCallback(() => {
    dispatch(resetMap());
  }, [dispatch]);

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
          <MapSelector 
            map={map} 
            onSelectMap={() => setIsMapModalOpen(true)} 
            onResetMap={handleMapReset} 
          />

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row w-full gap-2 sm:gap-4">

            {/* MOBILE: Left Sidebar - Attacker Team */}
            <div className="lg:hidden">
              <MobileTeamSheet 
                title="Attacker Team"
                agents={attackers}
                isOpen={openAttackers}
                onOpenChange={setOpenAttackers}
                onSelectTeam={() => setIsTeamModalOpen(true)}
                side="left"
              />
            </div>

            {/* DESKTOP: Left Sidebar - Attacker Team */}
            <TeamCard 
              title="Attacker Team" 
              agents={attackers} 
              onSelectTeam={() => setIsTeamModalOpen(true)}
            />

            {/* Main Chat Area */}
            <Card className="h-full w-full flex flex-1 flex-col bg-black/40 backdrop-blur-md border border-gray-800 shadow-lg lg:w-[calc(100%-520px)] xl:w-[calc(100%-620px)]">
              
              <ChatMessages 
                messages={chatMessages}
                isLoading={isLoadingChat}
                agentStatus={agentStatus}
                attackers={attackers}
                defenders={defenders}
                map={map}
              />

              {/* Chat input */}
              <ChatInput 
                onSendMessage={handleSendMessage}
                isLoadingChat={isLoadingChat}
                isDisabled={!map && attackers.length === 0 && defenders.length === 0}
              />
            </Card>

            {/* MOBILE: Right Sidebar - Defender Team */}
            <div className="lg:hidden">
              <MobileTeamSheet 
                title="Defender Team"
                agents={defenders}
                isOpen={openDefenders}
                onOpenChange={setOpenDefenders}
                onSelectTeam={() => setIsTeamModalOpen(true)}
                side="right"
              />
            </div>

            {/* DESKTOP: Right Sidebar - Defender Team */}
            <TeamCard 
              title="Defender Team" 
              agents={defenders} 
              onSelectTeam={() => setIsTeamModalOpen(true)}
            />
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