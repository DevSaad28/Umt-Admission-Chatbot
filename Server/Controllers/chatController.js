const Chat = require("../Models/message");

class ChatController {
  // Handle chat message and store in database
  async sendChat(req, res) {
    try {
      const { message, user_id } = req.body;

      // Validation
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      // TODO: Replace with your actual AI API endpoint
      // For now, I'm creating a mock response based on your example
      let aiResponse = {
        response:
          "I think you're asking about general. Here's what I found:\n\nSure, Ask whatever you want to know about Admissions!\n\nIs this what you were looking for? If not, could you please rephrase your question?",
        category: "General",
        confidence: 0.2985874978963504,
        matched_question:
          "Can you give me some information regarding Admission",
      };

      // If you have an actual AI API, uncomment and modify this:
      /*
      try {
        const aiApiResponse = await axios.post('YOUR_AI_API_ENDPOINT', {
          message: message,
          user_id: user_id
        });
        aiResponse = aiApiResponse.data;
      } catch (aiError) {
        console.error('AI API Error:', aiError);
        aiResponse = {
          response: "Sorry, I'm having trouble processing your request. Please try again later.",
          category: "Error",
          confidence: 0,
          matched_question: ""
        };
      }
      */

      const chatRecord = new Chat({
        user_id,
        user_message: message.trim(),
        ai_response: aiResponse.response,
        category: aiResponse.category || "General",
        confidence: aiResponse.confidence || 0,
        matched_question: aiResponse.matched_question || "",
      });

      const savedChat = await chatRecord.save();

      // Return response in the format expected by your frontend
      res.json({
        success: true,
        response: aiResponse.response,
        category: aiResponse.category,
        confidence: aiResponse.confidence,
        matched_question: aiResponse.matched_question,
        chat_id: savedChat._id,
        timestamp: savedChat.timestamp,
      });
    } catch (error) {
      console.error("Chat Controller Error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to process chat message",
      });
    }
  }

  // Get chat history for a user
  async getChatHistory(req, res) {
    try {
      const { user_id } = req.params;
      const { limit = 50, page = 1 } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const chats = await Chat.find({ user_id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v -ip_address -user_agent");

      const totalChats = await Chat.countDocuments({ user_id });

      res.json({
        success: true,
        data: chats,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalChats / parseInt(limit)),
          total_chats: totalChats,
          has_more: skip + chats.length < totalChats,
        },
      });
    } catch (error) {
      console.error("Get Chat History Error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve chat history",
      });
    }
  }
}

module.exports = new ChatController();
