// File: app/page.js
"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Code, AlertCircle, Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

export default function Home() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    setError("");
    setReview("");
    setDetectedLanguage("");

    try {
      const response = await fetch("/api/code-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get code review");
      }

      setReview(data.review);
      setDetectedLanguage(data.detectedLanguage);
      
      // Auto-expand all sections by default
      const sections = {};
      ["Bugs", "Performance", "Security", "Style", "Suggestions"].forEach(section => {
        sections[section] = true;
      });
      setExpandedSections(sections);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Process review content to add section toggle functionality
  const processReviewContent = () => {
    if (!review) return null;
    
    // Split review into sections
    const sections = [
      { title: "Bugs", keywords: ["bugs", "errors", "issues"] },
      { title: "Performance", keywords: ["performance", "optimizations", "efficiency"] },
      { title: "Security", keywords: ["security", "vulnerabilities", "risk"] },
      { title: "Style", keywords: ["style", "practices", "conventions", "formatting"] },
      { title: "Suggestions", keywords: ["suggestions", "improvements", "recommendations"] }
    ];
    
    const lines = review.split('\n');
    const processedSections = [];
    let currentSection = { title: "Overview", content: [] };
    let sectionStarted = false;
    
    lines.forEach(line => {
      // Check if line is a section header
      const matchedSection = sections.find(section => 
        section.keywords.some(keyword => 
          line.toLowerCase().includes(keyword) && 
          (line.includes('#') || line.includes(':'))
        )
      );
      
      if (matchedSection) {
        // Save previous section if it exists
        if (currentSection.content.length > 0) {
          processedSections.push(currentSection);
        }
        // Start new section
        currentSection = { 
          title: matchedSection.title, 
          content: [line] 
        };
        sectionStarted = true;
      } else {
        // Add line to current section
        currentSection.content.push(line);
      }
    });
    
    // Add the last section
    if (currentSection.content.length > 0) {
      processedSections.push(currentSection);
    }
    
    return processedSections.map(section => (
      <div key={section.title} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection(section.title)}
        >
          <h3 className="font-medium text-lg flex items-center">
            {section.title === "Bugs" && <AlertCircle size={18} className="mr-2 text-red-500" />}
            {section.title === "Performance" && <Code size={18} className="mr-2 text-blue-500" />}
            {section.title === "Security" && <AlertCircle size={18} className="mr-2 text-orange-500" />}
            {section.title === "Style" && <Code size={18} className="mr-2 text-purple-500" />}
            {section.title === "Suggestions" && <CheckCircle size={18} className="mr-2 text-green-500" />}
            {section.title === "Overview" && <Code size={18} className="mr-2 text-gray-500" />}
            {section.title}
          </h3>
          {expandedSections[section.title] ? 
            <ChevronUp size={18} /> : 
            <ChevronDown size={18} />
          }
        </div>
        {expandedSections[section.title] && (
          <div className="p-6 prose max-w-none bg-white">
            {section.content.map((line, i) => {
              // Improve spacing and formatting
              let formattedLine = line;
              
              // Add heading styles
              if (line.includes('##')) {
                formattedLine = `<h3 class="text-xl font-semibold mt-5 mb-3">${line.replace(/##/g, '')}</h3>`;
              } else if (line.includes('#')) {
                formattedLine = `<h2 class="text-2xl font-bold mt-6 mb-4">${line.replace(/#/g, '')}</h2>`;
              }
              
              // Format numbered lists
              if (/^\d+\./.test(line)) {
                formattedLine = `<div class="ml-4 my-2">${line}</div>`;
              }
              
              // Format code blocks with better visibility
              formattedLine = formattedLine.replace(
                /```([\s\S]*?)```/g, 
                '<pre class="bg-gray-100 p-4 rounded-md my-4 font-mono text-sm border border-gray-200 overflow-x-auto">$1</pre>'
              );
              
              // Format inline code
              formattedLine = formattedLine.replace(
                /`([^`]+)`/g, 
                '<code class="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-200">$1</code>'
              );
              
              // Add appropriate spacing between paragraphs
              const isParagraph = line.trim().length > 0 && 
                                 !line.includes('<h2') && 
                                 !line.includes('<h3') && 
                                 !line.includes('<pre') &&
                                 !line.includes('<div') &&
                                 !/^\d+\./.test(line);
                                 
              if (isParagraph) {
                formattedLine = `<p class="my-3 leading-relaxed text-gray-700">${formattedLine}</p>`;
              }
              
              // Empty lines should create spacing
              if (line.trim().length === 0) {
                return <div key={i} className="h-2"></div>;
              }
              
              return (
                <div 
                  key={i} 
                  dangerouslySetInnerHTML={{ 
                    __html: formattedLine
                  }} 
                />
              );
            })}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Code Review AI Agent</h1>
          <p className="text-gray-600">Powered by Gemini AI with automatic language detection</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code Input Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
              <h2 className="font-medium">Your Code</h2>
              <div className="flex items-center space-x-2">
                {detectedLanguage && (
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">
                    {detectedLanguage}
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(code)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copy code"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded h-96 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Paste your code here..."
                  spellCheck="false"
                  required
                />
              </div>
              <div className="bg-gray-50 px-4 py-3">
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Code size={18} className="mr-2" />
                      Review Code
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Review Results Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white p-3">
              <h2 className="font-medium">Review Results</h2>
            </div>
            <div className="p-4 max-h-[32rem] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle size={20} className="text-red-500 mr-2" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Loader2 size={36} className="animate-spin mb-4" />
                  <p>Analyzing your code...</p>
                  <p className="text-sm mt-2">This may take a moment depending on code complexity</p>
                </div>
              )}
              
              {!loading && !review && !error && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Code size={48} className="mb-4" />
                  <p>Paste your code and click "Review Code" to get started</p>
                </div>
              )}
              
              {review && processReviewContent()}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-12 py-6 bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-300 text-sm">
            Code Reviewer AI Agent • Powered by Gemini API
          </p>
        </div>
      </footer>
    </div>
  );
}