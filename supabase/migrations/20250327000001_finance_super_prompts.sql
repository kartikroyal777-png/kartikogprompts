-- Insert Finance Category if not exists
INSERT INTO super_prompt_categories (name, icon, description, sort_order)
VALUES ('Finance', 'TrendingUp', 'Financial planning, analysis, and investment prompts.', 1)
ON CONFLICT (name) DO NOTHING;

-- Insert Demo Finance Prompts
INSERT INTO super_prompts (
    category_id, 
    title, 
    what_it_does, 
    prompt_content, 
    how_to_use, 
    is_premium, 
    created_by
)
SELECT 
    id,
    'Personal Budget Planner',
    'Creates a comprehensive monthly budget plan based on your income and expenses.',
    'Act as a financial advisor. Create a detailed monthly budget plan for a person with a monthly income of [INCOME]. Expenses include [EXPENSES]. Categorize expenses into Needs, Wants, and Savings using the 50/30/20 rule.',
    'Replace [INCOME] and [EXPENSES] with your actual data.',
    false,
    (SELECT id FROM auth.users LIMIT 1) -- Assign to first user found (usually admin)
FROM super_prompt_categories 
WHERE name = 'Finance'
ON CONFLICT DO NOTHING;

INSERT INTO super_prompts (
    category_id, 
    title, 
    what_it_does, 
    prompt_content, 
    how_to_use, 
    is_premium, 
    created_by
)
SELECT 
    id,
    'Investment Portfolio Analyzer',
    'Analyzes a given portfolio allocation and suggests improvements based on risk tolerance.',
    'Act as a senior investment analyst. I have a portfolio allocated as follows: [ALLOCATION]. My risk tolerance is [RISK_LEVEL]. Analyze this portfolio for diversification, risk exposure, and potential returns. Suggest 3 specific improvements.',
    'Fill in your current allocation and risk level.',
    true,
    (SELECT id FROM auth.users LIMIT 1)
FROM super_prompt_categories 
WHERE name = 'Finance'
ON CONFLICT DO NOTHING;
