import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tool for getting agents data
const getAgentsTool = {
  type: "function",
  function: {
    name: "getAgents",
    description: "Get information about Valorant agents",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};

// Tool for getting maps data
const getMapsTool = {
  type: "function",
  function: {
    name: "getMaps",
    description: "Get information about Valorant maps",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};

// Tool for getting map callouts
const getCalloutsTool = {
  type: "function",
  function: {
    name: "getCallouts",
    description: "Get information about Valorant map callouts",
    parameters: {
      type: "object",
      properties: {
        mapId: {
          type: "string",
          description: "The ID of the map",
        },
      },
      required: ["mapId"],
    },
  },
};

// Tool for suggesting agent placements on a map
const suggestPlacementsTool = {
  type: "function",
  function: {
    name: "suggestPlacements",
    description: "Suggest optimal agent placements on a specific map",
    parameters: {
      type: "object",
      properties: {
        mapName: {
          type: "string",
          description: "The name of the map",
        },
        agentNames: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of agent names to place",
        },
        side: {
          type: "string",
          enum: ["attackers", "defenders"],
          description: "Which side the team is playing on",
        },
      },
      required: ["mapName", "agentNames", "side"],
    },
  },
};

export async function POST(request) {

  try {
    const body = await request.json();
    const { prompt, attackers, defenders, selectedMap, messageHistory = [] } = body;

    // Filter message history to only include valid OpenAI roles
    const validRoles = ['system', 'assistant', 'user', 'function', 'tool', 'developer'];
    const filteredMessageHistory = messageHistory.filter(message => validRoles.includes(message.role));

    // Prepare context information based on provided data
    let contextInfo = '';

    // Map agents info)
    const mapAgentsInfo = (agents) => {
      return agents.map(agent => `${agent.displayName} (${agent.role.displayName}): ${agent.description} Abilities: [${agent.abilities.map(ability => `${ability.displayName}: ${ability.description}`).join(', ')}]`).join('\n');
    }

    // Map maps info (display name, description, callouts)
    const mapMapsInfo = (map) => {
      return `${map.displayName}: ${map.description} Callouts: [${map.callouts.map(callout => `${callout.displayName}: ${callout.description}`).join(', ')}]`;
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
      tools: [getAgentsTool, getMapsTool, suggestPlacementsTool, getCalloutsTool],
      tool_choice: "auto",
    });

    // Extract the assistant's message from the response
    const assistantMessage = response.choices[0].message;

    // Check if the model wants to use a tool
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
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
      }

      // Second call to OpenAI with the tool results
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...messages,
          assistantMessage,
          ...toolResults,
        ],
      });

      // Return the final response
      return NextResponse.json({
        message: secondResponse.choices[0].message,
        toolCalls: toolCalls.map(tool => ({
          name: tool.function.name,
          arguments: JSON.parse(tool.function.arguments),
        })),
      });
    }

    // If no tool was called, return the direct message
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
