const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "OGPrompts";

// Priority list of free models to try.
// If one is rate-limited (429), we automatically try the next.
const MODELS = [
  "google/gemini-2.0-flash-lite-preview-02-05:free", // Often faster/more stable
  "google/gemini-2.0-flash-exp:free",                // High quality but often busy
  "google/gemini-2.0-pro-exp-02-05:free",            // Powerful fallback
  "google/gemini-1.5-flash:free",                    // Reliable fallback
  "google/gemini-1.5-pro:free"                       // Last resort
];

if (!OPENROUTER_API_KEY) {
  console.warn("Missing VITE_OPENROUTER_API_KEY in .env file");
}

export async function analyzeImage(file: File): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  // Convert file to Data URL
  const dataUrl = await fileToDataURL(file);

  const prompt = `
    You are an expert AI aesthetic consultant, plastic surgeon, and fashion stylist. 
    Analyze the visual aesthetics of this image with extreme precision.
    
    Task: Provide a detailed numerical analysis (0-100) of the subject's features.
    
    Evaluate these specific parameters:
    1. Facial Symmetry: Left/right face balance and proportion.
    2. Canthal Tilt & Eye Shape: Aesthetic appeal of the eye tilt (Positive/Neutral tilt preferred in aesthetics).
    3. Cheekbones: Definition, height, and structure.
    4. Nose Structure: Harmony with face, shape, and definition.
    5. Jawline Definition: Sharpness and angularity.
    6. Skin Quality: Texture, clarity, and radiance.
    7. Outfit & Styling: Fashion choice and fit.
    8. Overall Aura: Photogenic quality and vibe.

    Also provide:
    - A "Toast": A short, hype compliment about their best feature.
    - A "Roast": A lighthearted, funny, playful critique (nothing mean).

    Calculate a "final_score" (weighted average of all parameters) with 3 decimal places.

    IMPORTANT: Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
    JSON Structure:
    {
      "parameters": {
        "face": number,        // Overall Facial Harmony
        "symmetry": number,    // Specific Symmetry Score
        "canthal_tilt": number,// Eye Tilt Aesthetic Score
        "cheekbones": number,  // Cheekbone Structure Score
        "nose": number,        // Nose Harmony Score
        "jawline": number,
        "eyes": number,        // General Eye Appeal
        "skin": number,
        "outfit": number,
        "overall": number
      },
      "roast": "string",
      "toast": "string",
      "final_score": number
    }
  `;

  let lastError: Error | null = null;

  // Try models in sequence until one works
  for (const model of MODELS) {
    try {
      console.log(`Attempting analysis with model: ${model}`);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": model,
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": prompt
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": dataUrl
                  }
                }
              ]
            }
          ]
        })
      });

      // Handle Rate Limits (429) or Server Errors (5xx) by trying next model
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429 || response.status >= 500) {
            console.warn(`Model ${model} failed (Status ${response.status}):`, errorData);
            lastError = new Error(errorData.error?.message || `Rate limited on ${model}`);
            continue; // Try next model
        }
        
        // Fatal errors (400, 401) should stop immediately
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) throw new Error("No content received from AI");

      // Robust JSON extraction
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Invalid JSON response:", content);
        throw new Error("AI returned invalid format. Retrying...");
      }
      
      return JSON.parse(jsonMatch[0]);

    } catch (error: any) {
      console.error(`Analysis failed with ${model}:`, error);
      lastError = error;
      // Continue loop to try next model
    }
  }

  // If all models fail
  throw lastError || new Error("All AI models are currently busy. Please try again in a few moments.");
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
