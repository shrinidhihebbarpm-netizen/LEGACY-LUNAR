import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, ExternalLink, Compass, Sparkles } from 'lucide-react';
import {
  ARTIFACTS,
  DESTINATIONS,
  buildLocalExplorerGuideAnswer,
  type DestinationId,
} from '../data/spaceData';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  sources?: { title: string; url: string }[];
  relatedArtifacts?: string[];
  isRefusal?: boolean;
}

interface ExplorerGuideChatProps {
  selectedDestinationId: DestinationId;
  selectedArtifactId?: string;
  onSelectArtifact: (artifactId: string) => void;
}

const STARTER_QUESTIONS = [
  'What did Opportunity discover on Mars?',
  'Why did Apollo leave equipment on the Moon?',
  'Where are the Voyager spacecraft now?',
  'What is a descent stage?',
  'Which Mars missions are still active?',
];

export const ExplorerGuideChat: React.FC<ExplorerGuideChatProps> = ({
  selectedDestinationId,
  selectedArtifactId,
  onSelectArtifact,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome aboard! I am your Explorer Guide. Ask me about any NASA rover, lander, descent stage, deep-space probe, or planet featured in this solar-system experience.',
      sources: [
        {
          title: 'NASA Science Solar System Exploration',
          url: 'https://science.nasa.gov/solar-system/',
        },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const currentDest = DESTINATIONS.find((d) => d.id === selectedDestinationId);
  const currentArtifact = selectedArtifactId
    ? ARTIFACTS.find((a) => a.id === selectedArtifactId)
    : undefined;

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/explorer-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          destinationId: selectedDestinationId,
          artifactId: selectedArtifactId,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          sources: data.sources || [],
          relatedArtifacts: data.relatedArtifacts || [],
          isRefusal: Boolean(data.isRefusal),
        },
      ]);
    } catch {
      const fallback = buildLocalExplorerGuideAnswer(trimmed, {
        destinationId: selectedDestinationId,
        artifactId: selectedArtifactId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: fallback.reply,
          sources: fallback.sources,
          relatedArtifacts: fallback.relatedArtifacts,
          isRefusal: fallback.isRefusal,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Panel styled in NASA Eyes #1D1D20 / #252527 palette */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Explorer Guide Space Science Assistant"
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[78vh] bg-[#1D1D20] border border-[#95959D]/30 rounded shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#000000] border-b border-[#95959D]/20">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-[#4ADE80] shrink-0" />
              <div>
                <h2 className="text-sm font-medium text-[#FFFFFF] leading-tight">
                  Explorer Guide
                </h2>
                <p className="text-[11px] text-[#C6C6C9] truncate max-w-[230px]">
                  Context: {currentArtifact ? currentArtifact.name : currentDest?.name || 'Solar System'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize Explorer Guide"
              className="p-1.5 text-[#C6C6C9] hover:text-[#FFFFFF] hover:bg-[#252527] rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 max-h-80 bg-[#1D1D20]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#FFFFFF] text-[#000000] font-medium'
                      : msg.isRefusal
                      ? 'bg-[#252527] border border-[#B5945B]/60 text-[#EAEAEB]'
                      : 'bg-[#252527] border border-[#95959D]/20 text-[#EAEAEB]'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Official NASA Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#95959D]/20 space-y-1">
                      <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#B5945B]">
                        Verified NASA Source
                      </div>
                      {msg.sources.map((src) => (
                        <a
                          key={src.url}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-[#4ADE80] hover:text-[#FFFFFF] underline underline-offset-2"
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Related Artifacts */}
                  {msg.relatedArtifacts && msg.relatedArtifacts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#95959D]/20">
                      <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#B5945B] mb-1">
                        Explore Related Hardware
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.relatedArtifacts.map((artId) => {
                          const art = ARTIFACTS.find((a) => a.id === artId);
                          if (!art) return null;
                          return (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => onSelectArtifact(art.id)}
                              className="px-2 py-1 text-[11px] bg-[#1D1D20] hover:bg-[#323236] text-[#FFFFFF] border border-[#95959D]/25 rounded transition-colors cursor-pointer text-left"
                            >
                              {art.name.split(' (')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="text-xs text-[#C6C6C9] font-mono px-2 py-1">
                Consulting NASA mission archives...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Questions */}
          <div className="px-3.5 py-2 bg-[#000000] border-t border-[#95959D]/20">
            <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#B5945B] mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#4ADE80]" />
              <span>Starter Mission Questions</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="px-2.5 py-1 text-[11px] bg-[#252527] hover:bg-[#323236] text-[#EAEAEB] border border-[#95959D]/20 rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-3 bg-[#000000] border-t border-[#95959D]/20"
          >
            <label htmlFor="explorer-guide-input" className="sr-only">
              Ask Explorer Guide about NASA missions and hardware
            </label>
            <input
              id="explorer-guide-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rovers, missions, or planets..."
              className="flex-1 bg-[#252527] border border-[#95959D]/30 rounded px-3 py-2 text-xs text-[#FFFFFF] placeholder:text-[#C6C6C9]/60 focus:outline-none focus:border-[#FFFFFF]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send question to Explorer Guide"
              className="px-3 py-2 bg-[#FFFFFF] hover:bg-[#EAEAEB] disabled:opacity-40 text-[#000000] font-semibold rounded text-xs transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Explorer Guide"
        className="flex items-center gap-2.5 px-4 py-3 rounded bg-[#252527] hover:bg-[#323236] text-[#FFFFFF] border border-[#95959D]/35 font-medium text-sm shadow-2xl transition-transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#4ADE80]" aria-hidden="true" />
        <MessageSquare className="w-4 h-4 shrink-0 text-[#EAEAEB]" />
        <span>Explorer Guide</span>
      </button>
    </div>
  );
};
