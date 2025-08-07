import React, { useState, useEffect } from 'react';

// This is a static, hardcoded "knowledge base" to simulate Lee Kuan Yew's
// speeches and writings. In a real-world RAG system, this data would be stored
// in a vector database, allowing for retrieval from thousands of documents.
const lkyKnowledgeBase = [
  {
    topic: "geopolitics, Singapore's survival",
    text: "My life has been spent building Singapore. We are a small country in a dangerous world, and we must always be relevant to the big powers. We do not have natural resources, our only resource is our people. Therefore, we must be a thinking people, and we must have a strong defense force to protect our sovereignty. The world owes us nothing. We owe ourselves our own survival."
  },
  {
    topic: "leadership, challenges",
    text: "Leadership is about making difficult decisions, often unpopular ones, for the long-term good of the country. A leader must be honest and incorruptible. He must be willing to tell the people the hard truths, even if it costs him popularity. Singapore's success was not by chance; it was a result of meticulous planning and a firm hand in implementation."
  },
  {
    topic: "social policy, meritocracy",
    text: "Meritocracy is the cornerstone of our society. We reward individuals based on their abilities and hard work, not their race, religion, or background. This ensures that the best minds lead the country and that everyone has an equal opportunity to succeed. However, we must also ensure that no one is left behind, and that social mobility remains a reality for all our citizens."
  },
  {
    topic: "economy, future",
    text: "To thrive in the global economy, Singapore must be agile and open. We must continuously attract foreign investment and remain a hub for trade, finance, and technology. We must innovate and adapt, or we will become irrelevant. The future belongs to those who are disciplined and can seize opportunities."
  }
];

// Main App component
const App = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // This function is the core logic of the RAG chatbot.
  // It takes the user's query, retrieves relevant context, and then
  // uses the Gemini API to generate a grounded response.
  const handleAskLKY = async () => {
    if (!query) return;

    setIsLoading(true);
    setResponse(null);
    setError(null);
    
    // Add the user's query to the chat history for display.
    const newChatHistory = [...chatHistory, { role: "user", text: query }];
    setChatHistory(newChatHistory);

    try {
      // Step 1: Simulate "Retrieval"
      // This is a simple keyword-based search. In a real application, this would
      // be a vector search to find semantically similar documents.
      const retrievedDocs = lkyKnowledgeBase.filter(doc => 
        doc.topic.toLowerCase().includes(query.toLowerCase()) || 
        doc.text.toLowerCase().includes(query.toLowerCase())
      );

      // As a fallback, if no specific documents are found, use the entire knowledge base.
      const context = retrievedDocs.length > 0
        ? retrievedDocs.map(doc => doc.text).join('\n---\n')
        : lkyKnowledgeBase.map(doc => doc.text).join('\n---\n');

      // Step 2: "Augment" the user's prompt
      // This is the prompt engineering part. We combine the user's question with the
      // retrieved context and provide explicit instructions for the AI's persona and behavior.
      const augmentedPrompt = `
        You are Lee Kuan Yew. Your persona is that of a statesman, leader, and realist.
        Answer the following question in the style of Lee Kuan Yew, using the provided context below as your primary source of information.
        Be firm, direct, and pragmatic in your response.
        If the context does not contain enough information to answer the question, state that you do not have the information but offer a related insight from the provided text. Do not make up facts.

        Question: ${query}

        Context:
        ${context}
      `;

      // Step 3: Call the Gemini API with the augmented prompt
      const payload = {
        contents: [{ role: "user", parts: [{ text: augmentedPrompt }] }],
        generationConfig: {
          temperature: 0.7, // A lower temperature for more consistent, factual responses.
        },
      };

      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const result = await apiResponse.json();
      const aiText = result.candidates[0]?.content?.parts[0]?.text || "No response found.";

      // Add the AI's response to the chat history for display.
      setChatHistory(prevHistory => [...prevHistory, { role: "gemini", text: aiText }]);
      
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  // Handles the Enter key press for submitting the query.
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAskLKY();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 shadow-md">
        <h1 className="text-xl font-bold text-center">Ask Lee Kuan Yew (RAG Chatbot)</h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">A project demonstrating Retrieval-Augmented Generation for a specific persona.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`p-3 max-w-lg rounded-lg shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="font-semibold">{msg.role === 'user' ? 'You' : 'Lee Kuan Yew'}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 max-w-lg rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <p className="font-semibold">Lee Kuan Yew</p>
              <p>Thinking...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="p-3 rounded-lg shadow-md bg-red-500 text-white">
              <p>{error}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ask your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors"
            onClick={handleAskLKY}
            disabled={isLoading}
          >
            Ask
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;