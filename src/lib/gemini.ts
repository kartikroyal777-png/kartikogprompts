import { supabase } from './supabase';

const ENV_API_KEYS = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "OGPrompts";

// Primary Model
const MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",         // Primary
  "amazon/nova-lite-v1:free",                    // Backup 1
  "google/gemini-2.0-flash-lite-preview-02-05:free", // Backup 2
];

let cachedKeys: string[] = [];
let lastKeyFetch = 0;
let currentKeyIndex = 0;

/**
 * Fetches available API keys from Env and Database
 */
async function getKeys(): Promise<string[]> {
  const now = Date.now();
  if (cachedKeys.length > 0 && now - lastKeyFetch < 60000) {
    return cachedKeys;
  }

  const keys: string[] = [];

  if (ENV_API_KEYS) {
    const envKeys = ENV_API_KEYS.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    keys.push(...envKeys);
  }

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('is_active', true);
    
    if (!error && data) {
      const dbKeys = data.map(k => k.key_value).filter(k => k && k.length > 0);
      keys.push(...dbKeys);
    }
  } catch (err) {
    console.warn("Failed to fetch dynamic keys:", err);
  }

  cachedKeys = [...new Set(keys)];
  lastKeyFetch = now;
  
  if (cachedKeys.length === 0) {
    console.warn("No API Keys found!");
  }

  return cachedKeys;
}

async function rotateKey(): Promise<string> {
  const keys = await getKeys();
  if (keys.length === 0) throw new Error("No API Keys available");
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return keys[currentKeyIndex];
}

async function getCurrentKey(): Promise<string> {
  const keys = await getKeys();
  if (keys.length === 0) throw new Error("No API Keys configured");
  if (currentKeyIndex >= keys.length) currentKeyIndex = 0;
  return keys[currentKeyIndex];
}

// --- PROMPT ARCHITECT SYSTEM PROMPT ---
const PROMPT_ARCHITECT_SYSTEM = `
### SYSTEM ROLE
You are the "Master Prompt Architect," an advanced AI engine designed to transform vague, "messy" user thoughts into high-precision, engineered prompts based on the "Advanced ChatGPT Prompt Engineering" playbook.

Your goal is not to answer the user's thought, but to REWRITE their thought into a perfect prompt that they can use with an LLM.

### CORE PHILOSOPHY
You operate on three principles:
1. Clarity over Brevity: Specificity creates quality.
2. Direction over Correction: Guide the AI before it starts.
3. Systems over Questions: Build frameworks, not just queries.

### YOUR OPERATING FRAMEWORKS
You must analyze the user's input and select the best framework to restructure it.

#### 1. THE "ROSES" FRAMEWORK (For Complex Tasks)
If the user's request is a complex business, coding, or analytical task, structure the output prompt using ROSES:
- **R (Role):** Define a specific persona using the VOICE methodology (Viewpoint, Occupation, Intelligence, Communication, Emphasis).
- **O (Objective):** Use action verbs (Create, Analyze, Optimize) to state the clear goal.
- **S (Scenario):** Set the scene, constraints, and background context.
- **E (Expected Solution):** Define the deliverable format (tables, code, lists) and success criteria.
- **S (Steps):** Force a "Chain-of-Thought" process (Step 1, Step 2, etc.).

#### 2. THE ZERO-SHOT FORMULA (For Simple Tasks)
If the request is simple (e.g., "write an email"), use the Zero-Shot structure:
- **Role:** Who is the AI?
- **Context:** Background info.
- **Task:** What specifically needs to be done?
- **Format:** How should it look?
- **Parameters:** Constraints (length, tone).

### INSTRUCTION SETS (Applying the Guide)

**A. PERSONA ENGINEERING (VOICE):**
Never use generic roles like "You are an expert."
INSTEAD: "You are a Senior [Occupation] with [X years] experience. Your viewpoint is [Philosophy]. Your communication style is [Tone]."

**B. REASONING ENGINES:**
For any logic-based task, inject a "Chain-of-Thought" instruction:
"Before answering, think step-by-step to analyze [X], [Y], and [Z]."

**C. FORMAT CONTROL:**
Always define the output structure. Use the "FORMAT" principle:
- Form (List, Table, Essay)
- Organization (Headers, Hierarchy)
- Terminology (Specific naming conventions)

**D. ERROR & BIAS RESISTANCE:**
If the topic is controversial or fact-heavy, append instructions to:
- "Verify facts against provided context."
- "Provide multiple viewpoints to mitigate bias."
- "Acknowledge confidence levels."

### YOUR OUTPUT FORMAT
When the user provides a messy thought, your response must follow this exact structure:

**1. CRITIQUE**
Briefly explain what was missing in their original thought (e.g., "Lacked context," "No role defined").

**2. THE ENGINEERED PROMPT**
(Provide the perfected prompt inside a code block for easy copying).

**3. EXPLANATION OF TECHNIQUES**
Bullet points explaining which frameworks (ROSES/Zero-Shot) and techniques (Chain-of-Thought, Few-Shot) you applied.
`;

export async function enhancePrompt(messyThought: string): Promise<string> {
  await getKeys();
  let lastError: Error | null = null;
  const keys = await getKeys();

  for (const model of MODELS) {
    let keyAttempts = 0;
    const maxKeyAttempts = keys.length > 0 ? keys.length : 1;

    while (keyAttempts < maxKeyAttempts) {
      try {
        const currentKey = await getCurrentKey();
        
        const body: any = {
          "model": model,
          "messages": [
            { "role": "system", "content": PROMPT_ARCHITECT_SYSTEM },
            { "role": "user", "content": messyThought }
          ],
          "temperature": 0.7,
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentKey}`,
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;
          
          if (response.status === 429 || response.status === 402 || errorMessage.includes("quota")) {
             await rotateKey();
             keyAttempts++;
             continue;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content received");
        return content;

      } catch (error: any) {
        lastError = error;
        break; 
      }
    }
  }
  throw lastError || new Error("AI Service Busy");
}

// ... existing analyzeImage function ...
export async function analyzeImage(file: File): Promise<any> {
  // Ensure we have keys loaded
  await getKeys();

  // Convert file to Data URL
  const dataUrl = await fileToDataURL(file);

  const prompt = `
    You are an expert AI aesthetic consultant. Analyze this image with extreme mathematical precision.
    
    Task: Provide a highly precise numerical analysis (0-100) of features.
    
    Evaluate:
    1. Facial Symmetry
    2. Canthal Tilt & Eyes
    3. Cheekbones
    4. Nose
    5. Jawline
    6. Skin Quality
    7. Outfit/Styling
    8. Overall Aura

    MANDATORY: You MUST provide a "toast" (compliment) and a "roast" (playful critique).
    - The "toast" should be a short, witty compliment about their best feature.
    - The "roast" should be a short, funny, playful roast about something they could improve.
    - DO NOT leave these empty. If you can't find something, invent a playful one.

    Provide:
    - "final_score": Weighted average (0-100). IMPORTANT: This MUST be a precise float number with 3 decimal places (e.g. 87.453, 92.105), NOT a whole number.

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
      "final_score": 0.000
    }
  `;

  let lastError: Error | null = null;
  const keys = await getKeys();
  const maxAttempts = (keys.length || 1) * MODELS.length; // Try every key on every model if needed
  let attempts = 0;

  // Try models in sequence
  for (const model of MODELS) {
    // Retry logic for API keys (Rotation)
    let keyAttempts = 0;
    // Try each key for this model before switching models
    const maxKeyAttempts = keys.length > 0 ? keys.length : 1;

    while (keyAttempts < maxKeyAttempts) {
      try {
        // Add a small delay if retrying to avoid rate limits
        if (lastError) await new Promise(resolve => setTimeout(resolve, 1000));

        const currentKey = await getCurrentKey();
        console.log(`Attempting analysis with model: ${model} (Key Index: ${currentKeyIndex})`);
        
        const body: any = {
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
          "temperature": 0.7,
          "top_p": 0.9,
          "response_format": { "type": "json_object" }
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentKey}`,
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;
          
          console.warn(`Model ${model} failed with key index ${currentKeyIndex}: ${errorMessage}`);

          // Handle Rate Limits (429) or Payment Issues (402) by rotating key
          if (response.status === 429 || response.status === 402 || errorMessage.includes("quota") || errorMessage.includes("credits") || errorMessage.includes("limit")) {
             console.warn("Rate limit or quota reached. Rotating API key...");
             await rotateKey();
             keyAttempts++;
             attempts++;
             lastError = new Error(`Rate limit reached on key. Rotating...`);
             continue; // Retry same model with new key
          }

          // Handle Auth Errors
          if (errorMessage.includes("User not found") || response.status === 403 || response.status === 401) {
              await rotateKey();
              keyAttempts++;
              attempts++;
              lastError = new Error(`Auth failed on key. Rotating...`);
              continue;
          }

          if (response.status >= 500) {
              lastError = new Error("AI Service Busy. Retrying...");
              break; // Break key loop to try next model
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

        // ENFORCE DECIMAL PRECISION
        if (Number.isInteger(parsed.final_score)) {
          const randomDecimal = Math.random();
          parsed.final_score = parseFloat((parsed.final_score + randomDecimal).toFixed(3));
        } else {
          parsed.final_score = parseFloat(parsed.final_score.toFixed(3));
        }
        
        // Fallback for roast/toast if missing
        if (!parsed.roast) parsed.roast = "You're too perfect to roast!";
        if (!parsed.toast) parsed.toast = "Looking absolutely stunning!";

        return parsed; // Success!

      } catch (error: any) {
        console.error(`Analysis failed with ${model}:`, error);
        lastError = error;
        // If it wasn't a key-specific error that we already handled with 'continue', break to next model
        if (!error.message.includes("Rotating")) {
            break; 
        }
      }
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
