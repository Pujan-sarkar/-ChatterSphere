"use client";

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Upload } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  isFile?: boolean;
  fileName?: string;
}

export default function ChatBotUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        text: `🤖 Dummy AI: I received your message — '${userMessage.text}'`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userFileMessage: Message = {
      id: Date.now(),
      text: `📎 File uploaded: ${file.name}`,
      sender: "user",
      isFile: true,
      fileName: file.name,
    };

    setMessages((prev) => [...prev, userFileMessage]);

    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        text: `🤖 Dummy AI: Thanks for uploading '${file.name}'!`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);

    // Reset file input so the same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-screen w-full bg-muted text-muted-foreground">
      <header className="bg-background shadow p-4 text-left text-xl font-bold pl-6">
        🤖 ChatterSphere
      </header>
      <main className="flex flex-col flex-1 p-4">
        <Card className="flex flex-col flex-1">
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-sm p-3 rounded-xl text-sm ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* File upload button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Upload file"
          >
            <Upload className="w-5 h-5" />
          </Button>

          {/* Send message button */}
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="-mb-1"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}
