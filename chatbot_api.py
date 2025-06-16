import json
import re
import string
from difflib import get_close_matches
from collections import defaultdict
import math
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Try to import NLTK and sklearn, fallback to basic implementation if not available
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    from nltk.stem import WordNetLemmatizer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    
    # Download required NLTK data
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
        nltk.data.find('corpora/wordnet')
    except LookupError:
        nltk.download('punkt_tab', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
    
    ADVANCED_NLP_AVAILABLE = True
    print("✅ Advanced NLP libraries loaded successfully")
except ImportError as e:
    print(f"⚠️ Advanced NLP libraries not available: {e}")
    print("🔄 Falling back to basic similarity matching")
    ADVANCED_NLP_AVAILABLE = False

# Pydantic models for request/response
class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    category: str
    confidence: float
    matched_question: str

class RobustUniversityFAQChatbot:
    def __init__(self, faq_data_path="university_faq_chatbot.json"):
        """Initialize the robust chatbot with enhanced FAQ matching capabilities."""
    
        try:
            with open(faq_data_path, 'r', encoding='utf-8') as file:
                self.faq_data = json.load(file)
        except UnicodeDecodeError:
            # Try with different encoding if UTF-8 fails
            try:
                with open(faq_data_path, 'r', encoding='latin-1') as file:
                    self.faq_data = json.load(file)
            except Exception as e:
                print(f"❌ Error loading FAQ data: {e}")
                self.load_sample_data()
                return
        except FileNotFoundError:
            print(f"❌ Error: {faq_data_path} not found!")
            self.load_sample_data()
            return
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON: {e}")
            self.load_sample_data()
            return

        if ADVANCED_NLP_AVAILABLE:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))

        # Enhanced FAQ indices
        self.faqs_list = []
        self.questions_text = []
        self.answers_text = []
        self.categories = []
        self.build_enhanced_index()

        # TF-IDF vectorizer for semantic matching
        if ADVANCED_NLP_AVAILABLE:
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 2),
                lowercase=True
            )
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.questions_text)
        else:
            self.tfidf_vectorizer = None
            self.tfidf_matrix = None

        # Conversation context
        self.conversation_history = []
        self.current_category = None
        self.context_memory = []

        # Enhanced patterns
        self.greeting_patterns = [
            "hi", "hello", "hey", "greetings", "howdy", "welcome", "good morning",
            "good afternoon", "good evening", "what's up", "sup"
        ]

        # Question patterns for better understanding
        self.question_starters = [
            "what", "how", "when", "where", "why", "who", "which", "can", "could",
            "would", "should", "is", "are", "do", "does", "will", "tell me", "explain"
        ]

    def load_sample_data(self):
        """Fallback sample data for testing"""
        print("🔄 Loading sample data for testing...")
        self.faq_data = {
            "faqs": [
                {
                    "category": "General",
                    "original_question": "Hi",
                    "answer": "Hello! I'm your UMT assistant. I'm here to help you with any questions about the University of Management and Technology - from admissions and academics to fees, scholarships, examinations, and campus life. What would you like to know?",
                    "possible_questions": [
                        "Hello, are you there?",
                        "Hey there, can you help me?",
                        "Hi, I need some assistance.",
                        "Greetings, how can you help me?"
                    ]
                },
                {
                    "category": "Admissions",
                    "original_question": "What are the admission requirements for undergraduate programs at UMT?",
                    "answer": "Admission requirements at UMT for undergraduate programs include:\n- Minimum 50% marks in FSc, ICS, or Intermediate with Physics\n- Minimum 50% marks in UMT entrance test\n- No third division in matriculation\n- Application fee: Rs. 25,000\n- Required documents: Unofficial transcript, Hope Certificate, Two photographs, CNIC copies",
                    "possible_questions": [
                        "What are the criteria for undergraduate admission at UMT?",
                        "What qualifications do I need to apply for an undergraduate program?",
                        "Can you outline the admission requirements for UMT undergrad programs?",
                        "How can I get admission in UMT for software engineering?",
                        "What do I need to apply for an undergraduate program at UMT?"
                    ]
                },
                {
                    "category": "Fee & Scholarships",
                    "original_question": "Does UMT offer any scholarships?",
                    "answer": "Yes, UMT offers merit-based and need-based scholarships. Detailed information can be found at: https://www.umt.edu.pk/org/Scholarship-Financial-Assistance/",
                    "possible_questions": [
                        "Are there scholarships available at UMT?",
                        "What types of scholarships does UMT provide?",
                        "Can you tell me about UMT's scholarship programs?",
                        "Does UMT offer any financial aid or scholarship opportunities?"
                    ]
                }
            ]
        }

    def build_enhanced_index(self):
        """Build comprehensive indices for robust question matching."""
        for faq in self.faq_data["faqs"]:
            self.faqs_list.append(faq)

            # Combine all question variants for better matching
            all_questions = [faq["original_question"]] + faq["possible_questions"]
            combined_questions = " ".join(all_questions)

            self.questions_text.append(self.preprocess_text_advanced(combined_questions))
            self.answers_text.append(self.preprocess_text_advanced(faq["answer"]))
            self.categories.append(faq["category"])

    def preprocess_text_advanced(self, text):
        """Advanced text preprocessing for better semantic understanding."""
        if not text:
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text)

        # Keep important punctuation that might be meaningful
        text = re.sub(r'[^\w\s\-\?\!]', ' ', text)

        if ADVANCED_NLP_AVAILABLE:
            # Tokenize
            word_tokens = word_tokenize(text)

            # Remove stopwords and lemmatize, but keep important question words
            important_words = ['what', 'how', 'when', 'where', 'why', 'who', 'which']
            filtered_words = []

            for w in word_tokens:
                if w not in self.stop_words or w in important_words:
                    lemmatized = self.lemmatizer.lemmatize(w)
                    if len(lemmatized) > 1:  # Keep words longer than 1 character
                        filtered_words.append(lemmatized)

            return ' '.join(filtered_words)
        else:
            # Basic preprocessing without NLTK
            words = text.split()
            filtered_words = [w for w in words if len(w) > 1]
            return ' '.join(filtered_words)

    def extract_key_concepts(self, text):
        """Extract key concepts and entities from text."""
        processed = self.preprocess_text_advanced(text)
        tokens = processed.split()

        # Common university-related keywords
        university_keywords = [
            'admission', 'fee', 'scholarship', 'exam', 'test', 'course', 'program',
            'degree', 'semester', 'credit', 'gpa', 'transcript', 'application',
            'requirement', 'deadline', 'registration', 'enrollment', 'faculty',
            'department', 'campus', 'library', 'hostel', 'accommodation'
        ]

        # Extract important concepts
        key_concepts = []
        for token in tokens:
            if len(token) > 2 and (token in university_keywords or token.isalpha()):
                key_concepts.append(token)

        return key_concepts

    def calculate_semantic_similarity(self, user_query):
        """Calculate semantic similarity using TF-IDF and cosine similarity."""
        if not ADVANCED_NLP_AVAILABLE or self.tfidf_vectorizer is None:
            return [0.0] * len(self.faqs_list)
            
        processed_query = self.preprocess_text_advanced(user_query)
        query_vector = self.tfidf_vectorizer.transform([processed_query])

        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        return similarities

    def fuzzy_match_score(self, user_query, faq_text):
        """Calculate fuzzy matching score."""
        user_processed = self.preprocess_text_advanced(user_query)
        faq_processed = self.preprocess_text_advanced(faq_text)

        # Use difflib for fuzzy matching
        matches = get_close_matches(user_processed, [faq_processed], n=1, cutoff=0.1)
        if matches:
            # Calculate similarity ratio
            from difflib import SequenceMatcher
            ratio = SequenceMatcher(None, user_processed, faq_processed).ratio()
            return ratio
        return 0.0

    def keyword_overlap_score(self, user_query, faq_text):
        """Calculate keyword overlap score."""
        user_concepts = set(self.extract_key_concepts(user_query))
        faq_concepts = set(self.extract_key_concepts(faq_text))

        if not user_concepts or not faq_concepts:
            return 0.0

        intersection = user_concepts.intersection(faq_concepts)
        union = user_concepts.union(faq_concepts)

        return len(intersection) / len(union) if union else 0.0

    def find_best_match_comprehensive(self, user_query):
        """Comprehensive matching using multiple techniques."""
        print(f"🔍 DEBUG: Searching for: '{user_query}'")
        
        # Calculate semantic similarities
        semantic_scores = self.calculate_semantic_similarity(user_query)

        # Calculate other scores for each FAQ
        final_scores = []

        for i, faq in enumerate(self.faqs_list):
            # Combine all question texts for this FAQ
            all_questions = [faq["original_question"]] + faq["possible_questions"]
            combined_text = " ".join(all_questions)

            # Calculate different similarity scores
            semantic_score = semantic_scores[i]
            fuzzy_score = self.fuzzy_match_score(user_query, combined_text)
            keyword_score = self.keyword_overlap_score(user_query, combined_text)
            answer_keyword_score = self.keyword_overlap_score(user_query, faq["answer"])
            category_score = self.keyword_overlap_score(user_query, faq["category"])

            # Weighted combination of scores
            final_score = (
                semantic_score * 0.4 +
                fuzzy_score * 0.25 +
                keyword_score * 0.2 +
                answer_keyword_score * 0.1 +
                category_score * 0.05
            )

            final_scores.append((faq, final_score, i))
        
            # Debug: Show top scoring FAQs
            if final_score > 0.1:
                print(f"📊 DEBUG: FAQ '{faq['original_question'][:50]}...' - Score: {final_score:.3f}")
                print(f"   Category: {faq['category']}")
                print(f"   Semantic: {semantic_score:.3f}, Fuzzy: {fuzzy_score:.3f}, Keyword: {keyword_score:.3f}")

        # Sort by score and return best match
        final_scores.sort(key=lambda x: x[1], reverse=True)
    
        if final_scores:
            print(f"🎯 DEBUG: Best match: '{final_scores[0][0]['original_question'][:50]}...' with score {final_scores[0][1]:.3f}")

        if final_scores and final_scores[0][1] > 0.1:  # Lower threshold for more matches
            return final_scores[0][0], final_scores[0][1]

        return None, 0.0

    def is_general_conversation(self, user_input):
        """Determine if the input is general conversation."""
        user_lower = user_input.lower().strip()

        # Greeting patterns
        for greeting in self.greeting_patterns:
            if greeting in user_lower:
                return True

        # General conversation indicators
        general_patterns = [
            "how are you", "what's up", "tell me about yourself", "who are you",
            "what can you do", "help me", "thanks", "thank you", "goodbye", "bye",
            "chat", "talk", "discuss", "conversation", "weather", "joke", "story",
            "nice to meet", "good job", "well done", "awesome", "great", "cool"
        ]

        for pattern in general_patterns:
            if pattern in user_lower:
                return True

        # Check for university-related keywords - if present, it's likely a real question
        university_keywords = [
            'admission', 'fee', 'scholarship', 'exam', 'test', 'course', 'program',
            'degree', 'semester', 'credit', 'gpa', 'transcript', 'application',
            'requirement', 'deadline', 'registration', 'enrollment', 'faculty',
            'department', 'campus', 'library', 'hostel', 'accommodation'
        ]
        
        # If the input contains university keywords, it's NOT general conversation
        for keyword in university_keywords:
            if keyword in user_lower:
                return False

        # Check if it's a very short response without question indicators AND without university keywords
        if len(user_input.split()) <= 2 and not any(starter in user_lower for starter in self.question_starters):
            return True

        return False

    def generate_contextual_response(self, user_input):
        """Generate contextual responses for general conversation."""
        user_lower = user_input.lower().strip()

        # Greetings
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
        if any(greeting in user_lower for greeting in greetings):
            return ("Hello! I'm your UMT assistant. I'm here to help you with any questions about "
                   "the University of Management and Technology - from admissions and academics to "
                   "fees, scholarships, examinations, and campus life. What would you like to know?")

        # About the bot
        if any(phrase in user_lower for phrase in ["who are you", "what are you", "tell me about yourself"]):
            return ("I'm an AI assistant specialized in helping with UMT (University of Management and Technology) "
                   "related queries. I have comprehensive knowledge about admissions, academic programs, fees, "
                   "scholarships, examination procedures, campus facilities, and much more. I'm designed to "
                   "understand your questions even if they're phrased differently. How can I assist you today?")

        # Capabilities
        if "what can you do" in user_lower or "help me" in user_lower:
            return ("I can help you with a wide range of UMT-related topics:\n\n"
                   "📚 Admissions & Applications\n"
                   "🎓 Academic Programs & Courses\n"
                   "💰 Fee Structure & Payment\n"
                   "🏆 Scholarships & Financial Aid\n"
                   "📝 Examinations & Grading\n"
                   "🏢 Campus Facilities & Services\n"
                   "📋 Registration & Enrollment\n"
                   "🎯 Career Services & Placement\n\n"
                   "Just ask me anything about these topics, and I'll do my best to provide accurate information!")

        # How are you
        if "how are you" in user_lower:
            return ("I'm functioning well and ready to help! I'm here to assist you with any UMT-related "
                   "questions or information you need. Whether it's about admissions, academics, or campus life, "
                   "I'm at your service. What would you like to know?")

        # Thanks
        if any(word in user_lower for word in ["thank", "thanks"]):
            return ("You're very welcome! I'm glad I could help. Feel free to ask me anything else about UMT - "
                   "whether it's about admissions, courses, fees, or any other university-related topic. "
                   "I'm here whenever you need assistance!")

        # Goodbye
        if any(word in user_lower for word in ["bye", "goodbye", "see you"]):
            return ("Goodbye! It was great helping you today. Feel free to come back anytime you have questions "
                   "about UMT. Whether it's about admissions, academics, or campus life, I'll be here to assist. "
                   "Take care!")

        # Positive feedback
        if any(word in user_lower for word in ["good", "great", "awesome", "nice", "cool", "excellent"]):
            return ("Thank you for the positive feedback! I'm happy to help. Is there anything else you'd like "
                   "to know about UMT? I'm here to assist with any questions about the university.")

        # Default general response
        return ("I appreciate you reaching out! While I specialize in UMT-related information, I'm here to help "
               "with any questions about the university. You can ask me about admissions, academic programs, "
               "fees, scholarships, examinations, or campus facilities. What specific information are you looking for?")

    def get_response(self, user_input):
        """Generate comprehensive response with enhanced understanding."""
        # Handle empty input
        if not user_input.strip():
            return "I'm here to help! Please ask me anything about UMT."

        # Check for general conversation
        if self.is_general_conversation(user_input):
            return self.generate_contextual_response(user_input)

        # Try to find the best FAQ match
        best_match, confidence = self.find_best_match_comprehensive(user_input)

        # Update conversation history
        self.conversation_history.append((user_input, best_match, confidence))

        # High confidence match
        if best_match and confidence > 0.3:
            self.current_category = best_match["category"]
            self.context_memory.append(best_match["category"])
            return best_match["answer"]

        # Medium confidence match
        elif best_match and confidence > 0.15:
            self.current_category = best_match["category"]
            return (f"I think you're asking about {best_match['category'].lower()}. "
                   f"Here's what I found:\n\n{best_match['answer']}\n\n"
                   f"Is this what you were looking for? If not, could you please rephrase your question?")

        # Low confidence - try contextual help
        elif self.current_category:
            return self.provide_contextual_help(user_input)

        # No match found - provide helpful guidance
        return self.handle_no_match(user_input)

    def provide_contextual_help(self, user_input):
        """Provide help based on conversation context."""
        response = ("I don't have a specific answer for that question in my current knowledge base. ")

        if self.current_category:
            response += f"Since we were discussing {self.current_category.lower()}, here are some related questions I can help with:\n\n"

            # Find related questions in the same category
            related_faqs = [faq for faq in self.faqs_list if faq["category"] == self.current_category]

            if related_faqs:
                for i, faq in enumerate(related_faqs[:3], 1):
                    response += f"{i}. {faq['original_question']}\n"

            response += f"\nOr you can ask me about other UMT topics like admissions, academics, fees, or examinations."

        return response

    def handle_no_match(self, user_input):
        """Handle cases where no good match is found."""
        # Extract key concepts from user input
        key_concepts = self.extract_key_concepts(user_input)

        response = "I'd like to help you, but I need a bit more information. "

        if key_concepts:
            response += f"I noticed you mentioned: {', '.join(key_concepts[:3])}. "

        response += ("Could you please rephrase your question or be more specific? "
                    "\n\nI can help you with questions about:\n"
                    "• Admissions and application procedures\n"
                    "• Academic programs and course details\n"
                    "• Fee structure and payment methods\n"
                    "• Scholarships and financial assistance\n"
                    "• Examination procedures and grading\n"
                    "• Campus facilities and student services\n"
                    "\nWhat specific aspect would you like to know about?")

        return response

    def reset_conversation(self):
        """Reset conversation context."""
        self.conversation_history = []
        self.current_category = None
        self.context_memory = []
        return "Great! I've reset our conversation. How can I help you with UMT today?"

    def get_conversation_summary(self):
        """Provide a summary of the conversation."""
        if not self.conversation_history:
            return "We haven't discussed anything yet. What would you like to know about UMT?"

        categories_discussed = list(set([item[1]["category"] for item in self.conversation_history if item[1]]))

        if categories_discussed:
            return (f"In our conversation, we've discussed: {', '.join(categories_discussed)}. "
                   f"Is there anything else you'd like to know about these topics or other UMT services?")
        else:
            return "We've been chatting, but haven't covered any specific UMT topics yet. What would you like to know?"

# Initialize the chatbot
chatbot = RobustUniversityFAQChatbot()

# Create FastAPI app
app = FastAPI(
    title="Robust University FAQ Chatbot API",
    description="Enhanced API for university FAQ chatbot system with advanced NLP capabilities",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Robust University FAQ Chatbot API is running!",
        "total_faqs": len(chatbot.faqs_list),
        "advanced_nlp": ADVANCED_NLP_AVAILABLE,
        "status": "healthy",
        "version": "2.0.0"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Enhanced chat endpoint with robust matching"""
    try:
        user_message = request.message.strip()
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        print(f"📨 Received: '{user_message}' from user: {request.user_id}")
        
        # Check if it's general conversation first
        if chatbot.is_general_conversation(user_message):
            response_text = chatbot.generate_contextual_response(user_message)
            return ChatResponse(
                response=response_text,
                category="General",
                confidence=1.0,
                matched_question="General conversation"
            )
        
        # Try to find the best FAQ match
        best_match, confidence = chatbot.find_best_match_comprehensive(user_message)
        
        if best_match and confidence > 0.3:
            # High confidence match - return the answer directly
            chatbot.current_category = best_match["category"]
            chatbot.context_memory.append(best_match["category"])
            response_text = best_match["answer"]
            category = best_match["category"]
            matched_question = best_match["original_question"]
            
        elif best_match and confidence > 0.15:
            # Medium confidence match - ask for clarification
            chatbot.current_category = best_match["category"]
            response_text = (f"I think you're asking about {best_match['category'].lower()}. "
                           f"Here's what I found:\n\n{best_match['answer']}\n\n"
                           f"Is this what you were looking for? If not, could you please rephrase your question?")
            category = best_match["category"]
            matched_question = best_match["original_question"]
            
        else:
            # No good match found
            response_text = chatbot.handle_no_match(user_message)
            category = "General"
            matched_question = "No specific match"
            confidence = 0.0
        
        # Update conversation history
        chatbot.conversation_history.append((user_message, best_match, confidence))
        
        return ChatResponse(
            response=response_text,
            category=category,
            confidence=confidence,
            matched_question=matched_question
        )
    
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/categories")
async def get_categories():
    """Get all available categories"""
    try:
        categories = list(set(faq['category'] for faq in chatbot.faqs_list))
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    return {
        "status": "healthy",
        "total_faqs": len(chatbot.faqs_list),
        "advanced_nlp": ADVANCED_NLP_AVAILABLE,
        "api_version": "2.0.0"
    }

@app.get("/test-questions")
async def get_test_questions():
    """Get sample questions for testing"""
    return {
        "test_questions": [
            "Hi there!",
            "What is GPA?",
            "How can I get admission in UMT for software engineering?",
            "What are the admission requirements?",
            "Are there any scholarships available?",
            "What is the fee structure?",
            "How do I apply for admission?",
            "What documents do I need for application?",
            "When is the admission deadline?",
            "Can you help me with course registration?"
        ]
    }

@app.get("/debug/questions")
async def debug_questions():
    """Debug endpoint to see loaded questions"""
    sample_questions = []
    for i, q in enumerate(chatbot.faqs_list[:10]):
        sample_questions.append({
            "index": i,
            "text": q['original_question'],
            "category": q['category']
        })
    
    return {
        "total_questions": len(chatbot.faqs_list),
        "sample_questions": sample_questions,
        "advanced_nlp": ADVANCED_NLP_AVAILABLE
    }

@app.post("/reset")
async def reset_conversation():
    """Reset conversation context"""
    return {"response": chatbot.reset_conversation()}

@app.get("/summary")
async def get_conversation_summary():
    """Get conversation summary"""
    return {"response": chatbot.get_conversation_summary()}

if __name__ == "__main__":
    print("🚀 Starting Robust University FAQ Chatbot API...")
    print("📚 Make sure your 'university_faq_chatbot.json' file is in the same directory")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print(f"🧠 Advanced NLP: {'Enabled' if ADVANCED_NLP_AVAILABLE else 'Disabled (basic mode)'}")
    
    uvicorn.run("chatbot_api:app", host="0.0.0.0", port=8000, reload=True)
