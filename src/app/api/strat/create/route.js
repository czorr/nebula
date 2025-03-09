import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAgentsTool, getMapsTool, suggestPlacementsTool, getCalloutsTool, finishTaskTool } from '@/lib/agents/tools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {

  try {
    const body = await request.json();
    const { prompt, attackers, defenders, selectedMap, messageHistory = [] } = body;

    // Filter message history to only include valid OpenAI roles
    const validRoles = ['system', 'assistant', 'user', 'function', 'tool', 'developer'];
    const filteredMessageHistory = messageHistory.filter(message => validRoles.includes(message.role));

    // Cleaning context
    let contextInfo = '';
    
    // Map maps info (display name, description, callouts)
    const mapMapsInfo = (map) => {
      return `${map.displayName}: ${map.description} Callouts: [${map.callouts.map(callout => `${callout.displayName}: ${callout.description}`).join(', ')}]`;
    }

    // Map agents info (display name, role, description, abilities)
    const mapAgentsInfo = (agents) => {
      return agents.map(agent => `${agent.displayName} (${agent.role.displayName}): Abilities: [${agent.abilities.map(ability => `${ability.displayName}: ${ability.description}`).join(', ')}]`).join('\n');
    }
    
    if (selectedMap) {
      contextInfo += `Current Map ID: ${selectedMap.uuid}\n`;
      contextInfo += `Map Info: ${mapMapsInfo(selectedMap)}\n`;
    }
    
    if (attackers && attackers.length > 0) {
      contextInfo += `Attacking Team: ${mapAgentsInfo(attackers)}\n`;
    }
    
    if (defenders && defenders.length > 0) {
      contextInfo += `Defending Team: ${mapAgentsInfo(defenders)}\n`;
    }

    console.log(contextInfo);

    // Prepare the messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are a Valorant strategy expert who helps players create and optimize game plans. 
        You can use tools to access agent information, map details, and suggest optimal placements.
        Always think step by step and explain your reasoning. Be specific about agent abilities and map callouts.
        You can use the tools to get information about agents and maps.
        You can use the tools to suggest optimal placements for the attacking and defending team.
        The attacking team is the team that is trying to plant the spike and the defending team is the team that is trying to prevent them from doing so.
        Your goal is to give the macro strategy for the attacking and defending team.
        And select the best agents for counter-strategies of the opposing team.
        The selection of agents can create micro strategies based on their abilities sinergy.
        DONT GIVE CONCEPTUAL INSTRUCTIONS LIKE "IDENTIFY WEAK POINTS" OR "CARE OF ABILITIES" YOU NEED TO BE SPECIFIC AND CONCRETE BUT EXTENSIVE.
        
        ${contextInfo}`
      },
      ...filteredMessageHistory,
      {
        role: "user",
        content: prompt,
      },
    ];

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: [getAgentsTool, getMapsTool, suggestPlacementsTool, getCalloutsTool, finishTaskTool],
      tool_choice: "auto",
    });

    // Extract the model message
    let assistantMessage = response.choices[0].message;

    // Check if the model wants to use a tool
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      let currentMessages = [...messages, assistantMessage];
      let finalAssistantMessage = null;
      let allToolCalls = [...assistantMessage.tool_calls];
      
      // Loop until the model doesn't request any more tools or reaches maximum iterations
      const MAX_ITERATIONS = parseInt(process.env.MAX_ITERATIONS || 10);
      let iterations = 0;
      
      while (iterations < MAX_ITERATIONS) {
        iterations++;
        const toolCalls = assistantMessage.tool_calls;
        const toolResults = [];

        // Process each tool call
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          if (functionName === "getAgents") {
            // Fetch agents data
            const agentsResponse = await fetch(new URL("/api/agents", request.url));
            const agentsData = await agentsResponse.json();
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "getAgents",
              content: JSON.stringify(agentsData),
            });
          } 
          else if (functionName === "getMaps") {
            // Fetch maps data
            const mapsResponse = await fetch(new URL("/api/maps", request.url));
            const mapsData = await mapsResponse.json();
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "getMaps",
              content: JSON.stringify(mapsData),
            });
          } 
          else if (functionName === "suggestPlacements") {
            // Generate placement suggestions based on map and agents
            const { mapName, agentNames, side } = functionArgs;
            
            // This would typically involve more complex logic
            // For now, we'll return a simple suggestion
            const placementSuggestions = {
              map: mapName,
              placements: agentNames.map(agent => ({
                agent,
                position: `${side === "attackers" ? "Entry" : "Site"} position`,
                role: "Suggested role based on agent abilities"
              }))
            };
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "suggestPlacements",
              content: JSON.stringify(placementSuggestions),
            });
          }
          else if (functionName === "getCallouts") {
            // Fetch callouts data
            const calloutsResponse = await fetch(new URL("/api/callouts", request.url));
            const calloutsData = await calloutsResponse.json();
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "getCallouts",
              content: JSON.stringify(calloutsData),
            });
          }
          else if (functionName === "finishTask") {
            // The model has explicitly decided its done
            finalAssistantMessage = {
              role: "assistant",
              content: functionArgs.finalAnswer || "Task completed successfully."
            };
            break;
          }
          
        }

        // If the model explicitly finished, break the loop
        if (finalAssistantMessage) {
          break;
        }

        // Add tool results to the conv
        currentMessages = [...currentMessages, ...toolResults];

        // Call model again to see if it needs more tools
        //! 4o-mini
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: currentMessages,
          tools: [getAgentsTool, getMapsTool, suggestPlacementsTool, getCalloutsTool, finishTaskTool],
          tool_choice: "auto",
        });

        // Update assistant message
        assistantMessage = response.choices[0].message;
        
        // If no more tool calls, or if reached max iterations, break the loop
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          finalAssistantMessage = assistantMessage;
          break;
        }
        
        // Add this assistant message to the conversation
        currentMessages.push(assistantMessage);
        
        // Track all tool calls for the response
        allToolCalls = [...allToolCalls, ...assistantMessage.tool_calls];
      }

      // Create final response based on the conversation
      const finalMessage = finalAssistantMessage || {
        role: "assistant",
        content: "I've analyzed your request using the available tools. Here's my strategy..."
      };

      // Return the final response with all tool calls
      return NextResponse.json({
        message: finalMessage,
        toolCalls: allToolCalls.map((tool, index) => {
          // Solo incluir herramientas que fueron usadas antes de la finalización
          if (tool.function && tool.function.name !== "finishTask") {
            return {
              name: tool.function.name,
              arguments: JSON.parse(tool.function.arguments),
              phase: "contributing", // Indica que esta herramienta contribuyó a la respuesta
              order: index // Añadir índice para mantener el orden
            };
          } else if (tool.function && tool.function.name === "finishTask") {
            return {
              name: "finishTask",
              arguments: { finalAnswer: "Task completed with all necessary information" },
              phase: "final", // Indica que esta es la herramienta final
              order: index
            };
          } else {
            return null; // Filtrar herramientas nulas después
          }
        }).filter(Boolean), // Eliminar valores nulos
      });
    }

    // If no tool was called, return the message
    return NextResponse.json({
      message: assistantMessage,
    });
    
  } catch (error) {
    console.error('Error during OpenAI request:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
