/*
  # Fix Super Prompts Schema and Seed Data
  
  1. Changes
    - Add UNIQUE constraint to super_prompt_categories(name) to support ON CONFLICT
    - Seed Super Prompt Categories
    - Seed Finance Super Prompts
*/

-- Safely add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'super_prompt_categories_name_key'
    ) THEN
        ALTER TABLE public.super_prompt_categories 
        ADD CONSTRAINT super_prompt_categories_name_key UNIQUE (name);
    END IF;
END $$;

-- Insert Categories
INSERT INTO public.super_prompt_categories (name, icon, description, sort_order)
VALUES 
  ('Finance', 'TrendingUp', 'Master your money with AI. Budgeting, investing, and financial planning prompts.', 1),
  ('SEO', 'BarChart', 'Rank #1 on Google. Keyword research, content strategy, and technical SEO prompts.', 2),
  ('Solopreneurs', 'User', 'Scale your one-person business. Strategy, operations, and growth hacks.', 3),
  ('E-Commerce', 'ShoppingBag', 'Boost your store sales. Product descriptions, ad copy, and email marketing.', 4),
  ('Sales', 'Percent', 'Close more deals. Cold outreach, negotiation scripts, and objection handling.', 5),
  ('Education', 'GraduationCap', 'Learn faster and teach better. Lesson plans, study guides, and summaries.', 6),
  ('Productivity', 'Zap', 'Get more done in less time. Workflow optimization and time management.', 7),
  ('Writing', 'PenTool', 'Cure writer''s block. Blog posts, storytelling, and copywriting frameworks.', 8),
  ('Business', 'Briefcase', 'Grow your empire. Strategy, management, and leadership prompts.', 9),
  ('Marketing', 'Megaphone', 'Go viral. Social media strategy, content calendars, and brand building.', 10)
ON CONFLICT (name) DO UPDATE SET 
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Insert Finance Prompts
DO $$
DECLARE
    finance_id UUID;
BEGIN
    SELECT id INTO finance_id FROM public.super_prompt_categories WHERE name = 'Finance';
    
    IF finance_id IS NOT NULL THEN
        -- Prompt 1
        IF NOT EXISTS (SELECT 1 FROM public.super_prompts WHERE title = 'Monthly Budget Planner') THEN
            INSERT INTO public.super_prompts (category_id, title, what_it_does, prompt_content, how_to_use, is_premium, example_output_images)
            VALUES (finance_id, 'Monthly Budget Planner', 'Creates a detailed monthly budget plan based on your income and expenses.', 'Act as a financial advisor. Create a monthly budget for a person with a monthly income of [INCOME]. Expenses include: [EXPENSES_LIST]. Categorize them into Needs, Wants, and Savings using the 50/30/20 rule.', 'Replace [INCOME] with your net monthly income and [EXPENSES_LIST] with your recurring bills.', false, ARRAY['https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/000000/FFF?text=Budget+Plan']);
        END IF;

        -- Prompt 2
        IF NOT EXISTS (SELECT 1 FROM public.super_prompts WHERE title = 'Investment Portfolio Analyzer') THEN
            INSERT INTO public.super_prompts (category_id, title, what_it_does, prompt_content, how_to_use, is_premium, example_output_images)
            VALUES (finance_id, 'Investment Portfolio Analyzer', 'Analyzes a portfolio allocation and suggests improvements based on risk tolerance.', 'Act as a wealth manager. Analyze this portfolio: [PORTFOLIO_DETAILS]. My risk tolerance is [RISK_LEVEL] (Low/Medium/High). Suggest rebalancing strategies to optimize for long-term growth while minimizing volatility.', 'Provide your current asset allocation and risk profile.', true, ARRAY['https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/000000/FFF?text=Portfolio+Analysis']);
        END IF;

        -- Prompt 3
        IF NOT EXISTS (SELECT 1 FROM public.super_prompts WHERE title = 'Debt Snowball Calculator') THEN
            INSERT INTO public.super_prompts (category_id, title, what_it_does, prompt_content, how_to_use, is_premium, example_output_images)
            VALUES (finance_id, 'Debt Snowball Calculator', 'Generates a step-by-step plan to pay off debt using the snowball method.', 'Create a Debt Snowball payoff plan for the following debts: [DEBTS_LIST (Name, Balance, Interest Rate, Min Payment)]. I have an extra $[EXTRA_AMOUNT] per month to put towards debt. Show me the payoff timeline.', 'List all your debts with interest rates and minimum payments.', true, ARRAY['https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/000000/FFF?text=Debt+Snowball']);
        END IF;

        -- Prompt 4
        IF NOT EXISTS (SELECT 1 FROM public.super_prompts WHERE title = 'Side Hustle ROI Estimator') THEN
            INSERT INTO public.super_prompts (category_id, title, what_it_does, prompt_content, how_to_use, is_premium, example_output_images)
            VALUES (finance_id, 'Side Hustle ROI Estimator', 'Estimates the potential return on investment for a new side hustle idea.', 'I am planning to start a side hustle: [IDEA]. Startup costs are $[COSTS]. Estimated weekly hours: [HOURS]. Expected price per unit/service: $[PRICE]. Calculate the break-even point and projected 1st-year profit.', 'Describe your business idea and estimated costs.', false, ARRAY['https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/000000/FFF?text=ROI+Estimator']);
        END IF;
    END IF;
END $$;
