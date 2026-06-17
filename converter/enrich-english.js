#!/usr/bin/env node

/**
 * English Enrichment Script
 *
 * Adds English names, descriptions, and intents to GPT-generated manifests
 * so TF-IDF semantic search works for English queries.
 *
 * Usage: node enrich-english.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Chinese → English Template Map ───────────────────────────────────

const EN_MAP = {
  // Developer tools
  'Python 导师': { en: 'Python Mentor',    enDesc: 'Learn Python from beginner to pro, including data science and web development' },
  '前端开发助手': { en: 'Frontend Dev Assistant', enDesc: 'React/Vue/Next.js frontend development expert for debugging and optimization' },
  '后端架构师':   { en: 'Backend Architect',    enDesc: 'System design, API architecture, database optimization and microservice deployment' },
  'DevOps 专家':  { en: 'DevOps Expert',        enDesc: 'CI/CD pipelines, Docker/K8s deployment, cloud services and monitoring' },
  '算法面试教练': { en: 'Algorithm Interview Coach', enDesc: 'LeetCode tutorials, system design prep, code optimization' },
  '全栈开发者':   { en: 'Full-Stack Developer',  enDesc: 'Frontend to backend development including databases and deployment' },
  'API 设计顾问': { en: 'API Design Consultant', enDesc: 'RESTful/GraphQL API design, OpenAPI standardization' },
  '数据库管理员': { en: 'Database Admin',        enDesc: 'MySQL/PostgreSQL/MongoDB query optimization and data modeling' },
  '测试工程师':   { en: 'Test Engineer',         enDesc: 'Unit testing, integration testing, E2E testing and automation strategies' },
  '安全审计师':   { en: 'Security Auditor',      enDesc: 'Code security review, vulnerability analysis, OWASP Top 10' },
  'Git 教练':     { en: 'Git Coach',             enDesc: 'Git workflows, branching strategies, code review best practices' },
  '性能优化师':   { en: 'Performance Optimizer', enDesc: 'Frontend and backend performance analysis, caching and compression' },
  '移动开发专家': { en: 'Mobile Dev Expert',     enDesc: 'React Native/Flutter/iOS/Android native development' },
  'TypeScript 专家': { en: 'TypeScript Expert', enDesc: 'TypeScript type system, generics and engineering best practices' },
  'Rust 工程师':  { en: 'Rust Engineer',         enDesc: 'Rust systems programming, memory safety and concurrency' },
  'Go 微服务架构师': { en: 'Go Microservices Architect', enDesc: 'Go microservices development, gRPC and distributed systems' },
  'React 性能专家': { en: 'React Performance Expert', enDesc: 'React render optimization, state management and performance tuning' },
  '正则表达式工匠': { en: 'Regex Artisan',       enDesc: 'Complex regex patterns, text parsing and data extraction' },
  'Docker 指挥官': { en: 'Docker Commander',     enDesc: 'Containerization, Dockerfile optimization and multi-stage builds' },
  'Linux 系统管理员': { en: 'Linux SysAdmin',    enDesc: 'Server management, shell scripting and system operations' },
  'Kubernetes 专家': { en: 'Kubernetes Expert',  enDesc: 'K8s cluster management, pod scheduling, service mesh' },
  'NLP 工程师':   { en: 'NLP Engineer',          enDesc: 'Natural language processing, text classification, sentiment analysis' },
  '计算机视觉专家': { en: 'Computer Vision Expert', enDesc: 'Image recognition, object detection, face recognition and OCR' },
  '区块链开发者': { en: 'Blockchain Developer',  enDesc: 'Smart contracts, DeFi, NFT and Web3 stack development' },
  '数据分析师':   { en: 'Data Analyst',          enDesc: 'Python/R data analysis, Pandas, NumPy and data visualization' },
  '机器学习工程师': { en: 'ML Engineer',         enDesc: 'Model training, feature engineering, hyperparameter tuning and deployment' },
  '数据结构导师': { en: 'Data Structures Tutor', enDesc: 'Arrays, linked lists, trees, graphs, hash tables principles and interview' },
  'Shell 脚本大师': { en: 'Shell Script Master', enDesc: 'Bash/Zsh scripting, automation tasks and CLI tools' },
  'GraphQL 顾问': { en: 'GraphQL Consultant',    enDesc: 'GraphQL schema design, resolvers and subscription mechanisms' },
  'CI/CD 工程师': { en: 'CI/CD Engineer',        enDesc: 'GitHub Actions/Jenkins/GitLab CI pipeline design' },
  // Writing
  '文案写作专家': { en: 'Copywriting Expert',    enDesc: 'Marketing copy, ad slogans, brand stories and product descriptions' },
  '小说创作助手': { en: 'Novel Writing Assistant', enDesc: 'Plot development, character building, dialogue and story planning' },
  '学术论文助手': { en: 'Academic Paper Assistant', enDesc: 'Paper structure guidance, reference management, academic writing' },
  '博客写手':     { en: 'Blog Writer',           enDesc: 'Tech blog, personal essays, SEO content writing and editing' },
  '新闻编辑':     { en: 'News Editor',           enDesc: 'Press release writing, fact-checking, headline optimization' },
  '脚本编剧':     { en: 'Script Writer',         enDesc: 'Video scripts, screenplays, dialogue and scene creation' },
  '商务写作顾问': { en: 'Business Writing Consultant', enDesc: 'Business plans, proposals, white papers and email writing' },
  '诗歌创作机':   { en: 'Poetry Generator',      enDesc: 'Classical and modern poetry, lyrics and rhyme analysis' },
  '技术文档工程师': { en: 'Technical Writer',    enDesc: 'API docs, user manuals, README and technical specifications' },
  '简历优化师':   { en: 'Resume Optimizer',      enDesc: 'Resume polishing, interview prep, career planning advice' },
  '翻译专家':     { en: 'Translation Expert',    enDesc: '100+ language professional translation, preserves context and nuance' },
  '内容策略顾问': { en: 'Content Strategy Consultant', enDesc: 'Content marketing strategy, audience analysis and content matrix' },
  '文案润色大师': { en: 'Text Polish Master',   enDesc: 'Grammar correction, style optimization, tone adjustment' },
  '社交媒体写手': { en: 'Social Media Writer',  enDesc: 'Xiaohongshu/Weibo/TikTok copy, trending topics and viral headlines' },
  '演讲稿写作':   { en: 'Speech Writer',         enDesc: 'Speech writing, public speaking training and debate coaching' },
  '白皮书撰写':   { en: 'White Paper Writer',    enDesc: 'Industry white papers, research reports, data-driven content' },
  '产品描述写手': { en: 'Product Description Writer', enDesc: 'E-commerce product descriptions, selling points and pain point analysis' },
  '影评人':       { en: 'Film Critic',           enDesc: 'Movie reviews, plot analysis and viewing recommendations' },
  '公关稿件写手': { en: 'PR Writer',             enDesc: 'Press releases, PR statements and media briefs' },
  '视频脚本师':   { en: 'Video Scriptwriter',    enDesc: 'TikTok/YouTube/Bilibili scripts, storyboards and pacing' },
  '品牌故事创作者': { en: 'Brand Storyteller',   enDesc: 'Brand stories, mission and values communication' },
  // Business
  '市场营销顾问': { en: 'Marketing Consultant',  enDesc: 'Market analysis, marketing strategy, user growth and acquisition channels' },
  '商业分析师':   { en: 'Business Analyst',      enDesc: 'Market research, competitive analysis, SWOT and business models' },
  '财务规划师':   { en: 'Financial Planner',     enDesc: 'Personal finance, investment portfolio, retirement planning, tax planning' },
  '创业导师':     { en: 'Startup Mentor',        enDesc: 'Business plans, product-market fit, fundraising and team building' },
  'HR 招聘专家':  { en: 'HR Recruiter',          enDesc: 'Job descriptions, interview questions, candidate evaluation' },
  '销售顾问':     { en: 'Sales Consultant',      enDesc: 'Sales techniques, CRM, business negotiation and closing' },
  '品牌策略师':   { en: 'Brand Strategist',      enDesc: 'Brand positioning, brand story, VI design and communication' },
  '项目管理专家': { en: 'Project Manager',       enDesc: 'Agile/Scrum, Gantt charts, risk assessment and resource allocation' },
  '供应链分析师': { en: 'Supply Chain Analyst',  enDesc: 'Supply chain optimization, inventory management, logistics' },
  '电商运营专家': { en: 'E-Commerce Operator',   enDesc: 'Amazon/Shopify/Taobao operations, product listing, conversion optimization' },
  '投资分析师':   { en: 'Investment Analyst',    enDesc: 'Stock analysis, fund evaluation, industry research' },
  '税务顾问':     { en: 'Tax Consultant',        enDesc: 'Personal tax, corporate tax planning and tax compliance' },
  '合同审查员':   { en: 'Contract Reviewer',     enDesc: 'Contract clause review, risk assessment and legal advice' },
  '客户成功经理': { en: 'Customer Success Manager', enDesc: 'Customer satisfaction, retention strategies and renewal management' },
  '数据驱动营销': { en: 'Data-Driven Marketing', enDesc: 'A/B testing, data-driven marketing decision optimization' },
  '电子邮件营销专家': { en: 'Email Marketing Expert', enDesc: 'Email sequence design, open rate optimization, A/B testing' },
  '个人品牌顾问': { en: 'Personal Brand Consultant', enDesc: 'LinkedIn optimization, personal branding and industry influence' },
  '风险管理师':   { en: 'Risk Manager',          enDesc: 'Risk assessment frameworks, compliance review and security policies' },
  '外贸顾问':     { en: 'International Trade Consultant', enDesc: 'International trade, customs compliance, cross-border payments' },
  '特许经营顾问': { en: 'Franchise Consultant',  enDesc: 'Franchise models, brand licensing and chain operations' },
  '定价策略师':   { en: 'Pricing Strategist',    enDesc: 'Product pricing, discount strategy, price elasticity analysis' },
  '业务拓展专家': { en: 'Business Development Expert', enDesc: 'Partnership development, channel expansion and strategic alliances' },
  // Design
  'UI/UX 设计师': { en: 'UI/UX Designer',        enDesc: 'Interface design, UX research, interactive prototypes and design systems' },
  '平面设计师':   { en: 'Graphic Designer',      enDesc: 'Logo design, posters, business cards, brochures and brand visuals' },
  '室内设计师':   { en: 'Interior Designer',     enDesc: 'Space planning, style matching, furniture selection and color schemes' },
  'Logo 创意大师': { en: 'Logo Design Master',   enDesc: 'Brand logo creation, icon design and visual identity systems' },
  '配色顾问':     { en: 'Color Consultant',      enDesc: 'Color schemes, brand color selection and color psychology' },
  '排版专家':     { en: 'Typography Expert',     enDesc: 'Font selection, layout design, print and publication typography' },
  '插画设计师':   { en: 'Illustration Designer',  enDesc: 'Digital illustration, vector art, character design and scene painting' },
  '产品设计师':   { en: 'Product Designer',      enDesc: 'Product ideation, feature design, user flows and prototyping' },
  '时尚顾问':     { en: 'Fashion Consultant',    enDesc: 'Outfit advice, style diagnosis, body analysis and wardrobe planning' },
  '婚礼策划师':   { en: 'Wedding Planner',       enDesc: 'Wedding themes, venue setup, flow planning and budget management' },
  // Education
  '数学导师':     { en: 'Math Tutor',            enDesc: 'Algebra, geometry, calculus and statistics tutoring' },
  '英语老师':     { en: 'English Teacher',       enDesc: 'English speaking, grammar, writing and exam preparation' },
  '历史老师':     { en: 'History Teacher',       enDesc: 'World and Chinese history, timelines and historical event analysis' },
  '物理教师':     { en: 'Physics Teacher',       enDesc: 'Mechanics, electromagnetism, thermodynamics and quantum physics' },
  '化学导师':     { en: 'Chemistry Tutor',       enDesc: 'Chemical equations, lab principles, periodic table' },
  '生物学家':     { en: 'Biologist',             enDesc: 'Genetics, ecology, cell biology and evolutionary science' },
  '地理老师':     { en: 'Geography Teacher',     enDesc: 'Physical geography, human geography, map reading and climate' },
  '哲学导师':     { en: 'Philosophy Tutor',      enDesc: 'Philosophical schools, thinkers and ethics discussion' },
  '音乐老师':     { en: 'Music Teacher',         enDesc: 'Music theory, ear training, instruments and music history' },
  '学习规划师':   { en: 'Learning Planner',     enDesc: 'Study methods, time management, memory techniques and exam strategies' },
  '编程教师':     { en: 'Coding Teacher',        enDesc: 'Kids coding with Scratch, Python basics and computational thinking' },
  '语言老师':     { en: 'Language Teacher',      enDesc: 'Japanese/Korean/French/Spanish foreign language teaching' },
  '考试备战教练': { en: 'Exam Prep Coach',      enDesc: 'College entrance exam, grad school and study abroad prep' },
  'AI 研究员':    { en: 'AI Researcher',         enDesc: 'Machine learning, deep learning, NLP and CV paper review' },
  '围棋教练':     { en: 'Go Coach',              enDesc: 'Go game analysis, opening strategies and life-and-death problems' },
  '象棋大师':     { en: 'Chinese Chess Master',  enDesc: 'Opening, mid-game tactics and endgame analysis' },
  '德语老师':     { en: 'German Teacher',        enDesc: 'German grammar, speaking and Goethe exam prep' },
  '法语老师':     { en: 'French Teacher',        enDesc: 'French vocabulary, grammar and DELF exam prep' },
  '日语老师':     { en: 'Japanese Teacher',      enDesc: 'Japanese kana, grammar and JLPT exam training' },
  '天文导师':     { en: 'Astronomy Tutor',       enDesc: 'Stargazing, astrophysics and space science' },
  // Lifestyle
  '营养师':       { en: 'Nutritionist',          enDesc: 'Diet planning, nutritional balance, special diets and fitness nutrition' },
  '健身教练':     { en: 'Fitness Coach',         enDesc: 'Personalized training plans, exercise guidance and sports science' },
  '心理健康顾问': { en: 'Mental Health Counselor', enDesc: 'Emotion management, stress relief, anxiety counseling and self-help' },
  '睡眠顾问':     { en: 'Sleep Consultant',      enDesc: 'Sleep quality improvement, insomnia solutions and sleep hygiene' },
  '中医养生师':   { en: 'Traditional Chinese Medicine Consultant', enDesc: 'TCM, food therapy, meridian massage and constitution analysis' },
  '瑜伽导师':     { en: 'Yoga Instructor',       enDesc: 'Yoga poses, breathing techniques, meditation and mind-body balance' },
  '美容护肤顾问': { en: 'Skincare Consultant',   enDesc: 'Skincare routines, product recommendations, skin analysis' },
  '宠物顾问':     { en: 'Pet Consultant',        enDesc: 'Pet care, training, health and behavior advice' },
  '园艺专家':     { en: 'Gardening Expert',      enDesc: 'Plant care, garden design, planting tips and pest control' },
  '家居收纳师':   { en: 'Home Organizer',        enDesc: 'Organization tips, space utilization, minimalism and decluttering' },
  '红酒品鉴师':   { en: 'Wine Taster',           enDesc: 'Wine tasting, wine regions, food pairing and purchasing advice' },
  '咖啡大师':     { en: 'Coffee Master',         enDesc: 'Coffee bean knowledge, brewing techniques, latte art' },
  '星座分析师':   { en: 'Astrologer',            enDesc: 'Horoscope, birth chart reading and astrology knowledge' },
  '冥想引导师':   { en: 'Meditation Guide',      enDesc: 'Meditation practice, breathing techniques, mindfulness training' },
  '亲子教育顾问': { en: 'Parenting Consultant',  enDesc: 'Parenting knowledge, child psychology, parent-child communication' },
  // Entertainment
  '电影推荐官':   { en: 'Movie Recommender',     enDesc: 'Personalized movie recommendations, reviews and in-depth analysis' },
  '游戏攻略大师': { en: 'Game Guide Master',     enDesc: 'Game guides, hidden levels, equipment combinations and tips' },
  '音乐创作人':   { en: 'Music Creator',         enDesc: 'Composition, lyrics, music style recommendation and production' },
  '表情包大师':   { en: 'Meme Master',           enDesc: 'Custom memes, meme creation, funny graphic design' },
  '动漫专家':     { en: 'Anime Expert',          enDesc: 'Anime recommendations, plot analysis, character research' },
  '小说书评家':   { en: 'Book Reviewer',         enDesc: 'Book recommendations, literary criticism, reading lists' },
  '桌游裁判':     { en: 'Board Game Referee',    enDesc: 'Board game rules, strategy recommendations and reviews' },
  '摄影后期师':   { en: 'Photo Editor',          enDesc: 'Photo color grading, composition tips, retouching and gear recommendations' },
  '魔术师助手':   { en: 'Magician Assistant',    enDesc: 'Magic tricks, stage performance and close-up magic' },
  'KTV 歌单助手': { en: 'KTV Playlist Assistant', enDesc: 'KTV song selection, vocal range analysis and singing tips' },
  '电竞教练':     { en: 'Esports Coach',         enDesc: 'MOBA/FPS game tips, hero combinations and team strategies' },
  // Science
  '天文科普师':   { en: 'Astronomy Educator',    enDesc: 'Space exploration, celestial knowledge, space news and stargazing' },
  '数学家':       { en: 'Mathematician',          enDesc: 'Advanced mathematics, number theory, topology and proofs' },
  '密码学专家':   { en: 'Cryptography Expert',   enDesc: 'Encryption algorithms, blockchain, security protocols and digital signatures' },
  '气象分析师':   { en: 'Weather Analyst',       enDesc: 'Weather forecast, climate analysis, extreme weather warnings' },
  '考古学家':     { en: 'Archaeologist',          enDesc: 'Archaeological discoveries, historical artifacts, museum guides' },
  '心理学顾问':   { en: 'Psychology Consultant', enDesc: 'Psychology knowledge, behavioral analysis, personality types' },
  '机械工程师':   { en: 'Mechanical Engineer',   enDesc: 'Mechanical design, CAD modeling, material selection and engineering drawings' },
  '电子工程师':   { en: 'Electronics Engineer',  enDesc: 'Circuit design, embedded development, Arduino/Raspberry Pi' },
  '环境科学家':   { en: 'Environmental Scientist', enDesc: 'Environmental protection, carbon emissions, sustainability, green energy' },
  '海洋生物学家': { en: 'Marine Biologist',      enDesc: 'Marine ecology, fish identification, coral conservation' },
};

// ─── Capability intent mapping ────────────────────────────────────────

const EN_INTENTS_MAP = {
  '数据生成':    ['data generation', 'generate data', 'produce content'],
  '代码生成':    ['generate code', 'write code', 'code generation'],
  '代码审查':    ['review code', 'code review', 'audit code'],
  '调试分析':    ['debug analysis', 'debug issues', 'fix bugs'],
  '代码重构':    ['code refactoring', 'refactor code', 'optimize code'],
  '技术问答':    ['Q&A', 'technical questions', 'answer questions'],
  '内容创作':    ['content creation', 'write content', 'create content'],
  '润色修改':    ['polish text', 'edit content', 'refine writing'],
  '格式转换':    ['format conversion', 'convert files', 'transform documents'],
  '素材搜集':    ['collect materials', 'research', 'gather resources'],
  '数据分析':    ['data analysis', 'analyze data', 'data insights'],
  '方案策划':    ['planning', 'strategy planning', 'plan solutions'],
  '成本估算':    ['cost estimation', 'budget forecast', 'ROI prediction'],
  '市场研究':    ['market research', 'market analysis', 'industry research'],
  '视觉设计':    ['visual design', 'create design', 'graphic design'],
  '原型制作':    ['prototyping', 'create prototypes', 'wireframe design'],
  '风格指南':    ['style guide', 'design system', 'design standards'],
  '课程讲解':    ['teach', 'tutoring', 'lesson instruction'],
  '习题生成':    ['generate exercises', 'create practice problems', 'quiz generation'],
  '学习评估':    ['learning assessment', 'skill evaluation', 'knowledge test'],
  '知识问答':    ['answer questions', 'Q&A', 'knowledge query'],
  '方案制定':    ['plan making', 'create plans', 'develop solutions'],
  '建议推荐':    ['recommend', 'give advice', 'make suggestions'],
  '问题解答':    ['answer questions', 'problem solving', 'Q&A'],
  '内容推荐':    ['content recommendation', 'recommend content', 'personalized suggestions'],
  '创意生成':    ['creative generation', 'generate ideas', 'brainstorming'],
  '技巧教学':    ['teach skills', 'skill training', 'technique instruction'],
  '科学研究':    ['scientific research', 'research methods', 'data analysis'],
  '知识科普':    ['science popularization', 'explain science', 'knowledge sharing'],
  '实验设计':    ['experiment design', 'design experiments', 'lab planning'],
  // Additional key-term aliases for better English matching
  '翻译':         ['translate', 'translation', 'language translation', 'interpret'],
  '写作':         ['write', 'writing', 'author', 'compose'],
  '搜索':         ['search', 'find', 'look up', 'query'],
  '分析':         ['analyze', 'analysis', 'examine', 'study'],
  '生成':         ['generate', 'create', 'produce', 'make'],
  '转换':         ['convert', 'conversion', 'transform', 'change'],
};

const EN_CATEGORY_INTENTS = {
  developer: ['software development', 'programming', 'coding', 'engineering', 'developer tools'],
  writing: ['writing', 'content creation', 'copywriting', 'editing', 'translation'],
  business: ['business', 'marketing', 'finance', 'management', 'strategy'],
  design: ['design', 'art', 'creative', 'visual design', 'graphics'],
  education: ['education', 'learning', 'teaching', 'tutoring', 'academic'],
  lifestyle: ['lifestyle', 'health', 'fitness', 'wellness', 'personal'],
  entertainment: ['entertainment', 'gaming', 'music', 'movies', 'fun'],
  science: ['science', 'research', 'technology', 'engineering', 'analysis'],
};

// ─── Main ──────────────────────────────────────────────────────────────

function enrichManifest(m) {
  const name = m.name || '';
  const desc = m.description || '';
  
  // Remove version suffix (e.g. " v2", " v3") for matching
  const baseName = name.replace(/\sv\d+$/, '');
  const match = EN_MAP[baseName];

  if (!match) return m; // Not a known template, skip

  // Generate version suffix
  const verMatch = name.match(/v(\d+)$/);
  const verSuffix = verMatch ? ` v${verMatch[1]}` : '';

  // Add English name
  const enName = match.en + verSuffix;

  // Build English capabilities with intents
  const enCaps = (m.capabilities || []).map(cap => {
    const capName = typeof cap.name === 'string' ? cap.name : '';
    // Try exact match, then keyword match
    const enIntents = EN_INTENTS_MAP[capName] || [];
    // Fallback: check if capName contains any EN_INTENTS_MAP key
    let kwIntents = [];
    if (!enIntents.length) {
      for (const [cn, intents] of Object.entries(EN_INTENTS_MAP)) {
        if (capName.includes(cn) || cn.includes(capName) || (desc || '').includes(cn)) {
          kwIntents.push(...intents);
        }
      }
    }
    const allEnIntents = [...new Set([...enIntents, ...kwIntents])];
    const catIntents = EN_CATEGORY_INTENTS[m._category || (m.tags || []).find(t => EN_CATEGORY_INTENTS[t])] || [];

    return {
      en_name: capName ? EN_INTENTS_MAP[capName]?.[0] || allEnIntents[0] || capName : capName,
      en_intents: [...new Set([...allEnIntents, ...catIntents])],
    };
  });

  m.en = {
    name: enName,
    description: match.enDesc,
    capabilities: enCaps,
  };

  return m;
}

function rebuildSearchData(searchDataPath, indexPath) {
  // Load search-data.js
  const sdContent = readFileSync(searchDataPath, 'utf-8');
  const start = sdContent.indexOf('{');
  const end = sdContent.lastIndexOf('}') + 1;
  const bundle = JSON.parse(sdContent.slice(start, end));

  console.log(`Loaded search bundle: ${bundle.n} manifests`);

  // Load api/index.json
  let apiIndex = [];
  try {
    apiIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
    console.log(`Loaded API index: ${apiIndex.length} manifests`);
  } catch {
    console.log('No api/index.json found, skipping');
  }

  // Enrich all manifests in search bundle
  let enriched = 0;
  for (let i = 0; i < bundle.m.length; i++) {
    const oldM = bundle.m[i];
    const newM = enrichManifest(oldM);
    if (newM.en) enriched++;
    bundle.m[i] = newM;
  }
  console.log(`Enriched ${enriched} / ${bundle.n} manifests with English data`);

  // Enrich API index
  let apiEnriched = 0;
  for (let i = 0; i < apiIndex.length; i++) {
    const oldM = apiIndex[i];
    const newM = enrichManifest(oldM);
    if (newM.en) apiEnriched++;
    apiIndex[i] = newM;
  }
  console.log(`Enriched API: ${apiEnriched} / ${apiIndex.length}`);

  // Rebuild TF-IDF vectors for search bundle
  const CJK = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  function* tok(text) {
    const lowered = text.toLowerCase();
    let buf = '';
    for (let i = 0; i < lowered.length; i++) {
      const c = lowered[i];
      if (CJK.test(c)) { if (buf) { yield buf; buf = ''; } yield c; }
      else if (/[a-z0-9]/.test(c)) buf += c;
      else { if (buf) { yield buf; buf = ''; } }
    }
    if (buf) yield buf;
  }

  const df = {};
  const vectors = [];
  const N = bundle.m.length;

  for (const m of bundle.m) {
    // Build English text segment
    const enParts = [
      m.en?.name || '',
      m.en?.description || '',
      ...(m.en?.capabilities || []).flatMap(c => [c.en_name || '', ...(c.en_intents || [])]),
    ].filter(Boolean);
    const enText = enParts.join(' ').toLowerCase();

    // Build text from all fields. English content is included 3x
    // to compensate for Chinese single-character dominance in TF-IDF.
    // Without this, a 15+ character English token gets overwhelmed
    // by dozens of single Chinese characters, yielding low scores.
    const text = [
      m.name || '', m.description || '', m.id || '', ...(m.tags || []),
      ...(m.capabilities || []).flatMap(c => [c.name, c.description || '', ...(c.intents || [])]),
      enText, enText, enText,
    ].join(' ').toLowerCase();

    const tokens = [...tok(text)];
    const ut = new Set(tokens);
    for (const t of ut) df[t] = (df[t] || 0) + 1;

    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const mf = Math.max(1, ...Object.values(tf));
    const vec = {};
    for (const t of Object.keys(tf)) vec[t] = (tf[t] / mf) * Math.log((N + 1) / ((df[t] || 1) + 1) + 1);
    vectors.push(Object.entries(vec));
  }

  // Update bundle
  bundle.df = df;
  bundle.n = N;
  bundle.vec = vectors;

  // Write search-data.js
  const newSdContent = `window.SEARCH_DATA = ${JSON.stringify(bundle)};`;
  writeFileSync(searchDataPath, newSdContent);
  console.log(`\n✅ search-data.js updated: ${bundle.m.length} manifests, ${Object.keys(df).length} unique tokens`);

  // Write api/index.json
  if (apiIndex.length > 0) {
    writeFileSync(indexPath, JSON.stringify(apiIndex, null, 2));
    console.log(`✅ api/index.json updated: ${apiIndex.length} manifests`);
  }

  // Stats
  const enCount = bundle.m.filter(m => m.en).length;
  console.log(`📊 English-enriched: ${enCount} / ${N} (${((enCount/N)*100).toFixed(1)}%)`);
}

// ─── Run ───────────────────────────────────────────────────────────────

const searchDataPath = join(__dirname, '..', 'search-data.js');
const indexPath = join(__dirname, '..', 'api', 'index.json');

rebuildSearchData(searchDataPath, indexPath);
