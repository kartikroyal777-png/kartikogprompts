import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

// Add delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ENV_API_KEYS = import.meta.env.VITE_OPENROUTER_API_KEY;
// Fallback key if env is missing - HARDCODED USER KEY
const DEFAULT_KEY = "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";

// Updated: Prioritize valid and stable models
const MODELS = [
  "google/gemini-2.0-flash-exp:free",             // Primary
  "google/gemini-2.0-flash-thinking-exp:free",    // Backup 1 (High capability)
  "meta-llama/llama-3.2-11b-vision-instruct:free", // Backup 2
  "nvidia/nemotron-nano-12b-v2-vl:free"           // Backup 3
];

// Key Management State
let cachedKeys: string[] = [];
let lastKeyFetch = 0;
let currentKeyIndex = 0;

/**
 * Fetches available API keys from Env and Database
 */
async function getKeys(): Promise<string[]> {
  const now = Date.now();
  // Cache keys for 1 minute to avoid hammering DB on every request
  if (cachedKeys.length > 0 && now - lastKeyFetch < 60000) {
    return cachedKeys;
  }

  const keys: string[] = [];

  // 1. ALWAYS push the hardcoded DEFAULT_KEY first to ensure the fresh key is tried
  if (DEFAULT_KEY) keys.push(DEFAULT_KEY.trim());

  // 2. Get from Env (deduplicate later)
  if (ENV_API_KEYS) {
    const envKeys = ENV_API_KEYS.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    keys.push(...envKeys);
  }

  // 3. Get from DB
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

  // Deduplicate
  cachedKeys = [...new Set(keys)];
  lastKeyFetch = now;
  
  if (cachedKeys.length === 0) {
    console.warn("No API Keys found!");
    // Ensure we at least have the default key if it exists
    if (DEFAULT_KEY) cachedKeys = [DEFAULT_KEY.trim()];
  }

  return cachedKeys;
}

/**
 * Rotates to the next API key in the list.
 */
async function rotateKey(): Promise<string> {
  const keys = await getKeys();
  if (keys.length === 0) throw new Error("No API Keys available");
  
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  console.log(`Rotating API Key to index ${currentKeyIndex + 1}/${keys.length}`);
  return keys[currentKeyIndex];
}

/**
 * Gets the current API key.
 */
async function getCurrentKey(): Promise<string> {
  const keys = await getKeys();
  if (keys.length === 0) return DEFAULT_KEY.trim();
  // Ensure index is valid
  if (currentKeyIndex >= keys.length) currentKeyIndex = 0;
  return keys[currentKeyIndex];
}

const GENERAL_PROMPT = `
You are an expert visual analysis specialist with 15+ years of experience in digital art, photography, graphic design, and AI image generation. You excel at deconstructing visual elements and translating artistic styles into technical specifications.

## Context & Goal
You will give a JSON prompt for this image. This prompt will be used by another person to make their picture look like this style.
**CRITICAL:** In the prompt, explicitly confirm to use the uploaded face, and use the uploaded person's hairstyle and hair color so that the AI model (NanoBanana) can understand it's about preserving the user's identity.

Your task: Analyze uploaded images and return comprehensive JSON profiles for recreating the visual style.

## Input Variable
Required Input:
- \`{{$json.image}}\` - Single uploaded image file

## Output Format
Return ONLY valid JSON. No explanations, no commentary, no markdown formatting.

Output format:
\`\`\`
{JSON_ANALYSIS_OBJECT}
\`\`\`

## Core JSON Schema

\`\`\`json
{
"metadata": {
"confidence_score": "high/medium/low - assessment of analysis accuracy",
"image_type": "photograph/digital art/illustration/graphic design/mixed media",
"primary_purpose": "marketing/editorial/social media/product/portrait/landscape/abstract"
},
"composition": {
"rule_applied": "rule of thirds/golden ratio/center composition/symmetry/asymmetry",
"aspect_ratio": "width:height ratio or format description",
"layout": "grid/single subject/multi-element/layered",
"focal_points": [
"Primary focal point location and element",
"Secondary focal point if present"
],
"visual_hierarchy": "Description of how eye moves through the image",
"balance": "symmetric/asymmetric/radial - with description"
},
"color_profile": {
"dominant_colors": [
{
"color": "Specific color name",
"hex": "#000000",
"percentage": "approximate percentage of image",
"role": "background/accent/primary subject"
}
],
"color_palette": "complementary/analogous/triadic/monochromatic/split-complementary",
"temperature": "warm/cool/neutral - overall feeling",
"saturation": "highly saturated/moderate/desaturated/black and white",
"contrast": "high contrast/medium contrast/low contrast/soft"
},
"lighting": {
"type": "natural window/artificial/mixed/studio/practical lights",
"source_count": "single source/multiple sources - number and placement",
"direction": "front/45-degree side/90-degree side/back/top/bottom/diffused from above",
"directionality": "highly directional/moderately directional/diffused/omni-directional",
"quality": "hard light/soft light/dramatic/even/gradient/sculpted",
"intensity": "bright/moderate/low/moody/high-key/low-key",
"contrast_ratio": "high contrast (dramatic shadows)/medium contrast/low contrast (flat)",
"mood": "cheerful/dramatic/mysterious/calm/energetic/professional/casual",
"shadows": {
"type": "harsh defined edges/soft gradual edges/minimal/dramatic/absent",
"density": "deep black/gray/transparent/faint",
"placement": "under subject/on wall/from objects/cast patterns",
"length": "short/medium/long - shadow projection distance"
},
"highlights": {
"treatment": "blown out/preserved/subtle/dramatic/specular",
"placement": "on face/hair/clothing/background - where light hits strongest"
},
"ambient_fill": "present/absent - secondary fill light reducing shadows",
"light_temperature": "warm (golden)/neutral/cool (blue) - color cast"
},
"technical_specs": {
"medium": "digital photography/3D render/digital painting/vector/photo manipulation/mixed",
"style": "realistic/hyperrealistic/stylized/minimalist/maximalist/abstract/surreal",
"texture": "smooth/grainy/sharp/soft/painterly/glossy/matte",
"sharpness": "tack sharp/slightly soft/deliberately soft/bokeh effect",
"grain": "none/film grain/digital noise/intentional grain - level",
"depth_of_field": "shallow/medium/deep - with subject isolation description",
"perspective": "straight on/low angle/high angle/dutch angle/isometric/one-point/two-point"
},
"artistic_elements": {
"genre": "portrait/landscape/abstract/conceptual/commercial/editorial/street/fine art",
"influences": [
"Identified artistic movement, photographer, or style influence"
],
"mood": "energetic/calm/dramatic/playful/sophisticated/raw/polished",
"atmosphere": "Description of overall feeling and emotional impact",
"visual_style": "clean/cluttered/minimal/busy/organic/geometric/fluid/structured"
},
"typography": {
"present": true,
"fonts": [
{
"type": "sans-serif/serif/script/display/handwritten",
"weight": "thin/light/regular/medium/bold/black",
"characteristics": "modern/vintage/playful/serious/technical"
}
],
"placement": "overlay/integrated/border/corner - with strategic description",
"integration": "subtle/prominent/dominant/background"
},
"subject_analysis": {
"primary_subject": "Main subject description",
"positioning": "center/left/right/top/bottom/rule of thirds placement",
"scale": "close-up/medium/full/environmental/macro",
"interaction": "isolated/interacting with environment/multiple subjects",
"facial_expression": {
"mouth": "closed smile/open smile/slight smile/neutral/serious/pursed - exact mouth position",
"smile_intensity": "no smile/subtle/moderate/broad/wide - degree of smile",
"eyes": "direct gaze/looking away/squinting/wide/relaxed/intense - eye expression",
"eyebrows": "raised/neutral/furrowed/relaxed - brow position",
"overall_emotion": "happy/content/serious/playful/confident/approachable/guarded/warm/cold",
"authenticity": "genuine/posed/candid/formal/natural"
},
"hair": {
"length": "pixie/short/chin-length/shoulder-length/mid-back/long/very long - specific measurement",
"cut": "blunt/layered/shaggy/undercut/fade/tapered/disconnected - exact style name",
"texture": "straight/wavy/curly/coily/kinky - natural pattern with specific wave type (loose waves/tight curls/s-waves)",
"texture_quality": "smooth/coarse/fine/thick/thin - hair strand thickness",
"natural_imperfections": "flyaways/frizz/uneven sections/growth patterns/cowlicks - observable natural variation",
"styling": "sleek/tousled/wet look/blow-dried/natural/product-heavy/messy/textured - exact current state",
"styling_detail": "Degree of styling: heavily styled/lightly styled/unstyled, product visibility, movement quality",
"part": "center/side/deep side/no part/zigzag - exact location with precision",
"volume": "flat/moderate volume/voluminous - root lift and overall fullness",
"details": "Specific features: bangs type, face-framing layers, buzzed sections, faded areas, length variations, texture inconsistencies"
},
"hands_and_gestures": {
"left_hand": "Exact position and gesture - touching face/holding object/resting on surface/in pocket/behind back/clasped/visible or not visible",
"right_hand": "Exact position and gesture - touching face/holding object/resting on surface/in pocket/behind back/clasped/visible or not visible",
"finger_positions": "Specific details: pointing/peace sign/thumbs up/relaxed/gripping/spread/interlaced/curled",
"finger_interlacing": "if hands clasped: natural loose interlacing/tight formal interlacing/fingers overlapping/thumbs position",
"hand_tension": "relaxed/tense/natural/posed/rigid - muscle tension observable",
"interaction": "What hands are doing: holding phone/touching hair/on hip/crossed/clasped at waist/clasped at chest/gesturing",
"naturalness": "organic casual gesture/deliberately posed/caught mid-motion/static formal pose"
},
"body_positioning": {
"posture": "standing/sitting/leaning/lying - exact position",
"angle": "facing camera/45 degree turn/profile/back to camera",
"weight_distribution": "leaning left/right/centered/shifted",
"shoulders": "level/tilted/rotated/hunched/back"
}
},
"background": {
"setting_type": "indoor/outdoor/studio/natural environment - specific location",
"spatial_depth": "shallow/medium/deep - layers description",
"elements_detailed": [
{
"item": "Specific object name (if plant: species like monstera/pothos/bird of paradise/fern)",
"position": "left/right/center/top/bottom - exact placement with quadrant",
"distance": "foreground/midground/background",
"size": "dominant/medium/small - relative scale and proportion",
"condition": "new/worn/vintage/pristine/wilted/thriving - state description",
"specific_features": "For plants: flower color, leaf pattern, pot type; For objects: brand, wear, details"
}
],
"wall_surface": {
"material": "painted drywall/concrete/brick/wood paneling/tile/wallpaper/plaster - exact base material",
"surface_treatment": "smooth paint/textured paint/raw concrete/polished concrete/exposed brick/finished/unfinished",
"texture": "perfectly smooth/slightly textured/rough/patterned/brushed - tactile quality",
"finish": "matte/satin/glossy/flat - sheen level",
"color": "Specific color with undertones (e.g., warm gray, cool blue-gray, off-white)",
"color_variation": "uniform/gradient/patchy/streaked - color consistency",
"features": "clean/water stains/vertical streaks/horizontal marks/cracks/patches/fixtures/artwork/scuffs - ALL observable surface details",
"wear_indicators": "pristine/aged/weathered/industrial/residential - condition and style"
},
"floor_surface": {
"material": "wood/tile/carpet/concrete/grass - exact type",
"color": "Specific color",
"pattern": "solid/checkered/striped/herringbone - if present"
},
"objects_catalog": "List every visible object with position: furniture pieces, decorative items, functional objects, natural elements",
"background_treatment": "blurred/sharp/minimal/detailed/gradient/textured"
},
"generation_parameters": {
"prompts": [
"Detailed technical prompt for recreating this style",
"Alternative angle or variation prompt"
],
"keywords": [
"keyword1",
"keyword2",
"keyword3",
"keyword4",
"keyword5"
],
"technical_settings": "Recommended camera/render settings description for recreation",
"post_processing": "Color grading, filters, or editing techniques applied"
}
}
\`\`\`

## Analysis Rules

### Composition Analysis
- Identify grid systems, alignment, and spatial relationships
- Note use of negative space and breathing room
- Describe visual flow and eye movement path
- Identify focal points using color, contrast, size, or placement
- Assess balance between elements

### Color Analysis
- Extract dominant colors with approximate hex values
- Identify color relationships (complementary, analogous, etc.)
- Assess temperature bias (warm vs cool)
- Note saturation levels and contrast intensity
- Describe how color creates mood and directs attention

### Lighting Assessment
- Determine light source type, direction, and quality
- Analyze shadow characteristics and depth
- Assess highlight preservation or blown-out areas
- Describe overall lighting mood and emotional impact
- Note light's role in creating dimension and form

### Technical Evaluation
- Identify creation medium and technique
- Assess texture, sharpness, and grain characteristics
- Evaluate depth of field and focus points
- Analyze perspective and viewpoint
- Note any technical limitations or intentional choices

### Artistic Context
- Identify genre and artistic influences
- Assess mood, atmosphere, and emotional tone
- Describe visual style (minimal, maximalist, etc.)
- Note any cultural or temporal references
- Evaluate overall aesthetic cohesion

### Typography (if present)
- Identify font styles and weights
- Assess placement and integration strategy
- Evaluate readability and hierarchy
- Describe relationship to other visual elements

### Subject Treatment
- **Hair Analysis (CRITICAL)**:
- Measure exact length using body reference points (ears, shoulders, etc.)
- Identify specific cut style by name (bob, shag, fade, undercut, etc.)
- Note texture pattern AND texture quality - distinguish between natural imperfect texture vs "AI smooth" perfect texture
- Capture natural imperfections: flyaways, frizz, uneven sections, growth patterns, texture variation
- Describe part location with precision (1 inch from center, deep left, etc.)
- Document all details: bang style, layering, undercut sections, faded areas
- Specify product use evidence (wet look, matte, glossy, natural) and degree of styling
- Note volume and movement quality
- AVOID: Describing hair as "perfect" or overly uniform - real hair has natural variation
- **Hand & Gesture Analysis (CRITICAL)**:
- Describe EACH hand separately with exact position
- Note if hands are visible or hidden (in pockets, behind back, out of frame)
- Document specific finger positions and shapes
- For clasped hands: describe interlacing style (natural loose vs formal tight), thumb positions, finger overlap patterns
- Assess hand tension: relaxed vs tense, organic vs posed
- Describe what hands are interacting with (phone, face, object, clothing, each other)
- Note natural vs posed quality of gesture
- Specify pressure/contact points (lightly touching vs gripping)
- Evaluate overall naturalness: organic casual vs deliberately posed
- **Background Elements (CRITICAL)**:

- Catalog EVERY visible object with exact position and quadrant placement
- For plants: identify species (monstera, pothos, bird of paradise, fern, etc.)
- Describe spatial relationships between objects and their depth layers
- **Wall analysis is CRITICAL**:
- Distinguish between painted drywall vs concrete vs brick vs other materials
- Note surface treatment: smooth paint vs textured vs raw vs polished
- Document finish: matte vs glossy vs satin
- Identify any surface features: water stains, streaks, cracks, patches, wear
- Assess condition: pristine residential vs industrial weathered vs aged
- Document floor type, color, pattern
- Specify distance/depth layer for each element
- Note condition and state of objects (new/worn/vintage/thriving/wilted)
- Describe any text, artwork, or decorative elements
- Include architectural features (windows, doors, molding, fixtures, frames)
- **Lighting Analysis (CRITICAL)**:

- Distinguish between dramatic directional lighting vs flat even lighting
- Assess directionality: highly directional (strong shadows) vs diffused (soft minimal shadows)
- Document shadow characteristics: harsh defined edges vs soft gradual edges vs minimal
- Note contrast ratio: high contrast (dramatic) vs low contrast (flat)
- Identify if ambient fill light is present reducing shadow depth
- Describe how light sculpts the subject vs evenly illuminates
- Document cast shadows from objects (like plants) on walls
- Note shadow density: deep black vs gray vs faint
- **Facial Expression (CRITICAL)**:

- Capture exact mouth position: closed smile/slight smile/neutral/serious
- Quantify smile intensity: no smile/subtle/moderate/broad
- Note eye expression and gaze direction
- Assess overall emotional tone: warm approachable vs serious neutral
- Distinguish between genuine natural expression vs posed formal expression
- Analyze primary subject and positioning

- Assess scale and framing choices
- Describe subject-background relationship
- Note any secondary subjects or supporting elements
### Generation Parameters

- Create actionable technical prompts for recreation
- Extract relevant keywords for searchability
- Recommend technical settings for similar results
- Describe post-processing techniques applied
## Output Requirements

- **Format**: Valid JSON only

- **No markdown**: No \`\`\`json\`\`\` blocks, no backticks
- **No commentary**: No explanatory text before/after JSON
- **No instructions**: No "Here is your analysis" or "Copy this"
- **Clean structure**: Properly formatted, parseable JSON
- **Single object**: Return one complete JSON analysis object
- **Comprehensive**: All sections must be populated with detailed analysis
- **Specific**: Use precise technical terminology, not vague descriptions
- **Actionable**: Generation parameters must be detailed enough for recreation
## Processing Logic

1. Receive image input from \`{{$json.image}}\`

2. Perform comprehensive visual analysis across all categories
3. Extract technical specifications and artistic elements
4. Generate recreation prompts and parameters
5. Output single, complete JSON object
## Quality Standards

- **Confidence score**: Honest assessment of analysis certainty

- **Hex codes**: Approximate but reasonable color values
- **Specific descriptions**: Avoid generic terms like "nice" or "good"
- **Technical accuracy**: Use correct terminology for medium and technique
- **Completeness**: Every JSON field must contain meaningful analysis
- **Actionability**: Prompts and keywords must be specific enough to recreate style
### CRITICAL Accuracy Requirements:

**Hair Description Must Include:**

- Exact length measurement using reference points
- Specific cut style name (not just "short" or "long")
- Texture type AND texture quality (avoid "perfect" - describe natural variation)
- Natural imperfections: flyaways, frizz, uneven sections, texture inconsistencies
- Styling state with product evidence and degree of styling
- Part location with precision
- Volume and movement quality
- All unique features (bangs, layers, fades, undercuts)
- **AVOID**: "AI smooth" or overly perfect descriptions - real hair has variation
**Hand & Gesture Description Must Include:**

- Position of BOTH hands (even if one is hidden)
- Exact finger configurations
- For clasped hands: interlacing pattern (loose/tight), thumb position, finger overlap
- Hand tension assessment (relaxed vs tense)
- What hands are interacting with
- Natural vs posed quality with specific evidence
- Contact points and pressure
- Overall gesture naturalness assessment
**Background Description Must Include:**

- Every visible object cataloged with quadrant position
- Plant species identification (not just "plant")
- **Wall material distinction** (painted drywall vs concrete vs brick - THIS IS CRITICAL)
- Wall surface treatment (smooth paint vs raw concrete vs textured)
- Wall finish (matte vs glossy) and condition (pristine vs weathered vs industrial)
- Any surface features: water stains, vertical streaks, cracks, patches
- Floor materials with exact colors
- Spatial depth layers (foreground/mid/background) for each element
- Object conditions and states
- Architectural features
- Text or decorative elements
**Lighting Description Must Include:**

- Directionality assessment (highly directional vs diffused)
- Contrast ratio (high/medium/low)
- Shadow characteristics: edge quality (harsh vs soft), density (deep vs faint), placement
- Cast shadows from objects onto walls
- Presence or absence of ambient fill light
- Whether lighting is dramatic and sculpting vs flat and even
- This distinction is CRITICAL for recreation accuracy
**Facial Expression Must Include:**

- Exact mouth position (closed smile/slight smile/neutral/serious)
- Smile intensity quantification
- Eye expression details
- Overall emotional tone (warm vs neutral vs serious)
- Genuine vs posed quality assessment
generation_parameters": { "prompts": [  [UPLOADED_PERSON_FACE], retaining [UPLOADED_PERSON_HAIRSTYLE_AND_COLOR].
`;

const PRODUCT_PROMPT = `
You are an expert visual analysis specialist. Analyze this product image to create a generic, reusable photoshoot prompt for marketing agencies.

## Context & Goal
You are creating a prompt for a product photoshoot. This prompt will be used by a marketing agency for different products with different unique brand color styles.
The prompt must be GENERIC. When an agency uses this prompt by uploading their particular product, the background color, elements, and brand kit should match the product they upload.
The theme should be the same as the analyzed image, but adaptable to different brand kits.
The prompt should be written so that an AI generation model (like NanoBanana) understands instantly what the user wants.

Format inspiration:
"Professional product photoshoot of [PRODUCT NAME] centered between two halves of a dark, jagged volcanic rock shell. The interior of the rock shell is lined with [BRAND COLOR] glowing crystals. The [PRODUCT TYPE] has a frosted texture with internal [BRAND COLOR] bioluminescence and micro-droplets of condensation."

## Output Format
Return ONLY valid JSON. No explanations, no commentary, no markdown formatting.

## Core JSON Schema
{
"metadata": {
"confidence_score": "high/medium/low",
"image_type": "photograph/digital art/illustration/graphic design/mixed media",
"primary_purpose": "marketing/editorial/social media/product/portrait/landscape/abstract"
},
"composition": {
"rule_applied": "rule of thirds/golden ratio/center composition/symmetry/asymmetry",
"aspect_ratio": "width:height ratio or format description",
"layout": "grid/single subject/multi-element/layered",
"focal_points": ["Primary focal point", "Secondary focal point"],
"visual_hierarchy": "Description",
"balance": "symmetric/asymmetric/radial"
},
"color_profile": {
"dominant_colors": [{ "color": "name", "hex": "#000000", "percentage": "approx %", "role": "background/accent/primary" }],
"color_palette": "complementary/analogous/triadic/monochromatic/split-complementary",
"temperature": "warm/cool/neutral",
"saturation": "high/moderate/low",
"contrast": "high/medium/low"
},
"lighting": {
"type": "natural/artificial/mixed/studio",
"source_count": "single/multiple",
"direction": "front/side/back/top",
"directionality": "directional/diffused",
"quality": "hard/soft",
"intensity": "bright/moderate/low",
"contrast_ratio": "high/medium/low",
"mood": "cheerful/dramatic/mysterious/professional",
"shadows": { "type": "harsh/soft", "density": "deep/faint", "placement": "under/wall", "length": "short/long" },
"highlights": { "treatment": "blown/preserved", "placement": "face/object" },
"ambient_fill": "present/absent",
"light_temperature": "warm/neutral/cool"
},
"technical_specs": {
"medium": "photography/3D/painting",
"style": "realistic/stylized/minimalist",
"texture": "smooth/grainy",
"sharpness": "sharp/soft",
"grain": "none/film/digital",
"depth_of_field": "shallow/deep",
"perspective": "straight/angle/isometric"
},
"artistic_elements": {
"genre": "portrait/landscape/product",
"influences": ["influence1"],
"mood": "energetic/calm",
"atmosphere": "description",
"visual_style": "clean/cluttered"
},
"typography": {
"present": true,
"fonts": [{ "type": "sans/serif", "weight": "bold", "characteristics": "modern" }],
"placement": "overlay/integrated",
"integration": "subtle/prominent"
},
"subject_analysis": {
"primary_subject": "Main subject description",
"positioning": "center/left/right",
"scale": "close-up/medium/full",
"interaction": "isolated/interacting"
},
"background": {
"setting_type": "indoor/outdoor/studio",
"spatial_depth": "shallow/deep",
"elements_detailed": [{ "item": "name", "position": "left/right", "distance": "foreground/background", "size": "large/small", "condition": "new/worn", "specific_features": "details" }],
"wall_surface": { "material": "paint/brick", "surface_treatment": "smooth/rough", "texture": "smooth", "finish": "matte/glossy", "color": "color", "color_variation": "uniform", "features": "clean", "wear_indicators": "pristine" },
"floor_surface": { "material": "wood/tile", "color": "color", "pattern": "solid" },
"objects_catalog": "List objects",
"background_treatment": "blurred/sharp"
},
"generation_parameters": {
"prompts": [
"Professional product photoshoot of [PRODUCT NAME] centered between two halves of a dark, jagged volcanic rock shell. The interior of the rock shell is lined with [BRAND COLOR] glowing crystals. The [PRODUCT TYPE] has a frosted texture with internal [BRAND COLOR] bioluminescence and micro-droplets of condensation.",
"Alternative angle or variation prompt"
],
"keywords": ["keyword1", "keyword2", "keyword3"],
"technical_settings": "Camera settings",
"post_processing": "Editing techniques"
}
}
`;

export async function generateJsonPrompt(file: File, isProduct: boolean = false): Promise<any> {
  // 1. Compress Image
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1024,
    useWebWorker: false, // Fix: Disable WebWorker to prevent terminal crashes
  };
  
  let compressedFile = file;
  try {
    compressedFile = await imageCompression(file, options);
  } catch (e) {
    console.warn("Compression failed", e);
  }

  const base64Image = await fileToBase64(compressedFile);
  const systemPrompt = isProduct ? PRODUCT_PROMPT : GENERAL_PROMPT;

  // Ensure keys are loaded
  await getKeys();

  let lastError: Error | null = null;

  // Loop through models to handle 429s (Service Congestion)
  for (const model of MODELS) {
    let retries = 0;
    const maxRetries = 2; // Try each model up to 2 times

    while (retries < maxRetries) {
      try {
        const currentKey = await getCurrentKey();
        console.log(`Attempting analysis with model: ${model} (Key Index: ${currentKeyIndex})`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentKey}`,
            "Content-Type": "application/json"
            // Removed Referer/Title to avoid potential strict checks on some providers
          },
          body: JSON.stringify({
            "model": model,
            "messages": [
              {
                "role": "system",
                "content": systemPrompt
              },
              {
                "role": "user",
                "content": [
                  {
                    "type": "text",
                    "text": "Analyze this image and provide the JSON output."
                  },
                  {
                    "type": "image_url",
                    "image_url": {
                      "url": base64Image
                    }
                  }
                ]
              }
            ]
          })
        });

        // Handle 401 (Unauthorized) specifically
        if (response.status === 401) {
          console.warn(`Key ${currentKeyIndex} failed (401).`);
          
          // Only remove key if we have others, otherwise keep it (might be model specific)
          const keys = await getKeys();
          if (keys.length > 1) {
             const badKey = await getCurrentKey();
             cachedKeys = cachedKeys.filter(k => k !== badKey);
             await rotateKey(); 
             retries++;
             lastError = new Error(`API Error: 401 (Key Invalid - Rotated)`);
             continue;
          } else {
             // If it's the only key, break retry loop to try NEXT model instead of throwing
             console.warn("401 with single key - attempting next model...");
             lastError = new Error("API Key Invalid (401) for this model.");
             break;
          }
        }

        // Handle 400 (Bad Request - Invalid Model)
        if (response.status === 400) {
             console.warn(`Model ${model} returned 400 (Bad Request). Likely invalid model ID. Skipping...`);
             lastError = new Error(`Model ${model} is invalid.`);
             break; // Break retry loop for this model
        }

        // Handle 429/402 Errors by Rotating Key OR Switching Model
        if (response.status === 429 || response.status === 402) {
          console.warn(`API Error ${response.status} on ${model}. Rotating key...`);
          await rotateKey();
          retries++;
          lastError = new Error(`API Error: ${response.status} (Key Rotated)`);
          
          // Exponential backoff for rate limits
          if (response.status === 429) {
              const waitTime = Math.pow(2, retries) * 1000;
              await delay(waitTime);
          }
          continue; // Retry same model with new key
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("No content received from AI");

        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        return JSON.parse(jsonMatch[0]);

      } catch (error: any) {
        console.error(`Analysis failed on ${model}:`, error);
        lastError = error;
        
        // If it's a 429 or 401, we already handled it in the loop above with 'continue'.
        // If we reach here, it might be a network error or something else.
        // We break the retry loop to try the NEXT model.
        break; 
      }
    }
    console.warn(`Switching from ${model} due to repeated errors...`);
  }

  throw lastError || new Error("Failed to analyze image. All AI models are currently busy.");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
