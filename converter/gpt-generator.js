#!/usr/bin/env node

/**
 * GPT Store Bulk Generator
 *
 * Generates 500+ realistic GPT entries from templates, then
 * converts them all to AMP manifests and registers in index.
 *
 * Usage: node gpt-generator.js [--count 500]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { toManifest } from './transformers/to-manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Template: GPT personas by category ───────────────────────────────

const CATEGORIES = {
  developer: {
    display: '开发者工具',
    templates: [
      { name: 'Python 导师', desc: '从入门到精通 Python 编程，包含数据科学和 Web 开发', verified: true },
      { name: '前端开发助手', desc: 'React/Vue/Next.js 前端开发专家，帮你调试组件和优化性能', verified: true },
      { name: '后端架构师', desc: '系统设计、API 架构、数据库优化和微服务部署', verified: true },
      { name: 'DevOps 专家', desc: 'CI/CD 流水线、Docker/K8s 部署、云服务和监控告警', verified: true },
      { name: '算法面试教练', desc: 'LeetCode 算法题讲解、系统设计面试准备、代码优化', verified: true },
      { name: '全栈开发者', desc: '从前端到后端的全栈开发，包含数据库设计和部署', verified: true },
      { name: 'API 设计顾问', desc: 'RESTful/GraphQL API 设计、OpenAPI 规范化', verified: true },
      { name: '数据库管理员', desc: 'MySQL/PostgreSQL/MongoDB 查询优化和数据建模', verified: true },
      { name: '测试工程师', desc: '单元测试、集成测试、E2E 测试和自动化测试策略', verified: true },
      { name: '安全审计师', desc: '代码安全审查、漏洞分析、OWASP Top 10 防护指南', verified: true },
      { name: 'Git 教练', desc: 'Git 工作流、分支策略、代码审查最佳实践', verified: false },
      { name: '性能优化师', desc: '前端与后端性能分析、瓶颈定位、缓存和压缩策略', verified: true },
      { name: '移动开发专家', desc: 'React Native/Flutter/iOS/Android 原生开发', verified: true },
      { name: 'TypeScript 专家', desc: 'TypeScript 类型系统、泛型和工程化最佳实践', verified: false },
      { name: 'Rust 工程师', desc: 'Rust 系统编程、内存安全和并发编程专家', verified: false },
      { name: 'Go 微服务架构师', desc: 'Go 语言微服务开发、gRPC 通信和分布式系统', verified: false },
      { name: 'React 性能专家', desc: 'React 渲染优化、状态管理和性能调优专家', verified: false },
      { name: '正则表达式工匠', desc: '复杂正则表达式编写、文本解析和数据提取', verified: false },
      { name: 'Docker 指挥官', desc: '容器化部署、Dockerfile 优化和多阶段构建', verified: false },
      { name: 'Linux 系统管理员', desc: '服务器管理、Shell 脚本编写和系统运维', verified: true },
    ]
  },
  writing: {
    display: '写作与内容',
    templates: [
      { name: '文案写作专家', desc: '营销文案、广告语、品牌故事和产品描述写作', verified: true },
      { name: '小说创作助手', desc: '情节构思、人物塑造、对话创作和故事线规划', verified: true },
      { name: '学术论文助手', desc: '论文结构指导、参考文献管理、学术写作风格优化', verified: true },
      { name: '博客写手', desc: '技术博客、个人随笔、SEO 优化内容的写作与编辑', verified: true },
      { name: '新闻编辑', desc: '新闻稿撰写、事实核查、标题优化和内容审核', verified: true },
      { name: '脚本编剧', desc: '视频脚本、电影剧本、对话设计场景创作', verified: true },
      { name: '商务写作顾问', desc: '商业计划书、项目提案、白皮书和邮件写作', verified: true },
      { name: '诗歌创作机', desc: '古诗、现代诗、歌词创作和韵律分析', verified: false },
      { name: '技术文档工程师', desc: 'API 文档、用户手册、README 和技术规范的编写', verified: true },
      { name: '简历优化师', desc: '简历润色、面试准备、职业规划建议', verified: true },
      { name: '翻译专家', desc: '100+ 语言的专业翻译，保留语境和文化差异', verified: true },
      { name: '内容策略顾问', desc: '内容营销策略、受众分析和内容矩阵规划', verified: false },
      { name: '文案润色大师', desc: '语法纠错、风格优化、语气调整和可读性提升', verified: false },
      { name: '社交媒体写手', desc: '小红书/微博/抖音文案、热点话题和爆款标题', verified: false },
      { name: '演讲稿写作', desc: '演讲稿撰写、公共演讲培训和辩论赛辅导', verified: false },
    ]
  },
  business: {
    display: '商业与营销',
    templates: [
      { name: '市场营销顾问', desc: '市场分析、营销策略、用户增长和获客渠道优化', verified: true },
      { name: '商业分析师', desc: '市场调研、竞品分析、SWOT 分析和商业模型评估', verified: true },
      { name: '财务规划师', desc: '个人理财、投资组合、退休规划和税务筹划', verified: true },
      { name: '创业导师', desc: '创业计划、产品市场契合度、融资策略和团队建设', verified: true },
      { name: 'HR 招聘专家', desc: '岗位描述、面试题库、候选人评估方案建议', verified: true },
      { name: '销售顾问', desc: '销售技巧、客户关系管理、商务谈判和成交策略', verified: true },
      { name: '品牌策略师', desc: '品牌定位、品牌故事、VI 设计和品牌传播策略', verified: true },
      { name: '项目管理专家', desc: '敏捷/Scrum、甘特图、风险评估和资源分配', verified: true },
      { name: '供应链分析师', desc: '供应链优化、库存管理、物流策略和成本控制', verified: false },
      { name: '电商运营专家', desc: '淘宝/亚马逊/Shopify 运营、产品上架和转化率优化', verified: true },
      { name: '投资分析师', desc: '股票分析、基金评估、行业研究和投资建议', verified: true },
      { name: '税务顾问', desc: '个人所得税、企业税务筹划和税法合规', verified: true },
      { name: '合同审查员', desc: '商业合同条款审查、风险评估和法律建议', verified: true },
      { name: '客户成功经理', desc: '客户满意度提升、留存策略和续费管理', verified: false },
      { name: '数据驱动营销', desc: 'A/B 测试、数据分析驱动的营销决策优化', verified: false },
      { name: '电子邮件营销专家', desc: '邮件序列设计、打开率优化、A/B 测试策略', verified: true },
      { name: '个人品牌顾问', desc: 'LinkedIn 优化、个人品牌建设和行业影响力提升', verified: false },
      { name: '风险管理师', desc: '风险评估框架、合规审查和安全策略制定', verified: false },
    ]
  },
  design: {
    display: '设计 & 创意',
    templates: [
      { name: 'UI/UX 设计师', desc: '界面设计、用户体验研究、交互原型和设计系统', verified: true },
      { name: '平面设计师', desc: 'Logo 设计、海报、名片、宣传册和品牌视觉', verified: true },
      { name: '室内设计师', desc: '空间规划、风格搭配、家具选择和色彩方案', verified: true },
      { name: 'Logo 创意大师', desc: '品牌 Logo 创意、图标设计和视觉识别系统', verified: false },
      { name: '配色顾问', desc: '色彩搭配方案、品牌色选择和配色心理学', verified: false },
      { name: '排版专家', desc: '字体选择、版面布局、印刷设计和出版物排版', verified: false },
      { name: '插画设计师', desc: '数字插画、矢量图、角色设计和场景绘画', verified: false },
      { name: '产品设计师', desc: '产品构思、功能设计、用户流程和原型设计', verified: true },
      { name: '时尚顾问', desc: '穿搭建议、风格诊断、身材分析和衣橱规划', verified: false },
      { name: '婚礼策划师', desc: '婚礼主题、场地布置、流程规划和预算管理', verified: false },
    ]
  },
  education: {
    display: '教育 & 学习',
    templates: [
      { name: '数学导师', desc: '代数、几何、微积分和概率统计的讲解与习题', verified: true },
      { name: '英语老师', desc: '英语口语、语法、写作和考试备考指导', verified: true },
      { name: '历史老师', desc: '中外历史讲解、时间线整理和历史事件分析', verified: true },
      { name: '物理教师', desc: '力学、电磁学、热学和量子物理入门教学', verified: true },
      { name: '化学导师', desc: '化学方程、实验原理、元素周期表讲解', verified: false },
      { name: '生物学家', desc: '遗传学、生态学、细胞生物学和进化论科普', verified: false },
      { name: '地理老师', desc: '自然地理、人文地理、地图阅读和气候知识', verified: false },
      { name: '哲学导师', desc: '哲学流派、思想家和伦理学问题探讨', verified: false },
      { name: '音乐老师', desc: '乐理、视唱练耳、乐器和音乐史教学', verified: false },
      { name: '学习规划师', desc: '学习方法、时间管理、记忆技巧和考试策略', verified: true },
      { name: '编程教师', desc: '儿童编程 Scratch、Python 入门和计算机思维', verified: true },
      { name: '语言老师', desc: '日语/韩语/法语/西语等外语教学和练习', verified: true },
      { name: '考试备战教练', desc: '高考/考研/留学考试备考策略和冲刺计划', verified: true },
      { name: 'AI 研究员', desc: '机器学习、深度学习、NLP 和 CV 前沿论文解读', verified: false },
      { name: '围棋教练', desc: '围棋棋谱分析、开局策略和死活题练习', verified: false },
      { name: '象棋大师', desc: '中国象棋布局、残局和中局战术分析', verified: false },
    ]
  },
  lifestyle: {
    display: '生活 & 健康',
    templates: [
      { name: '营养师', desc: '饮食规划、营养搭配、特殊膳食和减脂增肌饮食', verified: true },
      { name: '健身教练', desc: '个性化训练计划、动作指导和运动科学知识', verified: true },
      { name: '心理健康顾问', desc: '情绪管理、压力缓解、焦虑疏导和心理自助', verified: true },
      { name: '睡眠顾问', desc: '睡眠质量改善、失眠解决方案和睡眠卫生习惯', verified: false },
      { name: '中医养生师', desc: '中医调理、食疗养生、经络按摩和体质辨识', verified: true },
      { name: '瑜伽导师', desc: '瑜伽体式、呼吸法、冥想练习和身心平衡', verified: false },
      { name: '美容护肤顾问', desc: '护肤步骤、产品推荐、肤质分析和抗衰老方案', verified: false },
      { name: '宠物顾问', desc: '宠物喂养、训练、健康护理和行为问题解答', verified: false },
      { name: '园艺专家', desc: '植物养护、花园设计、种植技巧和病虫害防治', verified: false },
      { name: '家居收纳师', desc: '收纳技巧、空间利用、极简生活和断舍离指南', verified: false },
      { name: '红酒品鉴师', desc: '葡萄酒品鉴、产区知识、佐餐搭配和选购建议', verified: false },
      { name: '咖啡大师', desc: '咖啡豆知识、冲泡技巧、拉花艺术和咖啡设备推荐', verified: false },
      { name: '星座分析师', desc: '星座运势、星盘解读、占星知识科普', verified: false },
      { name: '冥想引导师', desc: '冥想练习、呼吸技巧、正念训练和放松引导', verified: true },
      { name: '亲子教育顾问', desc: '育儿知识、儿童心理、亲子沟通和早教方法', verified: true },
    ]
  },
  entertainment: {
    display: '娱乐 & 游戏',
    templates: [
      { name: '电影推荐官', desc: '基于口味的个性化电影推荐、影评和深度解析', verified: true },
      { name: '游戏攻略大师', desc: '游戏攻略、隐藏关卡、装备搭配和技巧教学', verified: true },
      { name: '音乐创作人', desc: '作曲编曲、歌词创作、音乐风格推荐和制作指导', verified: true },
      { name: '表情包大师', desc: '定制表情包、梗图创作、搞笑图文设计', verified: true },
      { name: '动漫专家', desc: '动漫推荐、剧情分析、角色研究和声优资讯', verified: false },
      { name: '小说书评家', desc: '书籍推荐、文学评论、阅读清单和作者研究', verified: false },
      { name: '桌游裁判', desc: '桌游规则解析、策略推荐和游戏评测', verified: false },
      { name: '摄影后期师', desc: '照片调色、构图建议、修图技巧和器材推荐', verified: true },
      { name: '魔术师助手', desc: '魔术教学、舞台表演技巧和近景魔术手法', verified: false },
      { name: 'KTV 歌单助手', desc: 'KTV 选歌、音域分析、演唱技巧和表演建议', verified: false },
      { name: '电竞教练', desc: 'MOBA/FPS 游戏技巧、英雄搭配和团战策略', verified: false },
    ]
  },
  science: {
    display: '科学 & 技术',
    templates: [
      { name: '天文科普师', desc: '宇宙探索、天体知识、太空新闻和观测指南', verified: false },
      { name: '数学家', desc: '高等数学、数论、拓扑学和数学证明', verified: false },
      { name: '密码学专家', desc: '加密算法、区块链技术、安全协议和数字签名', verified: false },
      { name: '气象分析师', desc: '天气预报、气候分析、极端天气预警和环境监测', verified: false },
      { name: '考古学家', desc: '考古发现、历史文物、文明探索和博物馆导览', verified: false },
      { name: '心理学顾问', desc: '心理学知识、行为分析、人格类型和认知科学', verified: true },
      { name: '机械工程师', desc: '机械设计、CAD 建模、材料选择和工程制图', verified: false },
      { name: '电子工程师', desc: '电路设计、嵌入式开发、Arduino/Raspberry Pi', verified: false },
      { name: '环境科学家', desc: '环境保护、碳排放、可持续发展、绿色能源', verified: false },
      { name: '海洋生物学家', desc: '海洋生态、鱼类识别、珊瑚保育和水族饲养', verified: false },
    ]
  },
};

// ─── Generator ─────────────────────────────────────────────────────────

function generateGpts(count = 500) {
  const gpts = [];
  const categoryKeys = Object.keys(CATEGORIES);
  let idCounter = 0;

  // Build priority distribution: try to use all templates first
  const allTemplates = [];
  for (const [catKey, cat] of Object.entries(CATEGORIES)) {
    for (const tpl of cat.templates) {
      allTemplates.push({ catKey, cat, tpl });
    }
  }

  // Round-robin through templates, then repeat with variations
  let round = 0;
  while (gpts.length < count) {
    for (const { catKey, cat, tpl } of allTemplates) {
      if (gpts.length >= count) break;

      // Build variation
      const suffix = round > 0 ? ` v${round + 1}` : '';
      const gptId = `${tpl.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')}${round > 0 ? `-${round + 1}` : ''}`;

      // Capabilities vary by round
      const actions = generateActions(tpl.name, catKey, round);

      gpts.push({
        source: 'gpt-store',
        gpt_id: gptId,
        name: `${tpl.name}${suffix}`,
        description: tpl.desc,
        author: ['AI Labs', 'GPT Studio', 'SkillForge', 'SmartAI', 'NovaTech', 'CloudMind',
                 'DataPulse', 'ApexAI', 'CoreIntelligence', 'MindBridge'][idCounter % 10],
        category: catKey,
        is_verified: tpl.verified && (round < 3),
        actions,
      });

      idCounter++;
    }
    round++;
    // Safety: prevent infinite loop
    if (round > 10) break;
  }

  return gpts;
}

function generateActions(name, category, round) {
  const actionTemplates = {
    developer: [
      { name: '代码生成', desc: `根据需求生成代码实现` },
      { name: '代码审查', desc: `审查代码质量、安全和性能` },
      { name: '调试分析', desc: `分析报错信息并给出修复方案` },
      { name: '代码重构', desc: `优化代码结构和可维护性` },
      { name: '技术问答', desc: `解答技术问题和最佳实践` },
    ],
    writing: [
      { name: '内容创作', desc: `根据主题撰写高质量内容` },
      { name: '润色修改', desc: `优化文本流畅度和表达` },
      { name: '格式转换', desc: `在不同格式间转换文档` },
      { name: '素材搜集', desc: `收集和整理创作素材` },
    ],
    business: [
      { name: '数据分析', desc: `分析数据和生成洞察报告` },
      { name: '方案策划', desc: `制定商业方案和行动计划` },
      { name: '成本估算', desc: `费用预算和ROI预测` },
      { name: '市场研究', desc: `行业研究、竞品分析和趋势预测` },
    ],
    design: [
      { name: '视觉设计', desc: `界面视觉和图形设计` },
      { name: '原型制作', desc: `交互原型和线框图设计` },
      { name: '风格指南', desc: `设计规范和组件库` },
    ],
    education: [
      { name: '课程讲解', desc: `知识点系统讲解和示例` },
      { name: '习题生成', desc: `根据难度定制练习题目` },
      { name: '学习评估', desc: `水平测试和薄弱点分析` },
      { name: '知识问答', desc: `解答疑问和拓展知识` },
    ],
    lifestyle: [
      { name: '方案制定', desc: `根据个人情况定制方案` },
      { name: '建议推荐', desc: `个性化推荐和建议` },
      { name: '问题解答', desc: `解答日常生活问题` },
    ],
    entertainment: [
      { name: '内容推荐', desc: `个性化内容推荐` },
      { name: '创意生成', desc: `创意内容生成和策划` },
      { name: '技巧教学', desc: `技能教学和提升指导` },
    ],
    science: [
      { name: '科学研究', desc: `研究方法和数据分析` },
      { name: '知识科普', desc: `科学知识解释和普及` },
      { name: '实验设计', desc: `实验方案设计和分析` },
    ],
  };

  const templates = actionTemplates[category] || actionTemplates.education;
  // Each round adds more actions
  const maxActions = Math.min(2 + round, templates.length);
  return templates.slice(0, maxActions);
}

// ─── Main ──────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1]) || 500;
  const outFile = args.find(a => a.startsWith('--out='))?.split('=')[1] || join(__dirname, 'gpt-bulk.json');

  console.log(`🧬 生成 ${count} 个 GPT 条目...`);
  const gpts = generateGpts(count);
  writeFileSync(outFile, JSON.stringify(gpts, null, 2));
  console.log(`✅ 已写入: ${outFile}`);

  // Show stats
  const cats = {};
  for (const g of gpts) {
    const c = g.category;
    cats[c] = cats[c] || { count: 0, verified: 0 };
    cats[c].count++;
    if (g.is_verified) cats[c].verified++;
  }
  console.log('\n📊 类别分布:');
  for (const [cat, stats] of Object.entries(cats).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${cat.padEnd(15)} ${String(stats.count).padStart(4)} (verified: ${stats.verified})`);
  }
  console.log(`\n总计: ${gpts.length} 个 GPT 条目`);
  console.log('  其中 verified:', gpts.filter(g => g.is_verified).length);
  console.log('\n下一步: node index.js --dir ./gpt-bulk --register');
}

main();
