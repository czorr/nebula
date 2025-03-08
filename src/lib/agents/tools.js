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

// Tool for finishing the task and providing a final answer
const finishTaskTool = {
  type: "function",
  function: {
    name: "finishTask",
    description: "Call this function when you have all the information you need and want to provide a final answer",
    parameters: {
      type: "object",
      properties: {
        finalAnswer: {
          type: "string",
          description: "Your final comprehensive answer or strategy"
        }
      },
      required: ["finalAnswer"]
    }
  }
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

export { getAgentsTool, getMapsTool, getCalloutsTool, finishTaskTool, suggestPlacementsTool };