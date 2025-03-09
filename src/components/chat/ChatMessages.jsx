import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from 'react-markdown';
import { Loader2 } from "lucide-react";

export default function ChatMessages({ messages, isLoading, agentStatus, attackers, defenders, map }) {
  return (
    <ScrollArea className="p-2 sm:p-4 h-[60vh] sm:h-[65vh] md:h-[70vh] overflow-y-auto">
      <div className="space-y-3 sm:space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full py-10">
            <div className="flex flex-col gap-2 h-full items-center justify-center text-center text-white/70 p-8">
              <img src="https://media1.giphy.com/media/HuIiWZekURnZzBMAXK/source.gif" alt="Valorant Jett sticker thinking about strategy" width={200} height={200} className="opacity-50 hover:opacity-100 transition-all duration-300"/>
              <h3 className="text-lg font-semibold mb-2">Ready for your strategy</h3>
              <p className="text-sm max-w-md">{attackers.length === 0 && defenders.length === 0 && !map ? 'Select your team and map to get started.' : 'Great! Now ask for strategy advice below.'}</p>
            </div>
          </div>
        )}

        {/* Chat messages (including tool calls) */}
        {messages.map((message, i) => (
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

              {/* Agent Redux toolkit store status */}
              {agentStatus && (
                <div className="mt-2 text-xs bg-background text-background-foreground p-2 rounded">
                  <p>{agentStatus}</p>
                </div>
              )}

              {/* Function call [DEPRECATED] */}
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

        {isLoading && (
          <div className="flex items-start">
            <div className="p-3 rounded-lg bg-white/90 text-gray-900 max-w-[80%] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating strategy...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
} 