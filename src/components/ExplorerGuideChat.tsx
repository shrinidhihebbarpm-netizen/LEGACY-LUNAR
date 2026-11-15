import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  ExternalLink,
  Compass,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
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
  'Tell me about Saturn’s rings.',
  'What is the James Webb Space Telescope?',
  'How does the Hubble Telescope work?',
  'What is a black hole?',
  'How far is Mars from Earth?',
];

export const ExplorerGuideChat: React.FC<ExplorerGuideChatProps> = ({
  selectedDestinationId,
  selectedArtifactId,
  onSelectArtifact,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello, Explorer! I am Space Explorer AI. Ask me anything about planets, moons, stars, black holes, nebulae, space telescopes like Hubble and James Webb, or missions across the universe.',
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

    const historySnapshot = messages
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setErrorNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/explorer-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          destinationId: selectedDestinationId,
          artifactId: selectedArtifactId,
          history: historySnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data?.reply) {
        throw new Error('Invalid empty reply');
      }

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
      const lastUserTopic = [...historySnapshot]
        .reverse()
        .find((m) => m.role === 'user')?.text;
      const fallback = buildLocalExplorerGuideAnswer(trimmed, {
        destinationId: selectedDestinationId,
        artifactId: selectedArtifactId,
        lastTopicText: lastUserTopic,
      });
      setErrorNotice('Live AI service unreachable right now—answered using verified offline space knowledge.');
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
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end">
      {/* Space Explorer AI Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Space Explorer AI Chatbot"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[80vh] bg-[#12141B] border border-[#95959D]/35 rounded-md shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#07090F] border-b border-[#95959D]/25">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#1C2333] border border-[#4ADE80]/40 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-[#4ADE80]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[#FFFFFF] leading-tight tracking-wide">
                  Space Explorer AI
                </h2>
                <p className="text-[11px] text-[#C6C6C9] truncate max-w-[240px]">
                  Astronomy &amp; Missions · {currentArtifact ? currentArtifact.name : currentDest?.name || 'Universe'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize Space Explorer AI"
              className="p-1.5 text-[#C6C6C9] hover:text-[#FFFFFF] hover:bg-[#252527] rounded transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            data-testid="space-explorer-messages"
            className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[200px] max-h-80 bg-[#12141B]"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-md px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#FFFFFF] text-[#000000] font-medium'
                      : msg.isRefusal
                      ? 'bg-[#1D1F27] border border-[#B5945B]/65 text-[#EAEAEB]'
                      : 'bg-[#1C1F28] border border-[#95959D]/25 text-[#EAEAEB]'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Authoritative Space Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#95959D]/20 space-y-1">
                      <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#B5945B]">
                        Verified Astronomy Source
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
                              className="px-2 py-1 text-[11px] bg-[#12141B] hover:bg-[#2B3040] text-[#FFFFFF] border border-[#95959D]/25 rounded transition-colors cursor-pointer text-left"
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
              <div
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-2 text-xs text-[#C6C6C9] font-mono px-2.5 py-1.5 rounded bg-[#1C1F28] border border-[#95959D]/20"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4ADE80]" />
                <span>Consulting space &amp; mission archives...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorNotice && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 px-3.5 py-1.5 bg-[#2A1D12] border-t border-[#B5945B]/40 text-[11px] text-[#FDE68A]"
            >
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorNotice}</span>
              </span>
              <button
                type="button"
                onClick={() => setErrorNotice(null)}
                aria-label="Dismiss notice"
                className="text-[#FDE68A]/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Example Space Questions */}
          <div className="px-3.5 py-2 bg-[#07090F] border-t border-[#95959D]/20">
            <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#B5945B] mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#4ADE80]" />
              <span>Example Space Questions</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="px-2.5 py-1 text-[11px] bg-[#1C1F28] hover:bg-[#2B3040] text-[#EAEAEB] border border-[#95959D]/25 rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-3 bg-[#07090F] border-t border-[#95959D]/25"
          >
            <label htmlFor="space-explorer-ai-input" className="sr-only">
              Ask Space Explorer AI any astronomy or space question
            </label>
            <input
              id="space-explorer-ai-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about planets, telescopes, black holes..."
              className="flex-1 bg-[#1C1F28] border border-[#95959D]/30 rounded px-3 py-2 text-xs text-[#FFFFFF] placeholder:text-[#C6C6C9]/60 focus:outline-none focus:border-[#4ADE80]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send question to Space Explorer AI"
              className="px-3 py-2 bg-[#FFFFFF] hover:bg-[#EAEAEB] disabled:opacity-40 text-[#000000] font-semibold rounded text-xs transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Space Explorer AI"
        className="flex items-center gap-2.5 px-4 py-3 rounded-md bg-[#161922] hover:bg-[#222736] text-[#FFFFFF] border border-[#95959D]/40 font-medium text-sm shadow-2xl transition-transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#4ADE80]" aria-hidden="true" />
        <MessageSquare className="w-4 h-4 shrink-0 text-[#4ADE80]" />
        <span>Space Explorer AI</span>
      </button>
    </div>
  );
};
