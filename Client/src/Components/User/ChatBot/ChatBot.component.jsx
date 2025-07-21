import { useState, useRef, useEffect } from "react"
import axios from "axios"
import {API_BASE_URL,Base_Url} from "../../../url"


// Message component for individual chat messages
const Message = ({ message, isUser, category, confidence }) => {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md p-8 flex-col flex gap-2  ${
          isUser ? "bg-gradient-to-br from-blue-300 to-indigo-500 text-white  rounded-4xl rounded-br-none " : "bg-gray-200 rounded-4xl rounded-bl-none text-gray-800 "
        }`}
      >
         {!isUser && category && (
          <div className="mt-2 text-xs opacity-75">
            <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full">{category}</span>
            {confidence > 0 && <span className="ml-2 text-gray-600">{Math.round(confidence * 100)}% match</span>}
          </div>
        )}
        <p className="text-sm text-wrap">{message}</p>
       
       
      </div>
    </div>
  )
}

// Typing indicator component
const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  )
}

// Quick suggestions component
const QuickSuggestions = ({ suggestions, onSuggestionClick, isVisible }) => {
  if (!isVisible) return null

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-3 py-1 rounded-full transition-colors duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

// Main App component
function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm the UMT FAQ Assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category: "General",
      confidence: 1.0,
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [userId] = useState(`user_${Date.now()}`) // Generate user ID once
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Quick suggestion questions
  const quickSuggestions = [
    "What are admission requirements?",
    "How to apply for admission?",
    "What is GPA?",
    "Are there scholarships available?",
    "What is the fee structure?",
    "How to check CGPA?",
  ]

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Check API connection on mount
  useEffect(() => {
    checkApiConnection()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const checkApiConnection = async () => {
    try {
      await axios.get(`${API_BASE_URL}/health`)
      setIsConnected(true)
    } catch (error) {
      setIsConnected(false)
      console.error("API connection failed:", error)
    }
  }

  // Function to store chat in Node.js database
  const storeChatInDatabase = async (userMessage, aiResponse, category, confidence, matchedQuestion) => {
    try {
      const response = await axios.post(`${Base_Url}/api/chat/send`, {
        message: userMessage,
        user_id: userId,
        ai_response: aiResponse,
        category: category,
        confidence: confidence,
        matched_question: matchedQuestion,
      })

      console.log("Chat stored successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("Error storing chat in database:", error)
      // Don't throw error here to avoid breaking the chat flow
      return null
    }
  }

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)
    setShowSuggestions(false)

    try {
      const fastApiResponse = await axios.post(`${API_BASE_URL}/chat`, {
        message: messageText,
        user_id: userId,
      })

      const { response: aiResponse, category, confidence, matched_question } = fastApiResponse.data


      await storeChatInDatabase(messageText, aiResponse, category, confidence, matched_question)

      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          category: category,
          confidence: confidence,
        }

        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      }, 1000)
    } catch (error) {
      console.error("Error sending message:", error)

      setTimeout(() => {
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          category: "Error",
          confidence: 0,
        }

        setMessages((prev) => [...prev, errorMessage])
        setIsTyping(false)
      }, 1000)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage()
  }

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion)
  }

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm the UMT FAQ Assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: "General",
        confidence: 1.0,
      },
    ])
    setShowSuggestions(true)
  }

  return (
    <div className="min-h-screen overflow-hidden w-1/2 pr-12 ">
      <div className=" mx-auto flex items-center justify-center w-full h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/20 rounded-t-lg shadow-lg p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">UMT Admitbot</h1>
                  <p className="text-sm text-gray-600">
                    {isConnected ? (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Offline
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="bg-gray-100/40 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Clear Chat
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="bg-white/40 shadow-lg h-96 overflow-y-auto p-6">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                
                category={message.category}
                confidence={message.confidence}
              />
            ))}

            {isTyping && <TypingIndicator />}

            <QuickSuggestions
              suggestions={quickSuggestions}
              onSuggestionClick={handleSuggestionClick}
              isVisible={showSuggestions && messages.length === 1}
            />

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="bg-white/20 rounded-b-lg shadow-lg p-6 border-t">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 border text-white  border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-br from-blue-300 to-indigo-500 hover:bg-blue-600 disabled:from-gray-300/20 disabled:to-gray-300/20 disabled:text-white/20 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Send</span>
      
              </button>
            </form>

            {!isConnected && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="text-sm">
                  ⚠️ Unable to connect to the chatbot server. Please make sure the API is running on
                  http://localhost:8000
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-white">
            <p>University of Management and Technology (UMT) - FAQ Assistant</p>
            <p className="mt-1">Ask about admissions, academics, fees, scholarships, and more!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBot
