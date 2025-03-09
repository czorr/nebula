import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatInput({ onSendMessage, isLoadingChat, isDisabled }) {
  const [input, setInput] = useState("");

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 sm:p-4 border-t border-gray-700 flex gap-2 mt-auto">
      <Input
        placeholder="Type your strat here..."
        value={input}
        onChange={handleInputChange}
        className="flex-1 bg-white/10 border-gray-700 placeholder:text-white/50 text-white"
      />
      <Button 
        type="submit" 
        size="sm" 
        className="sm:size-default bg-white/90 text-black hover:bg-white"
        disabled={isLoadingChat || isDisabled}
      >
        Send
      </Button>
    </form>
  );
} 