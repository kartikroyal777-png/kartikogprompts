const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "OGPrompts";

// Priority list of free models to try.
// UPDATED: Using amazon/nova-2-lite-v1:free as requested and removing invalid IDs
const MODELS = [
  "amazon/nova-2-lite-v1:free",                  // Requested Primary Model
  "google/gemini-2.0-flash-lite-preview-02-05:free", // Stable Backup
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
    You are an expert AI aesthetic consultant. Analyze this image with precision.
    
    Task: Provide a numerical analysis (0-100) of features.
    
    Evaluate:
    1. Facial Symmetry
    2. Canthal Tilt & Eyes
    3. Cheekbones
    4. Nose
    5. Jawline
    6. Skin Quality
    7. Outfit/Styling
    8. Overall Aura

    Provide:
    - "Toast": A short compliment.
    - "Roast": A short, playful critique.
    - "final_score": Weighted average (0-100).

    IMPORTANT: Return ONLY valid, raw JSON. No markdown formatting.
    
    JSON Structure:
    {
      "parameters": {
        "face": 0,
        "symmetry": 0,
        "canthal_tilt": 0,
        "cheekbones": 0,
        "nose": 0,
        "jawline": 0,
        "eyes": 0,
        "skin": 0,
        "outfit": 0,
        "overall": 0
      },
      "roast": "string",
      "toast": "string",
      "final_score": 0
    }
  `;

  let lastError: Error | null = null;

  // Try models in sequence until one works
  for (const model of MODELS) {
    try {
      // Add a small delay if retrying to avoid rate limits
      if (lastError) await new Promise(resolve => setTimeout(resolve, 1500));

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
                { "type": "text", "text": prompt },
                { "type": "image_url", "image_url": { "url": dataUrl } }
              ]
            }
          ],
          // Enabled reasoning as requested
          "reasoning": { "enabled": true },
          "temperature": 0.7,
          "top_p": 0.9,
          "response_format": { "type": "json_object" } // Hint for JSON mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        console.warn(`Model ${model} failed: ${errorMessage}`);

        // Specific handling for common errors
        if (errorMessage.includes("User not found") || response.status === 403) {
            lastError = new Error("AI Provider Error (Account). Retrying...");
            continue; 
        }

        if (response.status === 429 || response.status >= 500) {
            lastError = new Error("AI Service Busy. Retrying...");
            continue;
        }
        
        // If model ID is invalid (like the error you saw), try next model
        if (errorMessage.includes("not a valid model ID")) {
            console.warn("Invalid model ID, skipping...");
            continue;
        }
        
        throw new Error(errorMessage || `API Error: ${response.status}`);
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
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Basic validation
      if (!parsed.parameters || typeof parsed.final_score !== 'number') {
         throw new Error("Incomplete data received.");
      }

      return parsed;

    } catch (error: any) {
      console.error(`Analysis failed with ${model}:`, error);
      lastError = error;
      // Continue loop to try next model
    }
  }

  // If all models fail
  throw lastError || new Error("All AI models are currently busy. Please try again in a moment.");
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
