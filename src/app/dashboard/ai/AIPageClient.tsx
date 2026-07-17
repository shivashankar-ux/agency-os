"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, FileText, TrendingUp, HelpCircle,
  Copy, Download, RefreshCw, Send, CheckSquare, Search,
  Share2, Mail, SearchCheck, Check, ClipboardCopy, MessageSquare, Trash2
} from "lucide-react";

type Profile = { id: string; name: string };

export default function AIPageClient({ profile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState<"proposal" | "strategy" | "caption" | "email" | "seo" | "general">("proposal");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  // Chat/Search history states
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Form states
  const [proposalParams, setProposalParams] = useState({ clientName: "", scope: "", budget: "", duration: "" });
  const [strategyParams, setStrategyParams] = useState({ productName: "", targetAudience: "", goal: "", channels: "" });
  const [captionParams, setCaptionParams] = useState({ platform: "LinkedIn", topic: "", tone: "Professional", cta: "" });
  const [emailParams, setEmailParams] = useState({ recipientName: "", subject: "", points: "" });
  const [seoParams, setSeoParams] = useState({ keywords: "", pageTopic: "", intent: "Informational" });

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("agency_os_ai_chat_history");
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    setCopied(false);

    let params = {};
    if (activeTab === "proposal") params = proposalParams;
    else if (activeTab === "strategy") params = strategyParams;
    else if (activeTab === "caption") params = captionParams;
    else if (activeTab === "email") params = emailParams;
    else if (activeTab === "seo") params = seoParams;

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptType: activeTab, params }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate copy");

      setOutput(data.content);
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const updatedHistory = [...chatHistory, { role: "user" as const, text: userMessage }];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType: "general",
          params: {
            message: userMessage,
            history: chatHistory,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      const finalHistory = [...updatedHistory, { role: "model" as const, text: data.content }];
      setChatHistory(finalHistory);
      localStorage.setItem("agency_os_ai_chat_history", JSON.stringify(finalHistory));
    } catch (err: any) {
      alert(err.message || "Something went wrong");
      setChatHistory(chatHistory);
    } finally {
      setChatLoading(false);
    }
  }

  function handleClearChat() {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      setChatHistory([]);
      localStorage.removeItem("agency_os_ai_chat_history");
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ai_${activeTab}_output.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-400 animate-pulse" />
          AI Copilot Workspace
        </h1>
        <p className="text-neutral-500 text-xs mt-0.5">
          Generate high-impact proposals, strategize social media campaigns, and audit search metadata.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Configurator Column */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-6">
          {/* Sub tabs list */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-850">
            {[
              { id: "proposal", label: "Proposal", icon: FileText },
              { id: "strategy", label: "Strategy", icon: TrendingUp },
              { id: "caption", label: "Caption", icon: Share2 },
              { id: "email", label: "Email", icon: Mail },
              { id: "seo", label: "SEO Plan", icon: SearchCheck },
              { id: "general", label: "General Search & Chat", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setOutput(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xxs font-bold rounded-lg transition-colors
                  ${activeTab === tab.id ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form parameters */}
          {activeTab !== "general" ? (
            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {activeTab === "proposal" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Client / Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech Solutions"
                      value={proposalParams.clientName}
                      onChange={(e) => setProposalParams({ ...proposalParams, clientName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Scope of Work</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Complete redesign of corporate website and setup of Google Ads search campaign."
                      value={proposalParams.scope}
                      onChange={(e) => setProposalParams({ ...proposalParams, scope: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-semibold">Budget Range</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹1,50,000 - ₹3,00,000"
                        value={proposalParams.budget}
                        onChange={(e) => setProposalParams({ ...proposalParams, budget: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-semibold">Project Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 6 Weeks"
                        value={proposalParams.duration}
                        onChange={(e) => setProposalParams({ ...proposalParams, duration: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "strategy" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Product or Service Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SaaS CRM Platform"
                      value={strategyParams.productName}
                      onChange={(e) => setStrategyParams({ ...strategyParams, productName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Target Audience</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Freelancers, digital marketing agencies"
                      value={strategyParams.targetAudience}
                      onChange={(e) => setStrategyParams({ ...strategyParams, targetAudience: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Business Goals</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Increase monthly subscriptions by 20%"
                      value={strategyParams.goal}
                      onChange={(e) => setStrategyParams({ ...strategyParams, goal: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Marketing Channels</label>
                    <input
                      type="text"
                      placeholder="e.g. LinkedIn Ads, Google Search SEO"
                      value={strategyParams.channels}
                      onChange={(e) => setStrategyParams({ ...strategyParams, channels: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                </div>
              )}

              {activeTab === "caption" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-semibold">Platform</label>
                      <select
                        value={captionParams.platform}
                        onChange={(e) => setCaptionParams({ ...captionParams, platform: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                      >
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Twitter">Twitter / X</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-semibold">Tone</label>
                      <select
                        value={captionParams.tone}
                        onChange={(e) => setCaptionParams({ ...captionParams, tone: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Creative">Creative / Story-driven</option>
                        <option value="Bold">Bold / Disruptive</option>
                        <option value="Casual">Casual / Relatable</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Topic / Core Message</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Key benefits of automation inside marketing agencies..."
                      value={captionParams.topic}
                      onChange={(e) => setCaptionParams({ ...captionParams, topic: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Call to Action (CTA)</label>
                    <input
                      type="text"
                      placeholder="e.g. Read the full case study inside link in bio!"
                      value={captionParams.cta}
                      onChange={(e) => setCaptionParams({ ...captionParams, cta: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                </div>
              )}

              {activeTab === "email" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-semibold">Recipient Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={emailParams.recipientName}
                        onChange={(e) => setEmailParams({ ...emailParams, recipientName: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-semibold">Subject / Goal</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Proposal review follow up"
                        value={emailParams.subject}
                        onChange={(e) => setEmailParams({ ...emailParams, subject: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Key Points to Cover (One per line)</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="e.g. We have updated phase 2 deliverables.&#10;Total cost remains identical.&#10;Scheduled kick-off next Tuesday."
                      value={emailParams.points}
                      onChange={(e) => setEmailParams({ ...emailParams, points: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600 resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Target Keywords (Comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. marketing automation, agency workflow"
                      value={seoParams.keywords}
                      onChange={(e) => setSeoParams({ ...seoParams, keywords: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Page Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Guide to automating agency task management"
                      value={seoParams.pageTopic}
                      onChange={(e) => setSeoParams({ ...seoParams, pageTopic: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Search Intent</label>
                    <select
                      value={seoParams.intent}
                      onChange={(e) => setSeoParams({ ...seoParams, intent: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    >
                      <option value="Informational">Informational (Blogs, guides)</option>
                      <option value="Transactional">Transactional (Pricing, service sheets)</option>
                      <option value="Commercial">Commercial (Product comparisons)</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white-literal rounded-xl py-3 font-bold transition-all shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Generating Copy...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Run Generative Copilot
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendChatMessage} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Ask Gemini / General Search Query</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Ask anything, do a general search, draft custom outlines, or refine copywriting with context memory active..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700 placeholder-neutral-600 resize-none font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white-literal rounded-xl py-3 font-bold transition-all shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-1.5"
                >
                  {chatLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Thinking...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Message
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={chatHistory.length === 0}
                  className="px-4 bg-neutral-950 border border-neutral-850 hover:bg-neutral-800 disabled:opacity-50 text-neutral-400 hover:text-white rounded-xl transition-all"
                  title="Clear Chat History"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between" style={{ minHeight: "520px" }}>
          {activeTab !== "general" ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">Generated Asset Draft</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!output}
                      title="Copy to Clipboard"
                      className="flex items-center gap-1 bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg text-xxs font-semibold transition-colors disabled:opacity-50"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy Draft
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!output}
                      title="Download Markdown File"
                      className="flex items-center gap-1 bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg text-xxs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Download size={12} /> Export .md
                    </button>
                  </div>
                </div>

                {/* Content Output Box */}
                <div className="bg-neutral-950 rounded-2xl border border-neutral-850 p-5 overflow-y-auto max-h-[380px] text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
                  {output || (
                    <div className="text-center py-20 text-neutral-600 italic">
                      Select a template on the left, enter parameters and click generate to populate copy draft here.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-850 pt-3 mt-4 text-xxs text-neutral-500">
                * Drafts support complete GitHub Flavored Markdown syntax format *
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3 flex-shrink-0">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-400" />
                    Conversation Thread
                  </h3>
                  <span className="text-neutral-555 text-xxs bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded">
                    Memory active ({chatHistory.length} messages)
                  </span>
                </div>

                {/* Chat Thread Container */}
                <div className="bg-neutral-950 rounded-2xl border border-neutral-850 p-4 overflow-y-auto flex-1 flex flex-col gap-3 max-h-[360px] min-h-[300px]">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-24 text-neutral-650 italic flex flex-col items-center justify-center gap-2 flex-1">
                      <MessageSquare size={32} className="text-neutral-750" />
                      <p className="text-xs">Ask Gemini anything! Conversation history is preserved in this browser.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white-literal self-end rounded-br-none"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-200 self-start rounded-bl-none whitespace-pre-wrap select-text font-sans"
                        }`}
                      >
                        <span className="text-xxs font-semibold text-neutral-450 mb-1 block">
                          {msg.role === "user" ? "You" : "AI Copilot"}
                        </span>
                        {msg.text}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 self-start rounded-xl rounded-bl-none p-3 text-xs flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin text-indigo-400" />
                      <span>AI Copilot is thinking...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-850 pt-3 mt-4 text-xxs text-neutral-500 flex justify-between items-center flex-shrink-0">
                <span>* Conversational threads use context memory of previous messages *</span>
                {chatHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const fullChat = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n\n');
                      navigator.clipboard.writeText(fullChat);
                      alert("Copied full conversation thread to clipboard!");
                    }}
                    className="text-indigo-400 hover:underline hover:text-indigo-300 font-semibold"
                  >
                    Copy Full Thread
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
