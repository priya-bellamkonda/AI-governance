import React, { useState, useEffect, useRef } from "react";
import { 
  MessagesSquare, 
  FileUp, 
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Collection = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'docs', 'jira'
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/requirements/collect`, {
        session_id: sessionId,
        messages: [...messages, userMessage]
      });

      const { session_id, requirements: newReqs, answer } = response.data;
      setSessionId(session_id);
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
      setRequirements(newReqs);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const saveRequirement = async (req) => {
    try {
      // Logic to save to DB (we'd need a projectId here, let's assume a default or pick one)
      // For demo, we'll just log
      console.log("Saving requirement:", req);
    } catch (error) {
      console.error("Error saving requirement:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Requirement Collection</h1>
          <p className="text-sm text-gray-500">Extract, categorize, and map security requirements via multiple channels.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === "chat" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            <MessagesSquare className="w-5 h-5 mr-2" />
            Chat
          </button>
          <button 
            onClick={() => setActiveTab("docs")}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === "docs" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            <FileUp className="w-5 h-5 mr-2" />
            Documents
          </button>
          <button 
            onClick={() => setActiveTab("jira")}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === "jira" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            <CloudDownload className="w-5 h-5 mr-2" />
            Integrations
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat/Input Area */}
        <div className="w-1/2 flex flex-col border-r bg-white">
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <MessagesSquare className="w-16 h-16 mb-4 opacity-20" />
                    <p className="max-w-xs">Start a conversation to extract security requirements for your project.</p>
                  </div>
                )}
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${m.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none shadow-sm"}`}>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your security requirements..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                  />
                  <button 
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-2 top-1.5 p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === "docs" && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-full max-w-md p-10 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 transition-all cursor-pointer">
                <FileUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700">Upload Security Documents</h3>
                <p className="mt-1 text-sm text-gray-500">Drop PDF, Word, Excel, or Markdown files here to extract requirements automatically.</p>
                <input type="file" className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700">
                  Select Files
                </label>
              </div>
            </div>
          )}

          {activeTab === "jira" && (
            <div className="flex-1 p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border rounded-2xl bg-white hover:border-indigo-500 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                    <CloudDownload className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900">JIRA Integration</h3>
                  <p className="text-xs text-gray-500 mt-1">Import requirements directly from JIRA tickets & epics via MCP.</p>
                  <button className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800">Configure Connection &rarr;</button>
                </div>
                <div className="p-6 border rounded-2xl bg-white hover:border-indigo-500 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 text-cyan-600 group-hover:scale-110 transition-transform">
                    <CloudDownload className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900">Confluence</h3>
                  <p className="text-xs text-gray-500 mt-1">Extract requirements from Confluence documentation pages.</p>
                  <button className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800">Configure Connection &rarr;</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Requirements Feed */}
        <div className="w-1/2 flex flex-col bg-gray-50 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-white">
            <h2 className="font-bold text-gray-900 flex items-center">
              Extracted Requirements
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{requirements.length}</span>
            </h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              <Plus className="w-4 h-4 mr-1" />
              Add Manual
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {requirements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>No requirements identified yet.</p>
              </div>
            ) : (
              requirements.map((req, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                        {req.category || "General"}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {req.complianceMappings?.map((m, i) => (
                        <span key={i} title={m.framework} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200">
                          {m.framework}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{req.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-gray-400 italic">Extracted from {activeTab}</span>
                    <button 
                      onClick={() => saveRequirement(req)}
                      className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
