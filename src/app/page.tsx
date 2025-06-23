"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  useCallback,
} from "react";
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

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function ChatBotUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_KEY = "AIzaSyDeADG2d12B0IZlgDvE5NyXFVPhjkdS698"; // ⚠️ Replace in production
  const MODEL = "gemini-2.0-flash-lite";
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  // Load PDF.js script dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      if (!window.pdfjsLib) {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        };
        document.body.appendChild(script);
      }
    };
    loadPdfJs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildGeminiHistory = () => {
    const history = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    if (input.trim()) {
      let fullPrompt = input;
      if (pdfContent) {
        fullPrompt = `Answer this based on the PDF content:\n\n${pdfContent}\n\nQuestion: ${input}`;
      }

      history.push({
        role: "user",
        parts: [{ text: fullPrompt }],
      });
    }

    return history;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: buildGeminiHistory(),
          generationConfig: { responseMimeType: "text/plain" },
        }),
      });

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "❌ AI failed to respond.";

      const botMessage: Message = {
        id: Date.now() + 1,
        text,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "❌ Error contacting AI.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const parsePdfFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      text += `Page ${i}: ${pageText}\n\n`;
    }

    console.log("📄 Parsed PDF content:\n", text);
    setPdfContent(text);
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) {
      alert("Only PDF files are supported!");
      return;
    }

    const userFileMessage: Message = {
      id: Date.now(),
      text: `📎 Uploaded PDF: ${file.name}`,
      sender: "user",
      isFile: true,
      fileName: file.name,
    };

    setMessages((prev) => [...prev, userFileMessage]);

    try {
      await parsePdfFile(file);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: `🤖 PDF '${file.name}' processed. You can now ask questions related to it.`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "❌ Failed to parse the PDF.",
          sender: "bot",
        },
      ]);
    }

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
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-sm p-3 rounded-xl text-sm bg-secondary text-secondary-foreground animate-pulse">
                      🤖 Typing...
                    </div>
                  </div>
                )}
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

          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Upload PDF"
          >
            <Upload className="w-5 h-5" />
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
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
