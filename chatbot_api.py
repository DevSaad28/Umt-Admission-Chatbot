import json
import re
import string
import os
import time
import hashlib
from difflib import get_close_matches
from collections import defaultdict, Counter
import math
from typing import List, Dict, Any, Optional, Tuple
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from functools import lru_cache
import asyncio

# Enhanced imports with better error handling
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    from nltk.stem import WordNetLemmatizer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    
    # Download required NLTK data silently
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
        nltk.data.find('corpora/wordnet')
    except LookupError:
        print("📥 Downloading NLTK data...")
        nltk.download('punkt_tab', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
    
    ADVANCED_NLP_AVAILABLE = True
    print("✅ Advanced NLP libraries loaded successfully")
except ImportError as e:
    print(f"⚠️ Advanced NLP libraries not available: {e}")
    print("🔄 Falling back to enhanced basic similarity matching")
    ADVANCED_NLP_AVAILABLE = False

# Enhanced Pydantic models
class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"
    context: Optional[str] = None
    language: str = "auto"

class ChatResponse(BaseModel):
    response: str
    category: str
    confidence: float
    matched_question: str
    suggestions: List[str] = []
    processing_time: float = 0.0
    query_type: str = "normal"  # short, normal, complex

class EnhancedUniversityFAQChatbot:
    def __init__(self, faq_data_path="university_faq_chatbot.json"):
        """Initialize enhanced chatbot optimized for vast datasets and short queries."""
        
        print("🚀 Initializing Enhanced University FAQ Chatbot...")
        
        # Performance tracking
        self.query_count = 0
        self.short_query_count = 0
        self.cache_hits = 0
        
        # Load and process FAQ data
        self.load_faq_data_optimized(faq_data_path)
        
        # Initialize NLP components
        if ADVANCED_NLP_AVAILABLE:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
            # Add Roman Urdu stop words
            self.roman_urdu_stop_words = {
                'ka', 'ke', 'ki', 'ko', 'se', 'me', 'par', 'aur', 'ya', 'hai', 'hain',
                'tha', 'thi', 'the', 'ho', 'hoga', 'hogi', 'kya', 'kaise', 'kab', 'kahan'
            }
        
        # Build enhanced indices for fast lookups
        self.build_enhanced_indices()
        
        # Initialize optimized TF-IDF
        if ADVANCED_NLP_AVAILABLE and len(self.faqs_list) > 0:
            self.initialize_tfidf_optimized()
        
        # Enhanced keyword mapping for short queries
        self.build_keyword_mapping()
        
        # Category-based quick lookup
        self.build_category_lookup()
        
        # Conversation contexts per user
        self.user_contexts = {}
        
        print(f"✅ Chatbot initialized with {len(self.faqs_list)} FAQs")
        print(f"📊 Categories: {len(self.category_index)}")
        print(f"🔑 Keywords mapped: {len(self.keyword_to_faqs)}")

    def load_faq_data_optimized(self, faq_data_path):
        """Load FAQ data with memory optimization."""
        print(f"📂 Loading FAQ data from: {faq_data_path}")
        
        try:
            # Check file size for optimization strategy
            if os.path.exists(faq_data_path):
                file_size = os.path.getsize(faq_data_path) / (1024 * 1024)  # MB
                print(f"📊 File size: {file_size:.2f} MB")
            
            with open(faq_data_path, 'r', encoding='utf-8') as file:
                self.faq_data = json.load(file)
                
        except UnicodeDecodeError:
            try:
                with open(faq_data_path, 'r', encoding='latin-1') as file:
                    self.faq_data = json.load(file)
            except Exception as e:
                print(f"❌ Error loading FAQ data: {e}")
                self.load_comprehensive_sample_data()
                return
        except FileNotFoundError:
            print(f"❌ Error: {faq_data_path} not found!")
            self.load_comprehensive_sample_data()
            return
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON: {e}")
            self.load_comprehensive_sample_data()
            return
        
        # Validate data structure
        if not isinstance(self.faq_data, dict) or 'faqs' not in self.faq_data:
            print("❌ Invalid FAQ data structure")
            self.load_comprehensive_sample_data()
            return
            
        print(f"✅ Successfully loaded {len(self.faq_data['faqs'])} FAQs")

    def load_comprehensive_sample_data(self):
        """Load comprehensive sample data for testing."""
        print("🔄 Loading comprehensive sample data...")
        self.faq_data = {
            "faqs": [
                {
                    "category": "Transport",
                    "original_question": "Does UMT provide transportation services?",
                    "answer": "Yes! UMT offers comprehensive transportation services: 🚌 Route Coverage: 25+ routes covering all major areas of Lahore, Regular service from morning till evening, 💰 Transport Fees: Monthly passes available (Rs. 8,000-12,000), Semester packages with discounts, 🕐 Timings: Multiple trips throughout the day, First pickup around 7:00 AM, last drop around 8:00 PM, 🎫 Access: Use student ID card for boarding, Real-time tracking through mobile app, 🛡️ Safety: Professional drivers, well-maintained vehicles, GPS tracking, insurance coverage. Route details: https://www.umt.edu.pk/ocms/Transport/Routes.aspx",
                    "possible_questions": [
                        "transport",
                        "bus",
                        "shuttle",
                        "UMT transport service",
                        "Bus facility UMT",
                        "Transportation UMT",
                        "UMT ki bus service hai?",
                        "Campus shuttle",
                        "Student transport",
                        "bus routes",
                        "transport fee",
                        "shuttle timings"
                    ]
                },
                {
                    "category": "Facilities",
                    "original_question": "What facilities are available on UMT campus?",
                    "answer": "UMT offers world-class campus facilities: 🏛️ Academic: Modern classrooms, advanced laboratories, well-equipped libraries, research centers, 🍽️ Dining: Multiple cafeterias, food courts, international cuisine options, healthy meal plans, 🏃‍♂️ Recreation: Sports complex, gymnasium, swimming pool, tennis courts, cricket ground, 🏠 Accommodation: Separate hostels for male/female students, furnished rooms, 24/7 security, 🚌 Transport: Shuttle service covering Lahore, safe and reliable transportation, 🏥 Health: Medical center, counseling services, pharmacy. Virtual tour: https://www.umt.edu.pk/About-UMT/Campus-Facilities.aspx",
                    "possible_questions": [
                        "facilities",
                        "campus",
                        "amenities",
                        "UMT campus facilities",
                        "University amenities",
                        "Campus life UMT",
                        "UMT ki facilities kya hain?",
                        "Student services UMT",
                        "Campus infrastructure",
                        "library",
                        "gym",
                        "sports"
                    ]
                },
                {
                    "category": "Admissions",
                    "original_question": "What are the admission requirements for undergraduate programs at UMT?",
                    "answer": "For undergraduate admission at UMT, you need: 📋 Academic Requirements: Minimum 50% marks in FSc, ICS, or Intermediate with Physics, No third division in matriculation, 📝 Test Requirements: Minimum 50% marks in UMT entrance test, 💰 Financial: Application fee Rs. 2,000, 📄 Required Documents: Matric & Intermediate certificates, CNIC copies, photographs, domicile (for specific programs). Merit calculation: 20% Matric + 50% Intermediate + 30% Entrance Test. Apply online at https://onlineadmissions.umt.edu.pk/",
                    "possible_questions": [
                        "admission",
                        "apply",
                        "requirements",
                        "Undergraduate admission requirements UMT",
                        "BS program admission criteria",
                        "UMT mein admission kaise le?",
                        "Undergraduate ke liye kya chahiye?",
                        "Bachelor degree admission process",
                        "UMT admission requirements kya hain?",
                        "entry test",
                        "merit"
                    ]
                },
                {
                    "category": "Hostel",
                    "original_question": "Does UMT provide hostel accommodation for students?",
                    "answer": "Yes! UMT offers excellent hostel facilities: 🏠 Accommodation Types: Single, double, and triple occupancy rooms, Separate hostels for male and female students, 💰 Hostel Fees: Varies by room type (Rs. 15,000-25,000/month), Includes utilities, security, and basic amenities, 🛏️ Room Features: Furnished rooms, study tables, wardrobes, attached bathrooms (in premium rooms), 🍽️ Dining: Hostel mess with affordable meal plans, Common kitchen facilities available, 🔒 Security: 24/7 security guards, CCTV surveillance, secure entry/exit, 📋 Application: Apply through Student Portal, First-come-first-served basis. Contact: hostel@umt.edu.pk",
                    "possible_questions": [
                        "hostel",
                        "accommodation",
                        "housing",
                        "UMT hostel accommodation",
                        "Student housing UMT",
                        "Hostel fees UMT",
                        "UMT mein hostel hai?",
                        "Accommodation facilities",
                        "Dormitory UMT",
                        "rooms",
                        "boarding"
                    ]
                },
                {
                    "category": "Cafeteria",
                    "original_question": "What food options are available on UMT campus?",
                    "answer": "UMT offers diverse dining options across campus: 🍽️ Main Cafeteria: Pakistani traditional cuisine, International dishes, Fresh salads and healthy options, 🍕 Food Courts: Pizza, burgers, sandwiches, Chinese cuisine, Italian pasta, 🥤 Beverage Stations: Fresh juices, coffee, tea, soft drinks, energy drinks, 🍰 Bakery Items: Fresh bread, cakes, pastries, cookies, snacks, 💰 Pricing: Student-friendly rates, Meal combos and packages, Daily specials and discounts, 🕐 Timings: 8:00 AM to 8:00 PM, Extended hours during exams, 🏥 Hygiene: Regular health inspections, Fresh ingredients, trained staff",
                    "possible_questions": [
                        "cafeteria",
                        "food",
                        "canteen",
                        "UMT cafeteria food",
                        "Campus dining options",
                        "Food court UMT",
                        "UMT mein khana kya hai?",
                        "Canteen facilities",
                        "Meal options UMT",
                        "restaurant",
                        "dining"
                    ]
                }
            ]
        }

    def build_enhanced_indices(self):
        """Build comprehensive indices for fast lookups."""
        print("🔨 Building enhanced indices...")
        
        self.faqs_list = []
        self.questions_text = []
        self.answers_text = []
        self.categories = []
        self.category_index = defaultdict(list)
        
        # Process FAQs and build indices
        for i, faq in enumerate(self.faq_data["faqs"]):
            self.faqs_list.append(faq)
            
            # Combine all question variants
            all_questions = [faq["original_question"]] + faq.get("possible_questions", [])
            combined_questions = " ".join(all_questions)
            
            processed_text = self.preprocess_text_advanced(combined_questions)
            self.questions_text.append(processed_text)
            self.answers_text.append(self.preprocess_text_advanced(faq["answer"]))
            self.categories.append(faq["category"])
            
            # Build category index
            self.category_index[faq["category"]].append(i)
        
        print(f"✅ Built indices for {len(self.faqs_list)} FAQs")

    def build_keyword_mapping(self):
        """Build enhanced keyword mapping for short queries."""
        print("🔑 Building keyword mapping for short queries...")
        
        self.keyword_to_faqs = defaultdict(list)
        self.exact_keyword_matches = {}
        
        # Enhanced keyword categories
        keyword_categories = {
            'transport': ['transport', 'bus', 'shuttle', 'vehicle', 'route', 'pickup', 'drop'],
            'hostel': ['hostel', 'accommodation', 'housing', 'room', 'dormitory', 'boarding'],
            'cafeteria': ['cafeteria', 'food', 'canteen', 'dining', 'meal', 'restaurant', 'cafe'],
            'admission': ['admission', 'apply', 'application', 'entry', 'enroll', 'join'],
            'fee': ['fee', 'cost', 'payment', 'money', 'price', 'expense', 'charges'],
            'scholarship': ['scholarship', 'financial aid', 'discount', 'waiver', 'grant'],
            'exam': ['exam', 'test', 'examination', 'assessment', 'quiz', 'evaluation'],
            'library': ['library', 'book', 'study', 'reading', 'research'],
            'sports': ['sports', 'gym', 'gymnasium', 'fitness', 'exercise', 'games'],
            'faculty': ['faculty', 'teacher', 'professor', 'instructor', 'staff'],
            'course': ['course', 'subject', 'class', 'program', 'curriculum'],
            'result': ['result', 'grade', 'marks', 'score', 'gpa', 'cgpa']
        }
        
        # Map keywords to FAQs
        for i, faq in enumerate(self.faqs_list):
            category = faq["category"].lower()
            
            # Get all text for this FAQ
            all_text = f"{faq['original_question']} {faq['answer']} {' '.join(faq.get('possible_questions', []))}"
            all_text_lower = all_text.lower()
            
            # Map category keywords
            for cat_key, keywords in keyword_categories.items():
                if any(keyword in all_text_lower for keyword in keywords):
                    for keyword in keywords:
                        self.keyword_to_faqs[keyword].append((i, faq, 1.0))
            
            # Map exact possible questions (for short queries)
            for possible_q in faq.get("possible_questions", []):
                if len(possible_q.strip().split()) <= 3:  # Short queries
                    key = possible_q.lower().strip()
                    self.exact_keyword_matches[key] = (i, faq, 1.0)
            
            # Extract and map important words from questions
            words = self.extract_important_words(all_text)
            for word in words:
                if len(word) > 2:
                    self.keyword_to_faqs[word].append((i, faq, 0.8))
        
        print(f"✅ Mapped {len(self.keyword_to_faqs)} keywords to FAQs")
        print(f"🎯 Exact matches: {len(self.exact_keyword_matches)}")

    def build_category_lookup(self):
        """Build category-based quick lookup."""
        self.category_keywords = {}
        
        for category, faq_indices in self.category_index.items():
            keywords = set()
            for idx in faq_indices:
                faq = self.faqs_list[idx]
                # Extract keywords from category name and FAQ content
                cat_words = category.lower().split()
                keywords.update(cat_words)
                
                # Add important words from questions
                all_questions = [faq["original_question"]] + faq.get("possible_questions", [])
                for question in all_questions:
                    words = self.extract_important_words(question)
                    keywords.update(words[:5])  # Top 5 words per question
            
            self.category_keywords[category] = list(keywords)

    @lru_cache(maxsize=2000)
    def preprocess_text_advanced(self, text):
        """Enhanced cached text preprocessing."""
        if not text:
            return ""
        
        # Convert to lowercase and clean
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s\-\?\!]', ' ', text)
        
        if ADVANCED_NLP_AVAILABLE:
            try:
                word_tokens = word_tokenize(text)
                important_words = ['what', 'how', 'when', 'where', 'why', 'who', 'which']
                filtered_words = []
                
                for w in word_tokens:
                    if (w not in self.stop_words and w not in self.roman_urdu_stop_words) or w in important_words:
                        if len(w) > 1:
                            lemmatized = self.lemmatizer.lemmatize(w)
                            filtered_words.append(lemmatized)
                
                return ' '.join(filtered_words)
            except Exception:
                pass
        
        # Basic preprocessing fallback
        words = text.split()
        filtered_words = [w for w in words if len(w) > 1]
        return ' '.join(filtered_words)

    def extract_important_words(self, text):
        """Extract important words from text."""
        processed = self.preprocess_text_advanced(text)
        words = processed.split()
        
        # University-specific important words
        important_patterns = [
            'admission', 'fee', 'scholarship', 'exam', 'test', 'course', 'program',
            'degree', 'semester', 'credit', 'gpa', 'transcript', 'application',
            'requirement', 'deadline', 'registration', 'enrollment', 'faculty',
            'department', 'campus', 'library', 'hostel', 'accommodation', 'transport',
            'cafeteria', 'food', 'sports', 'gym', 'result', 'grade'
        ]
        
        important_words = []
        for word in words:
            if len(word) > 2 and (word in important_patterns or word.isalpha()):
                important_words.append(word)
        
        return important_words[:10]  # Return top 10 important words

    def initialize_tfidf_optimized(self):
        """Initialize optimized TF-IDF for large datasets."""
        print("🧠 Initializing optimized TF-IDF...")
        
        try:
            # Optimize for large datasets
            max_features = min(3000, len(self.faqs_list) * 3)
            
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=max_features,
                stop_words='english',
                ngram_range=(1, 2),
                lowercase=True,
                max_df=0.9,
                min_df=1,
                dtype=np.float32
            )
            
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.questions_text)
            print(f"✅ TF-IDF matrix shape: {self.tfidf_matrix.shape}")
            
        except Exception as e:
            print(f"❌ Error initializing TF-IDF: {e}")
            self.tfidf_vectorizer = None
            self.tfidf_matrix = None

    def detect_query_type(self, query):
        """Detect if query is short, normal, or complex."""
        words = query.strip().split()
        word_count = len(words)
        
        if word_count <= 2:
            return "short"
        elif word_count <= 6:
            return "normal"
        else:
            return "complex"

    def handle_short_query(self, query):
        """Specialized handling for short queries like 'transport', 'hostel'."""
        query_lower = query.lower().strip()
        
        # Check exact matches first
        if query_lower in self.exact_keyword_matches:
            idx, faq, confidence = self.exact_keyword_matches[query_lower]
            return faq, confidence, "exact_match"
        
        # Check keyword mapping
        if query_lower in self.keyword_to_faqs:
            matches = self.keyword_to_faqs[query_lower]
            if matches:
                # Sort by confidence and return best match
                matches.sort(key=lambda x: x[2], reverse=True)
                idx, faq, confidence = matches[0]
                return faq, confidence, "keyword_match"
        
        # Partial keyword matching
        best_matches = []
        for keyword, faq_matches in self.keyword_to_faqs.items():
            if query_lower in keyword or keyword in query_lower:
                for idx, faq, confidence in faq_matches:
                    similarity = self.calculate_string_similarity(query_lower, keyword)
                    adjusted_confidence = confidence * similarity
                    best_matches.append((faq, adjusted_confidence, "partial_match"))
        
        if best_matches:
            best_matches.sort(key=lambda x: x[1], reverse=True)
            return best_matches[0]
        
        return None, 0.0, "no_match"

    def calculate_string_similarity(self, str1, str2):
        """Calculate simple string similarity."""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, str1, str2).ratio()

    @lru_cache(maxsize=1000)
    def calculate_semantic_similarity_cached(self, query_hash, query):
        """Cached semantic similarity calculation."""
        if not ADVANCED_NLP_AVAILABLE or self.tfidf_vectorizer is None:
            return [0.0] * len(self.faqs_list)
        
        try:
            processed_query = self.preprocess_text_advanced(query)
            query_vector = self.tfidf_vectorizer.transform([processed_query])
            similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            return similarities.tolist()
        except Exception as e:
            print(f"⚠️ Error in semantic similarity: {e}")
            return [0.0] * len(self.faqs_list)

    def find_best_match_enhanced(self, user_query):
        """Enhanced matching with query type detection."""
        start_time = time.time()
        self.query_count += 1
        
        query_type = self.detect_query_type(user_query)
        
        # Handle short queries specially
        if query_type == "short":
            self.short_query_count += 1
            best_match, confidence, match_type = self.handle_short_query(user_query)
            
            if best_match and confidence > 0.5:
                processing_time = time.time() - start_time
                return best_match, confidence, query_type, processing_time
        
        # Regular comprehensive matching for normal/complex queries
        query_hash = hashlib.md5(user_query.encode()).hexdigest()
        semantic_scores = self.calculate_semantic_similarity_cached(query_hash, user_query)
        
        # Calculate scores for all FAQs
        scored_faqs = []
        
        for i, faq in enumerate(self.faqs_list):
            # Combine all question texts
            all_questions = [faq["original_question"]] + faq.get("possible_questions", [])
            combined_text = " ".join(all_questions)
            
            # Calculate different similarity scores
            semantic_score = semantic_scores[i] if i < len(semantic_scores) else 0.0
            fuzzy_score = self.fuzzy_match_score_fast(user_query, combined_text)
            keyword_score = self.keyword_overlap_score_fast(user_query, combined_text)
            category_score = self.category_match_score(user_query, faq["category"])
            
            # Adjust weights based on query type
            if query_type == "short":
                weights = [0.2, 0.3, 0.4, 0.1]  # Favor keyword and fuzzy for short queries
            elif query_type == "normal":
                weights = [0.4, 0.25, 0.25, 0.1]  # Balanced approach
            else:  # complex
                weights = [0.5, 0.2, 0.2, 0.1]  # Favor semantic for complex queries
            
            final_score = (
                semantic_score * weights[0] +
                fuzzy_score * weights[1] +
                keyword_score * weights[2] +
                category_score * weights[3]
            )
            
            scored_faqs.append((faq, final_score, i))
        
        # Sort by score
        scored_faqs.sort(key=lambda x: x[1], reverse=True)
        
        processing_time = time.time() - start_time
        
        if scored_faqs and scored_faqs[0][1] > 0.1:
            return scored_faqs[0][0], scored_faqs[0][1], query_type, processing_time
        
        return None, 0.0, query_type, processing_time

    def fuzzy_match_score_fast(self, user_query, faq_text):
        """Fast fuzzy matching."""
        user_words = set(user_query.lower().split())
        faq_words = set(faq_text.lower().split())
        
        if not user_words or not faq_words:
            return 0.0
        
        intersection = user_words.intersection(faq_words)
        union = user_words.union(faq_words)
        
        return len(intersection) / len(union) if union else 0.0

    def keyword_overlap_score_fast(self, user_query, faq_text):
        """Fast keyword overlap calculation."""
        user_processed = self.preprocess_text_advanced(user_query)
        faq_processed = self.preprocess_text_advanced(faq_text)
        
        user_words = set(user_processed.split())
        faq_words = set(faq_processed.split())
        
        if not user_words or not faq_words:
            return 0.0
        
        intersection = user_words.intersection(faq_words)
        return len(intersection) / len(user_words) if user_words else 0.0

    def category_match_score(self, user_query, category):
        """Calculate category matching score."""
        query_lower = user_query.lower()
        category_lower = category.lower()
        
        # Direct category name match
        if category_lower in query_lower or any(word in query_lower for word in category_lower.split()):
            return 1.0
        
        # Category keyword match
        if category in self.category_keywords:
            category_words = self.category_keywords[category]
            query_words = query_lower.split()
            
            matches = sum(1 for word in query_words if word in category_words)
            return matches / len(query_words) if query_words else 0.0
        
        return 0.0

    def generate_suggestions(self, user_query, current_category=None):
        """Generate helpful suggestions based on query."""
        suggestions = []
        
        # If we have a current category, suggest related questions
        if current_category and current_category in self.category_index:
            related_faqs = [self.faqs_list[i] for i in self.category_index[current_category][:3]]
            for faq in related_faqs:
                suggestions.append(faq["original_question"])
        
        # Add popular short queries
        popular_queries = [
            "What is the admission process?",
            "How much are the fees?",
            "Are scholarships available?",
            "What facilities are on campus?",
            "How do I apply for hostel?"
        ]
        
        # Add suggestions that don't duplicate current category
        for query in popular_queries:
            if len(suggestions) < 5:
                suggestions.append(query)
        
        return suggestions[:5]

    async def get_response_async(self, user_input, user_id="default", context=None):
        """Async response generation with enhanced matching."""
        start_time = time.time()
        
        if not user_input.strip():
            return {
                'response': "I'm here to help! Please ask me anything about UMT.",
                'category': 'General',
                'confidence': 1.0,
                'matched_question': 'Empty input',
                'suggestions': self.generate_suggestions(""),
                'processing_time': time.time() - start_time,
                'query_type': 'empty'
            }
        
        # Check for general conversation
        if self.is_general_conversation(user_input):
            response_text = self.generate_contextual_response(user_input)
            return {
                'response': response_text,
                'category': 'General',
                'confidence': 1.0,
                'matched_question': 'General conversation',
                'suggestions': self.generate_suggestions(user_input),
                'processing_time': time.time() - start_time,
                'query_type': 'general'
            }
        
        # Find best match using enhanced algorithm
        best_match, confidence, query_type, match_time = self.find_best_match_enhanced(user_input)
        
        if best_match and confidence > 0.3:
            response_text = best_match["answer"]
            category = best_match["category"]
            matched_question = best_match["original_question"]
            
        elif best_match and confidence > 0.15:
            response_text = (f"I think you're asking about {best_match['category'].lower()}. "
                           f"Here's what I found:\n\n{best_match['answer']}\n\n"
                           f"Is this what you were looking for?")
            category = best_match["category"]
            matched_question = best_match["original_question"]
            
        else:
            response_text = self.handle_no_match_enhanced(user_input)
            category = "General"
            matched_question = "No specific match"
            confidence = 0.0
        
        suggestions = self.generate_suggestions(user_input, category if best_match else None)
        
        return {
            'response': response_text,
            'category': category,
            'confidence': confidence,
            'matched_question': matched_question,
            'suggestions': suggestions,
            'processing_time': time.time() - start_time,
            'query_type': query_type
        }

    def is_general_conversation(self, user_input):
        """Enhanced general conversation detection."""
        user_lower = user_input.lower().strip()
        
        # Greeting patterns
        greetings = [
            "hi", "hello", "hey", "greetings", "good morning", "good afternoon", 
            "good evening", "salam", "assalam", "namaste"
        ]
        
        if any(greeting in user_lower for greeting in greetings):
            return True
        
        # General conversation patterns
        general_patterns = [
            "how are you", "what's up", "tell me about yourself", "who are you",
            "what can you do", "help me", "thanks", "thank you", "goodbye", "bye"
        ]
        
        return any(pattern in user_lower for pattern in general_patterns)

    def generate_contextual_response(self, user_input):
        """Generate contextual responses."""
        user_lower = user_input.lower().strip()
        
        if any(greeting in user_lower for greeting in ["hi", "hello", "hey", "salam"]):
            return ("Hello! I'm your UMT assistant. I can help you with information about "
                   "admissions, academics, fees, scholarships, campus facilities, and more. "
                   "You can ask short questions like 'transport', 'hostel', or 'cafeteria' "
                   "for quick answers. What would you like to know?")
        
        if "what can you do" in user_lower:
            return ("I can help you with:\n\n"
                   "🎓 Admissions & Applications\n"
                   "💰 Fees & Scholarships\n"
                   "🏢 Campus Facilities\n"
                   "🚌 Transport Services\n"
                   "🏠 Hostel Accommodation\n"
                   "🍽️ Cafeteria & Dining\n"
                   "📚 Academic Information\n\n"
                   "Try asking short questions like 'transport' or 'hostel' for quick answers!")
        
        return ("I'm here to help with UMT-related questions. You can ask about any university "
               "service or use short keywords like 'transport', 'fees', or 'admission' for quick answers.")

    def handle_no_match_enhanced(self, user_input):
        """Enhanced no-match handling with better suggestions."""
        key_concepts = self.extract_important_words(user_input)
        
        response = "I'd like to help you, but I need a bit more information. "
        
        if key_concepts:
            response += f"I noticed you mentioned: {', '.join(key_concepts[:3])}. "
        
        response += ("Try asking more specific questions or use keywords like:\n"
                    "• 'transport' for bus services\n"
                    "• 'hostel' for accommodation\n"
                    "• 'cafeteria' for dining options\n"
                    "• 'admission' for application process\n"
                    "• 'fees' for cost information\n\n"
                    "What specific aspect would you like to know about?")
        
        return response

    def get_performance_stats(self):
        """Get detailed performance statistics."""
        return {
            'total_queries': self.query_count,
            'short_queries': self.short_query_count,
            'short_query_percentage': f"{(self.short_query_count/self.query_count*100):.1f}%" if self.query_count > 0 else "0%",
            'total_faqs': len(self.faqs_list),
            'categories': len(self.category_index),
            'keywords_mapped': len(self.keyword_to_faqs),
            'exact_matches': len(self.exact_keyword_matches),
            'advanced_nlp': ADVANCED_NLP_AVAILABLE
        }

# Initialize the enhanced chatbot
print("🚀 Initializing Enhanced University FAQ Chatbot...")
chatbot = EnhancedUniversityFAQChatbot()

# Create FastAPI app
app = FastAPI(
    title="Enhanced University FAQ Chatbot API",
    description="High-performance API optimized for vast datasets and short query matching",
    version="4.0.0"
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
        "message": "Enhanced University FAQ Chatbot API is running!",
        "total_faqs": len(chatbot.faqs_list),
        "advanced_nlp": ADVANCED_NLP_AVAILABLE,
        "status": "healthy",
        "version": "4.0.0",
        "features": [
            "Vast dataset support",
            "Optimized short query matching",
            "Enhanced keyword mapping",
            "Multi-language support",
            "Real-time suggestions",
            "Performance analytics"
        ]
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Enhanced chat endpoint with optimized short query handling"""
    try:
        user_message = request.message.strip()
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get async response
        result = await chatbot.get_response_async(
            user_message, 
            request.user_id, 
            request.context
        )
        
        return ChatResponse(
            response=result['response'],
            category=result['category'],
            confidence=result['confidence'],
            matched_question=result['matched_question'],
            suggestions=result['suggestions'],
            processing_time=result['processing_time'],
            query_type=result['query_type']
        )
    
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/keywords")
async def get_keywords():
    """Get available keywords for short queries"""
    return {
        "exact_matches": list(chatbot.exact_keyword_matches.keys()),
        "keyword_categories": list(chatbot.keyword_to_faqs.keys())[:50],  # Top 50
        "total_keywords": len(chatbot.keyword_to_faqs)
    }

@app.get("/categories")
async def get_categories():
    """Get all categories with FAQ counts"""
    category_stats = {}
    for category, indices in chatbot.category_index.items():
        category_stats[category] = len(indices)
    
    return {
        "categories": list(chatbot.category_index.keys()),
        "category_stats": category_stats,
        "total_categories": len(chatbot.category_index)
    }

@app.get("/stats")
async def get_performance_stats():
    """Get detailed performance statistics"""
    return chatbot.get_performance_stats()

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    return {
        "status": "healthy",
        "total_faqs": len(chatbot.faqs_list),
        "advanced_nlp": ADVANCED_NLP_AVAILABLE,
        "api_version": "4.0.0",
        "performance": chatbot.get_performance_stats()
    }

@app.get("/test-short-queries")
async def test_short_queries():
    """Test endpoint for short queries"""
    test_queries = [
        "transport", "bus", "shuttle",
        "hostel", "accommodation", "rooms",
        "cafeteria", "food", "dining",
        "admission", "apply", "requirements",
        "fees", "cost", "payment",
        "library", "books", "study",
        "sports", "gym", "fitness"
    ]
    
    results = []
    for query in test_queries:
        result = await chatbot.get_response_async(query)
        results.append({
            "query": query,
            "category": result['category'],
            "confidence": result['confidence'],
            "query_type": result['query_type']
        })
    
    return {"test_results": results}

if __name__ == "__main__":
    print("🚀 Starting Enhanced University FAQ Chatbot API...")
    print("📚 Optimized for vast datasets and short query matching")
    print("🔍 Enhanced keyword mapping for instant responses")
    print("⚡ High-performance async processing")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print(f"🧠 Advanced NLP: {'Enabled' if ADVANCED_NLP_AVAILABLE else 'Enhanced Basic Mode'}")
    
    uvicorn.run("chatbot_api:app", host="0.0.0.0", port=8000, reload=True)
