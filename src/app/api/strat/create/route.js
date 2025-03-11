import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { observeOpenAI, Langfuse } from 'langfuse';
import { getAgentsTool, suggestPlacementsTool, getCalloutsTool, finishTaskTool } from '../../../../lib/agents/tools';
import { getStratPrompt } from '../../../../lib/agents/prompts';
import { v4 as uuidv4 } from 'uuid';

// Initialize Langfuse
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL
});

// OpenAI instance
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {

  // Trace for the entire session
  const sessionId = uuidv4();

  const trace = langfuse.trace({
    name: "stratSession",
    sessionId: sessionId,
  });

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
      return `${map.displayName}: ${map.tacticalDescription} Callouts: [${map.callouts.map(callout => `${callout.regionName}: ${callout.superRegionName} [Location: ${callout.location}]`).join(', ')}]`;
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

    //! Prepare the messages
    const messages = [
      {
        role: "system",
        content: getStratPrompt(contextInfo) // Get the prompt with the context
      },
      ...filteredMessageHistory,
      {
        role: "user",
        content: prompt,
      },
    ];

    const openai = observeOpenAI(openaiClient, { traceId: trace.id });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: [getAgentsTool, suggestPlacementsTool, getCalloutsTool, finishTaskTool],
      tool_choice: "auto",
    });

    // Extract the model message
    let assistantMessage = response.choices[0].message;

    // Check if the model wants to use a tool
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      let currentMessages = [...messages, assistantMessage];
      let finalAssistantMessage = null;
      let allToolCalls = [...assistantMessage.tool_calls];
      
      //!! AGENT LOOP
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
          dispatch(setAgentStatus("Task completed successfully."));
          break;
        }

        // Add tool results to the conv
        currentMessages = [...currentMessages, ...toolResults];

        // Call the model
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: currentMessages,
          tools: [getAgentsTool, suggestPlacementsTool, getCalloutsTool, finishTaskTool],
          tool_choice: "auto",
        });

        // Update assistant message
        assistantMessage = response.choices[0].message;
        
        // If no more tool calls, or if reached max iterations, break the loop
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          finalAssistantMessage = assistantMessage;
          break;
        } else {
          // Add this assistant message to the conversation
          currentMessages.push(assistantMessage);
          
          // Track all tool calls for the response
          allToolCalls = [...allToolCalls, ...assistantMessage.tool_calls];
        }

      }

      //! OUT OF LOOP
      // Create final response based on the conversation
      const finalMessage = finalAssistantMessage || {
        role: "assistant",
        content: "I've analyzed your request using the available tools. Here's my strategy..."
      };

      // Return the final response with all tool calls
      return NextResponse.json({
        message: finalMessage,
        toolCalls: allToolCalls.map((tool, index) => {
          // Only include tools that were used before the finalization
          if (tool.function && tool.function.name !== "finishTask") {
            return {
              name: tool.function.name,
              arguments: JSON.parse(tool.function.arguments),
              phase: "contributing", // Indicates that this tool contributed to the response
              order: index
            };
          } else if (tool.function && tool.function.name === "finishTask") {
            return {
              name: "finishTask",
              arguments: { finalAnswer: "Task completed with all necessary information" },
              phase: "final", // Indicates that this is the final tool
              order: index
            };
          } else {
            return null; // Filter out null tools after
          }
        }).filter(Boolean), // Remove null values
      });
    }

    // If no tool was called...
    return NextResponse.json({
      message: assistantMessage,
    });
    
  } catch (error) {
    console.error('Error during OpenAI request:', error);

    // Mark the trace as failed in case of error
    trace.update({ status: "error", statusMessage: error.message });
    
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
