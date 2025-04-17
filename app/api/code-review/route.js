import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log(process.env.GEMINI_API_KEY);

// Language detection function
async function detectLanguage(code) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `Analyze the following code snippet and identify the programming language. 
  Only respond with the name of the language in lowercase (e.g., javascript, python, java, etc.). 
  If uncertain, respond with "unknown".
  
  Code:
  \`\`\`
  ${code.slice(0, 1000)} // Only use first 1000 chars for detection
  \`\`\``;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const detectedLanguage = response.text().trim().toLowerCase();
  
  return detectedLanguage;
}

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: "No code provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Auto-detect the language
    const language = await detectLanguage(code);
    
    // Create prompt for code review
    const prompt = `You are an expert code reviewer specializing in ${language !== "unknown" ? language : "programming"}. 
    Review the following code for:
    1. Bugs or potential errors
    2. Performance optimizations
    3. Security vulnerabilities 
    4. Code style and best practices
    5. Suggestions for improvement

    Format your review with clear headings and include code examples where appropriate.
    If you're suggesting changes, show both the original code and your improved version.
    Make review as concise as possible while still being thorough.
    
    Here's the code to review:
    
    \`\`\`${language !== "unknown" ? language : ""}
    ${code}
    \`\`\``;

    // Get the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return new Response(JSON.stringify({ 
      review: text,
      detectedLanguage: language
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Code review error:", error);
    return new Response(JSON.stringify({ error: "Failed to review code" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}