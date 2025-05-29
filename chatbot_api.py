import json
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Simple similarity matching without sklearn to avoid numpy issues
import math
from collections import Counter

# Pydantic models for request/response
class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    category: str
    confidence: float
    matched_question: str

class SimpleChatbot:
    def __init__(self, json_file_path: str = "university_faq_chatbot.json"):
        self.json_file_path = json_file_path
        self.faqs = []
        self.all_questions = []  # Store all questions with their FAQ references
        self.load_faq_data()
        self.prepare_questions()
    
    def load_faq_data(self):
        """Load FAQ data from JSON file"""
        try:
            with open(self.json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.faqs = data['faqs']
                print(f"✅ Successfully loaded {len(self.faqs)} FAQ entries")
        except FileNotFoundError:
            print(f"❌ Error: {self.json_file_path} not found!")
            self.load_sample_data()
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON: {e}")
            self.load_sample_data()
    
    def load_sample_data(self):
        """Fallback sample data for testing"""
        print("🔄 Loading sample data for testing...")
        self.faqs = [
            {
                "category": "General",
                "original_question": "Hi",
                "answer": "Hello, How may I help you?",
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
                "category": "Academic",
                "original_question": "What is GPA and how is it computed?",
                "answer": "GPA represents a participant's performance in a semester. It is calculated by converting letter grades to grade points, multiplying these by the credit hours for each course, and dividing the total grade points by the total credit hours. GPA ranges from 0 to 4.00.",
                "possible_questions": [
                    "Can you explain what GPA means and how to calculate it?",
                    "How do I compute my GPA?",
                    "what is GPA",
                    "What does GPA stand for and how is it determined?"
                ]
            }
        ]
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        if not text:
            return ""
        text = str(text).lower()
        # Remove punctuation and extra spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        text = ' '.join(text.split())
        return text
    
    def prepare_questions(self):
        """Prepare all questions for matching"""
        self.all_questions = []
        
        for faq_idx, faq in enumerate(self.faqs):
            # Add original question
            self.all_questions.append({
                'text': self.preprocess_text(faq['original_question']),
                'original_text': faq['original_question'],
                'faq_idx': faq_idx,
                'type': 'original'
            })
            
            # Add possible questions
            for possible_q in faq['possible_questions']:
                self.all_questions.append({
                    'text': self.preprocess_text(possible_q),
                    'original_text': possible_q,
                    'faq_idx': faq_idx,
                    'type': 'possible'
                })
        
        print(f"✅ Prepared {len(self.all_questions)} questions for matching")
    
    def get_word_vector(self, text: str) -> Counter:
        """Convert text to word frequency vector"""
        words = text.split()
        return Counter(words)
    
    def cosine_similarity(self, vec1: Counter, vec2: Counter) -> float:
        """Calculate cosine similarity between two word vectors"""
        # Get intersection of words
        intersection = set(vec1.keys()) & set(vec2.keys())
        
        if not intersection:
            return 0.0
        
        # Calculate dot product
        dot_product = sum(vec1[word] * vec2[word] for word in intersection)
        
        # Calculate magnitudes
        magnitude1 = math.sqrt(sum(count * count for count in vec1.values()))
        magnitude2 = math.sqrt(sum(count * count for count in vec2.values()))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def find_best_match(self, user_question: str, threshold: float = 0.1) -> Optional[Dict[str, Any]]:
        """Find the best matching FAQ for user question"""
        if not user_question.strip() or not self.all_questions:
            return None
        
        try:
            processed_user_question = self.preprocess_text(user_question)
            user_vector = self.get_word_vector(processed_user_question)
            
            best_similarity = 0.0
            best_match = None
            
            print(f"🔍 Searching for: '{user_question}'")
            print(f"🔍 Processed: '{processed_user_question}'")
            
            for question_data in self.all_questions:
                question_vector = self.get_word_vector(question_data['text'])
                similarity = self.cosine_similarity(user_vector, question_vector)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = question_data
            
            print(f"🎯 Best similarity: {best_similarity:.3f}")
            
            if best_similarity >= threshold and best_match:
                faq = self.faqs[best_match['faq_idx']]
                print(f"✅ Found match in category: {faq['category']}")
                
                return {
                    'faq': faq,
                    'confidence': best_similarity,
                    'matched_question': best_match['original_text']
                }
            else:
                print(f"❌ No match found (similarity: {best_similarity:.3f}, threshold: {threshold})")
                return None
                
        except Exception as e:
            print(f"❌ Error in find_best_match: {e}")
            return None

# Initialize the chatbot
chatbot = SimpleChatbot()

# Create FastAPI app
app = FastAPI(
    title="University FAQ Chatbot API",
    description="API for university FAQ chatbot system",
    version="1.0.0"
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
        "message": "University FAQ Chatbot API is running!",
        "total_faqs": len(chatbot.faqs),
        "total_questions": len(chatbot.all_questions),
        "status": "healthy"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint"""
    try:
        user_message = request.message.strip()
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        print(f"📨 Received: '{user_message}' from user: {request.user_id}")
        
        # Find best match
        match_result = chatbot.find_best_match(user_message, threshold=0.1)
        
        if match_result:
            faq = match_result['faq']
            return ChatResponse(
                response=faq['answer'],
                category=faq['category'],
                confidence=match_result['confidence'],
                matched_question=match_result['matched_question']
            )
        else:
            return ChatResponse(
                response="I'm sorry, I couldn't find a specific answer to your question. Could you please rephrase it or ask about admissions, academics, fees, scholarships, or examinations?",
                category="General",
                confidence=0.0,
                matched_question="No match found"
            )
    
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/categories")
async def get_categories():
    """Get all available categories"""
    try:
        categories = list(set(faq['category'] for faq in chatbot.faqs))
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "total_faqs": len(chatbot.faqs),
        "total_questions": len(chatbot.all_questions),
        "api_version": "1.0.0"
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
            "What is the fee structure?"
        ]
    }

@app.get("/debug/questions")
async def debug_questions():
    """Debug endpoint to see loaded questions"""
    sample_questions = []
    for i, q in enumerate(chatbot.all_questions[:10]):  # Show first 10
        sample_questions.append({
            "index": i,
            "text": q['text'],
            "original": q['original_text'],
            "category": chatbot.faqs[q['faq_idx']]['category'],
            "type": q['type']
        })
    
    return {
        "total_questions": len(chatbot.all_questions),
        "sample_questions": sample_questions
    }

if __name__ == "__main__":
    print("🚀 Starting University FAQ Chatbot API...")
    print("📚 Make sure your 'university_faq_chatbot.json' file is in the same directory")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    
if __name__ == "__main__":
    uvicorn.run("chatbot_api:app", host="0.0.0.0", port=8000, reload=True)