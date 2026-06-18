#!/usr/bin/env node

/**
 * GPT Store Bulk Generator — Expanded Edition
 *
 * Generates GPT entries from a comprehensive template library,
 * then converts them all to AMP manifests and registers in index.
 *
 * Usage: node gpt-generator.js [--count 8000] [--out ./gpt-bulk.json]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { toManifest } from './transformers/to-manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Template: GPT personas by category ───────────────────────────────

const CATEGORIES = {
  // ─── 技术 & 开发 ───
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
      { name: 'Kubernetes 专家', desc: 'K8s 集群管理、Pod 调度、服务网格和容器编排', verified: false },
      { name: 'NLP 工程师', desc: '自然语言处理、文本分类、情感分析和机器翻译', verified: false },
      { name: '计算机视觉专家', desc: '图像识别、目标检测、人脸识别和 OCR 技术', verified: false },
      { name: '区块链开发者', desc: '智能合约、DeFi、NFT 和 Web3 技术栈开发', verified: false },
      { name: '数据分析师', desc: 'Python/R 数据分析、Pandas、NumPy 和数据可视化', verified: true },
      { name: '机器学习工程师', desc: '模型训练、特征工程、超参调优和模型部署', verified: true },
      { name: '数据结构导师', desc: '数组/链表/树/图/哈希表原理、实现和面试题', verified: false },
      { name: 'Shell 脚本大师', desc: 'Bash/Zsh 脚本编写、自动化任务和命令行工具', verified: false },
      { name: 'GraphQL 顾问', desc: 'GraphQL Schema 设计、Resolver 和订阅机制', verified: false },
      { name: 'CI/CD 工程师', desc: 'GitHub Actions/Jenkins/GitLab CI 流水线设计', verified: false },
    ]
  },
  // ─── 写作 & 内容 ───
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
      { name: '白皮书撰写', desc: '行业白皮书、研究报告和数据驱动的内容创作', verified: false },
      { name: '产品描述写手', desc: '电商产品描述、卖点提炼和用户痛点分析', verified: false },
      { name: '影评人', desc: '影视评论、剧情分析和观影推荐', verified: false },
      { name: '公关稿件写手', desc: '新闻稿、公关声明和媒体通稿撰写', verified: false },
      { name: '视频脚本师', desc: '抖音/YouTube/B站视频脚本、分镜和节奏设计', verified: false },
      { name: '品牌故事创作者', desc: '品牌故事、品牌使命和品牌价值观传达', verified: false },
    ]
  },
  // ─── 商业 & 营销 ───
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
      { name: '外贸顾问', desc: '国际贸易、海关合规、跨国支付和海外市场拓展', verified: false },
      { name: '特许经营顾问', desc: '加盟模式、品牌授权和连锁经营策略', verified: false },
      { name: '定价策略师', desc: '产品定价、折扣策略、价格弹性分析和盈利模型', verified: false },
      { name: '业务拓展专家', desc: '合作伙伴关系、渠道拓展和战略联盟', verified: false },
    ]
  },
  // ─── 设计 & 创意 ───
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
  // ─── 教育 & 学习 ───
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
      { name: '德语老师', desc: '德语语法、口语和歌德考试备考', verified: false },
      { name: '法语老师', desc: '法语词汇、语法和 DELF 考试辅导', verified: false },
      { name: '日语老师', desc: '五十音、语法和 JLPT 备考训练', verified: false },
      { name: '天文导师', desc: '星空观测、宇宙物理和航天知识', verified: false },
    ]
  },
  // ─── 健康 & 生活 ───
  lifestyle: {
    display: '生活 & 健康',
    templates: [
      { name: '营养师', desc: '饮食规划、营养搭配、特殊膳食和减脂增肌饮食', verified: true },
      { name: '健身教练', desc: '个性化训练计划、动作指导和运动科学知识', verified: true },
      { name: '心理健康顾问', desc: '情绪管理、压力缓解、焦虑疏导和心理自助', verified: true },
      { name: '睡眠顾问', desc: '睡眠质量改善、失眠解决方案和睡眠卫生习惯', verified: false },
      { name: '中医养生师', desc: '中医调理、食疗养生、经络按摩和体质辨识', verified: true },
      { name: '瑜伽导师', desc: '瑜伽体式、呼吸法、冥想练习和身心平衡', verified: false },
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
  // ─── 娱乐 & 游戏 ───
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
  // ─── 科学 & 技术 ───
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
  // ═══════════════════════════════════════════════════════════
  // 🆕 新增品类 —— 不限制品类
  // ═══════════════════════════════════════════════════════════

  // ─── 美妆 & 美容 ───
  beauty: {
    display: '美妆与美容',
    templates: [
      { name: '美容护肤顾问', desc: '护肤步骤、产品推荐、肤质分析和抗衰老方案', verified: true },
      { name: '彩妆教程师', desc: '日常妆、派对妆、新娘妆教程和产品推荐', verified: true },
      { name: '美甲设计师', desc: '美甲图案设计、甲型选择、美甲产品推荐和保养', verified: false },
      { name: '发型设计师', desc: '发型推荐、烫染指导、头发护理和造型技巧', verified: true },
      { name: '香水顾问', desc: '香调分析、香水推荐、层次搭配和个人签名香', verified: false },
      { name: '医美咨询师', desc: '医美项目科普、术后护理、机构选择和风险评估', verified: false },
      { name: '化妆品成分分析师', desc: '成分解读、安全评估、敏感肌友好配方推荐', verified: false },
      { name: '护肤品研究员', desc: '抗衰老、美白、保湿等护肤成分机制深度研究', verified: false },
      { name: 'SPA 理疗师', desc: '水疗项目推荐、身体护理、精油按摩和放松疗法', verified: false },
      { name: '脱毛护理师', desc: '脱毛方法对比、术后护理和皮肤准备指导', verified: false },
      { name: '抗衰老顾问', desc: '抗衰老护肤品、内服保养品和生活习惯建议', verified: false },
      { name: '毛孔管理专家', desc: '黑头/粉刺清理、毛孔收缩和皮肤清洁方案', verified: false },
      { name: '痘痘肌护理师', desc: '痘痘成因分析、护理方案和痘印淡化方法', verified: false },
      { name: '美白顾问', desc: '美白成分分析、防晒知识和肤色均匀方案', verified: false },
      { name: '美容仪器评测师', desc: '美容仪对比评测、使用手法和效果分析', verified: false },
      { name: '面膜搭配师', desc: '面膜类型推荐、敷法指导和功效最大化方案', verified: false },
      { name: '身体护理师', desc: '身体磨砂、润肤、纤体紧致和妊娠纹护理', verified: false },
      { name: '眼唇护理专家', desc: '眼霜唇膏推荐、眼周护理和唇部保养方案', verified: false },
      { name: '日系妆容顾问', desc: '日系清透妆、韩系水光妆、欧美妆效果对比', verified: false },
    ]
  },
  // ─── 时尚 & 穿搭 ───
  fashion: {
    display: '时尚与穿搭',
    templates: [
      { name: '个人形象顾问', desc: '形象诊断、风格定位、衣橱规划和场合着装', verified: true },
      { name: '穿搭顾问', desc: '根据身材/肤色/气质推荐服饰搭配和风格', verified: true },
      { name: '奢侈品鉴定师', desc: '奢侈品真伪鉴定、保养指南和二手交易建议', verified: false },
      { name: '潮流趋势分析师', desc: '当季流行趋势、秀场解析和时尚单品推荐', verified: true },
      { name: '珠宝顾问', desc: '珠宝选购、品质评级、搭配技巧和保养知识', verified: false },
      { name: '手表收藏家', desc: '腕表知识、品牌故事、机芯类型和收藏建议', verified: false },
      { name: '鞋履搭配师', desc: '鞋型选择、颜色搭配、舒适度考量和场合推荐', verified: false },
      { name: '包包顾问', desc: '包款推荐、皮质保养、容量分析和搭配指南', verified: false },
      { name: '色彩分析师', desc: '个人色彩四季理论分析、最适合的色系诊断', verified: false },
      { name: '男士穿搭顾问', desc: '商务/休闲/运动风格男装搭配和衣橱建设', verified: false },
      { name: '商务着装顾问', desc: '职场穿搭、面试着装和商务社交场合着装规范', verified: false },
      { name: '大码穿搭师', desc: '大码身材穿搭技巧、显瘦方案和品牌推荐', verified: false },
      { name: '小众设计师品牌猎手', desc: '独立设计师品牌挖掘和独特单品推介', verified: false },
      { name: '街头风格顾问', desc: '街拍风格、运动潮牌和混搭创意指导', verified: false },
      { name: '二手时尚顾问', desc: '古着/Vintage 选购、中古市场指南', verified: false },
    ]
  },
  // ─── 美食 & 烹饪 ───
  food: {
    display: '美食与烹饪',
    templates: [
      { name: '中餐大厨', desc: '中华料理、八大菜系、家常菜和宴席菜谱', verified: true },
      { name: '西餐厨师', desc: '法餐、意餐、牛排烹饪和西餐摆盘技巧', verified: true },
      { name: '烘焙师', desc: '面包、蛋糕、甜点、饼干烘焙配方和技巧', verified: true },
      { name: '甜品大师', desc: '法式甜点、冰淇淋、布丁和糖艺制作', verified: false },
      { name: '调酒师', desc: '鸡尾酒配方、调酒技巧、基酒知识和酒吧文化', verified: false },
      { name: '日本料理师傅', desc: '寿司、刺身、拉面、天妇罗和日式便当制作', verified: false },
      { name: '素食料理师', desc: '纯素/蛋奶素食谱、营养均衡和创意素食', verified: false },
      { name: '美食评论家', desc: '餐厅评测、美食探店、口味分析和评分推荐', verified: false },
      { name: '茶艺师', desc: '茶文化、泡茶技巧、茶叶品鉴和茶具推荐', verified: true },
      { name: '咖啡烘豆师', desc: '咖啡烘焙曲线、生豆选购、杯测和冲煮方案', verified: false },
      { name: '减脂餐规划师', desc: '低卡食谱、蛋白质搭配、热量计算和便当设计', verified: true },
      { name: '发酵食品专家', desc: '自制酸奶、面包发酵、泡菜酿造和发酵原理', verified: false },
      { name: '东南亚料理师', desc: '泰餐、越菜、马来菜特色配方和香料运用', verified: false },
      { name: '街头小吃大师', desc: '各地特色小吃做法、摆摊技巧和配方改良', verified: false },
      { name: '酱料调配师', desc: '各类酱料配方、蘸料搭配和复合调味技巧', verified: false },
      { name: '便当造型师', desc: '卡通便当、减脂便当、营养搭配和摆盘艺术', verified: false },
      { name: '韩国料理师', desc: '韩式拌饭、烤肉、泡菜锅和韩式小菜做法', verified: false },
      { name: '食材百科师', desc: '食材产地、时令推荐、挑选技巧和储存方法', verified: false },
      { name: '刀工教练', desc: '切菜技巧、食材切割、摆盘刀工和厨房安全', verified: false },
    ]
  },
  // ─── 旅游 & 出行 ───
  travel: {
    display: '旅游与出行',
    templates: [
      { name: '旅行规划师', desc: '行程设计、景点推荐、交通安排和预算控制', verified: true },
      { name: '酒店测评师', desc: '酒店对比评测、积分策略、会员权益和预订技巧', verified: true },
      { name: '背包客向导', desc: '穷游攻略、青旅推荐、省钱技巧和独行安全指南', verified: false },
      { name: '自驾游专家', desc: '自驾路线、沿途景点、车辆准备和露营指南', verified: false },
      { name: '出境游顾问', desc: '签证办理、海关规定、海外安全和文化禁忌', verified: true },
      { name: '亲子游规划师', desc: '亲子目的地、儿童设施、保险和安全建议', verified: false },
      { name: '蜜月旅行策划', desc: '蜜月目的地、浪漫体验、酒店升级策略', verified: false },
      { name: '美食旅行家', desc: '全球美食地图、美食节攻略和当地必吃指南', verified: false },
      { name: '摄影旅行博主', desc: '拍照机位推荐、黄金时间规划和旅拍技巧', verified: false },
      { name: '户外探险家', desc: '徒步路线、登山装备、户外安全和紧急救援', verified: false },
      { name: '海岛度假顾问', desc: '马尔代夫/巴厘岛/普吉等海岛选岛和活动推荐', verified: false },
      { name: '城市漫游向导', desc: '城市徒步路线、小众景点、文艺打卡地推荐', verified: false },
      { name: '火车旅行达人', desc: '火车路线、沿途风景、卧铺体验和铁路文化', verified: false },
      { name: '滑雪度假规划师', desc: '雪场推荐、装备租赁、滑雪课程和度假村选择', verified: false },
      { name: '游轮旅行顾问', desc: '邮轮航线、船上活动、岸上观光和选舱建议', verified: false },
    ]
  },
  // ─── 法律 & 合规 ───
  legal: {
    display: '法律与合规',
    templates: [
      { name: '法律顾问', desc: '法律咨询、合同审查、纠纷解决和法律风险提示', verified: true },
      { name: '知识产权律师', desc: '商标注册、专利申请、版权保护和侵权分析', verified: true },
      { name: '劳动合同专家', desc: '劳动关系、劳动合同、离职补偿和劳动仲裁', verified: true },
      { name: '公司法务助手', desc: '公司设立、章程起草、股东协议和公司治理', verified: true },
      { name: '房产法律顾问', desc: '购房合同、产权登记、租赁纠纷和继承法律', verified: false },
      { name: '婚姻法律师', desc: '婚前协议、离婚财产分割、子女抚养权问题', verified: false },
      { name: '刑事法律顾问', desc: '刑事案件流程、辩护策略、取保候审和减刑', verified: false },
      { name: '消费者权益保护', desc: '消费纠纷、退换货维权、产品质量投诉处理', verified: false },
      { name: '数据隐私律师', desc: 'GDPR/个人信息保护法、数据合规和隐私政策', verified: true },
      { name: '国际法律师', desc: '跨国贸易法、国际仲裁和跨境合同法律适用', verified: false },
      { name: '移民律师', desc: '签证申请、永久居留、入籍流程和移民法规', verified: false },
      { name: '税法咨询师', desc: '个税申报、企业税务、税收优惠和税务筹划', verified: true },
      { name: '交通事故法律顾问', desc: '事故责任认定、保险理赔和人身损害赔偿', verified: false },
    ]
  },
  // ─── 体育 & 运动 ───
  sports: {
    display: '体育与运动',
    templates: [
      { name: '跑步教练', desc: '跑步姿势、训练计划、马拉松备战和伤病预防', verified: true },
      { name: '篮球教练', desc: '篮球技术、战术分析、体能训练和比赛策略', verified: false },
      { name: '足球分析师', desc: '比赛战术分析、球员数据、球队阵型和转会分析', verified: false },
      { name: '游泳教练', desc: '泳姿教学、呼吸技巧、训练计划和水中安全', verified: false },
      { name: '网球教练', desc: '发球/截击/底线技术、体能训练和比赛心理', verified: false },
      { name: '高尔夫教练', desc: '挥杆动作、球场策略、装备选购和规则讲解', verified: false },
      { name: '攀岩教练', desc: '攀岩技巧、路线阅读、装备选择和训练方法', verified: false },
      { name: '拳击教练', desc: '拳法技术、步法训练、体能储备和防守技巧', verified: false },
      { name: '马术导师', desc: '骑术教学、马匹护理、装备选择和赛事规则', verified: false },
      { name: '街舞教练', desc: 'Breaking/Popping/Locking/Hiphop 舞步教学', verified: false },
      { name: '滑雪教练', desc: '双板/单板滑雪技术、雪道选择和装备推荐', verified: false },
      { name: '冲浪教练', desc: '冲浪技巧、浪型判断、板类选择和海洋安全', verified: false },
      { name: '太极教练', desc: '太极拳套路、气功练习、养生和武学哲学', verified: false },
      { name: '体育博彩分析', desc: '赛前数据分析、赔率解读和风险管理', verified: false },
      { name: '运动康复师', desc: '运动损伤恢复、拉伸方案、理疗和康复训练', verified: true },
    ]
  },
  // ─── 音乐 & 表演 ───
  music: {
    display: '音乐与表演',
    templates: [
      { name: '钢琴老师', desc: '钢琴指法、乐理知识、曲目教学和演奏技巧', verified: true },
      { name: '吉他老师', desc: '吉他和弦、扫弦技巧、指弹和弹唱教学', verified: true },
      { name: '声乐教练', desc: '发声方法、音域扩展、气息控制和歌曲演绎', verified: true },
      { name: '作曲编曲师', desc: '作曲理论、编曲技巧、配器和音乐制作软件指导', verified: false },
      { name: '鼓手教练', desc: '鼓点节奏、手脚配合、架子鼓技巧和打击乐训练', verified: false },
      { name: '古筝老师', desc: '古筝指法、曲目演奏、民族音乐文化和考级指导', verified: false },
      { name: '二胡导师', desc: '二胡弓法、练习曲、民乐合奏和演奏表现力', verified: false },
      { name: 'DJ 混音师', desc: '混音技巧、曲目编排、设备操作和电子音乐制作', verified: false },
      { name: '音乐制作人', desc: '录音、混音、母带处理和音乐制作的完整流程', verified: false },
      { name: '乐理教师', desc: '音阶、调式、和弦、节奏和视唱练耳训练', verified: false },
      { name: '合唱指挥', desc: '合唱团排练、声部分配、指挥技法', verified: false },
      { name: '口琴教师', desc: '布鲁斯口琴和半音阶口琴演奏技巧', verified: false },
    ]
  },
  // ─── 摄影 & 摄像 ───
  photography: {
    display: '摄影与摄像',
    templates: [
      { name: '摄影导师', desc: '相机操作、曝光三角、构图原则和拍摄技巧', verified: true },
      { name: '修图师', desc: 'Lightroom/Photoshop 修图、调色和人像精修', verified: true },
      { name: '人像摄影师', desc: '人像摆姿、光线运用、外景选择和后期风格', verified: false },
      { name: '风光摄影师', desc: '日出日落、长曝光、滤镜使用和星空摄影', verified: false },
      { name: '产品摄影顾问', desc: '电商产品拍摄、布光技巧、白底图和场景图', verified: false },
      { name: '手机摄影达人', desc: '手机拍照技巧、构图法则、手机后期和短视频', verified: true },
      { name: '航拍专家', desc: '无人机操作、航拍构图、法规要求和飞行安全', verified: false },
      { name: '婚礼摄影师', desc: '婚礼跟拍、流程把控、纪实风格和后期交付', verified: false },
      { name: '胶片摄影顾问', desc: '胶片相机、底片选择、暗房冲洗和扫描数字化', verified: false },
      { name: '视频剪辑师', desc: '剪映/Premiere/Final Cut 剪辑、转场和调色', verified: true },
      { name: 'Vlog 博主导师', desc: 'Vlog 选题、拍摄脚本、器材选择和频道运营', verified: false },
      { name: '街拍摄影师', desc: '街头抓拍、纪实摄影、黑白摄影和构图训练', verified: false },
    ]
  },
  // ─── 宠物 & 动物 ───
  pets: {
    display: '宠物与动物',
    templates: [
      { name: '狗狗训练师', desc: '服从训练、行为矫正、社交训练和小狗教育', verified: true },
      { name: '猫咪护理师', desc: '猫咪行为解读、喂养指南、健康护理和环境丰富', verified: true },
      { name: '宠物营养师', desc: '宠粮选择、自制鲜食、营养补充和体重管理', verified: false },
      { name: '宠物医生', desc: '常见疾病、预防接种、驱虫计划和急救知识', verified: false },
      { name: '宠物美容师', desc: '宠物洗澡、剪毛、造型设计和护理技巧', verified: false },
      { name: '水族饲养师', desc: '鱼缸造景、水质管理、鱼类选择和疾病防治', verified: false },
      { name: '鸟类饲养顾问', desc: '鹦鹉/金丝雀等鸟类的饲养、训练和健康指南', verified: false },
      { name: '兔子护理专家', desc: '兔兔喂养、笼舍布置、健康检查和行为解读', verified: false },
      { name: '宠物寄养顾问', desc: '寄养选择、宠物酒店对比和出行准备清单', verified: false },
      { name: '宠物摄影家', desc: '宠物拍摄技巧、抓拍时机和后期修图指导', verified: false },
    ]
  },
  // ─── 家居 & 装修 ───
  home: {
    display: '家居与装修',
    templates: [
      { name: '室内设计师', desc: '家居设计、风格定位、空间规划和软装搭配', verified: true },
      { name: '装修顾问', desc: '装修流程、材料选择、预算控制和施工监管', verified: true },
      { name: '收纳整理师', desc: '家居收纳、断舍离、衣橱整理和空间利用', verified: false },
      { name: '智能家居专家', desc: '智能设备选型、自动化场景设计和安装调试', verified: true },
      { name: '家具选购顾问', desc: '家具风格搭配、材质对比、尺寸测量和性价比分析', verified: false },
      { name: '绿植养护师', desc: '室内植物选择、养护方法、病虫害防治和园艺设计', verified: false },
      { name: '灯光设计师', desc: '家居灯光布局、色温选择、氛围照明和智能控制', verified: false },
      { name: '油漆色彩顾问', desc: '墙面色彩方案、乳胶漆选择和涂刷工艺指导', verified: false },
      { name: '清洁达人', desc: '家居清洁技巧、清洁剂推荐、深度保洁攻略', verified: false },
      { name: '窗帘搭配师', desc: '窗帘面料选择、款式搭配、尺寸测量和安装建议', verified: false },
      { name: '除螨防护师', desc: '过敏原防护、除螨方案和空气质量改善', verified: false },
      { name: '卫生间改造专家', desc: '干湿分离、浴室柜选择、防水和空间利用', verified: false },
    ]
  },
  // ─── 汽车 & 出行 ───
  automotive: {
    display: '汽车与出行',
    templates: [
      { name: '汽车选购顾问', desc: '车型对比、预算推荐、试驾指导和性价比分析', verified: true },
      { name: '汽车维修师', desc: '故障诊断、保养指南、维修方案和零部件知识', verified: true },
      { name: '电动车顾问', desc: '电动车选购、充电方案、续航对比和使用成本', verified: true },
      { name: '赛车教练', desc: '赛道驾驶技术、圈速分析、改装建议和赛车执照', verified: false },
      { name: '二手车鉴定师', desc: '二手车检测、车况评估、砍价技巧和交易流程', verified: false },
      { name: '汽车改装专家', desc: '外观改装、性能提升、ECU 调校和合规备案', verified: false },
      { name: '摩托车爱好者', desc: '摩托车型推荐、骑行装备、驾照和保险指南', verified: false },
      { name: '汽车养护师', desc: '保养周期、机油选择、轮胎更换和季节性保养', verified: false },
      { name: '汽车保险顾问', desc: '保险险种对比、理赔流程和车险省钱技巧', verified: false },
      { name: '露营RV 专家', desc: '房车选购、露营装备、营地推荐和公路旅行', verified: false },
      { name: '儿童安全座椅顾问', desc: '安全座椅选择、安装指导和年龄段推荐', verified: false },
    ]
  },
  // ─── 亲子 & 育儿 ───
  parenting: {
    display: '亲子与育儿',
    templates: [
      { name: '育儿专家', desc: '0-6岁育儿知识、喂养指南、生长发育和早教', verified: true },
      { name: '孕期顾问', desc: '孕期营养、产检指南、胎教方法和产前准备', verified: true },
      { name: '母乳喂养指导', desc: '哺乳姿势、追奶方法、堵奶处理和断奶建议', verified: true },
      { name: '睡眠训练师', desc: '宝宝睡眠规律培养、哄睡技巧和作息建立', verified: false },
      { name: '辅食制作师', desc: '宝宝辅食添加顺序、食谱制作和营养搭配', verified: true },
      { name: '早教顾问', desc: '蒙台梭利、感统训练、绘本推荐和亲子游戏', verified: false },
      { name: '多语言育儿', desc: '双语/多语言宝宝培养方法和语言环境塑造', verified: false },
      { name: '特殊教育顾问', desc: '自闭症/多动症/发育迟缓的早期干预和家庭教育', verified: false },
      { name: '青少年心理顾问', desc: '青春期沟通、叛逆期引导、学业压力和社交问题', verified: true },
      { name: '儿童营养师', desc: '儿童挑食应对、营养均衡和健康成长饮食方案', verified: false },
      { name: '母乳储存顾问', desc: '母乳储存、解冻和运输的卫生安全指南', verified: false },
      { name: '幼儿疾病护理', desc: '儿童常见病护理、发烧处理和安全用药指导', verified: false },
      { name: '婴儿抚触按摩', desc: '婴儿抚触手法、亲子按摩和触觉发育促进', verified: false },
      { name: '入园准备顾问', desc: '分离焦虑应对、自理能力培养和幼儿园选择', verified: false },
      { name: 'STEM 早教导师', desc: '科学/技术/工程/数学启蒙活动和教具推荐', verified: false },
    ]
  },
  // ─── 农业 & 种植 ───
  agriculture: {
    display: '农业与种植',
    templates: [
      { name: '农业技术员', desc: '种植技术、病虫害防治、土壤改良和田间管理', verified: true },
      { name: '有机农业顾问', desc: '有机认证、自然农法、堆肥制作和生态种植', verified: false },
      { name: '果蔬种植专家', desc: '蔬菜水果种植、育苗、施肥和采收技术', verified: false },
      { name: '花卉栽培师', desc: '鲜花种植、花期调控、商品花养护和品种推荐', verified: false },
      { name: '水产养殖顾问', desc: '鱼虾蟹养殖、水质调控、饲料配比和病害防治', verified: false },
      { name: '畜牧兽医', desc: '牛羊猪鸡养殖、疫病防控、繁殖管理和饲料配方', verified: false },
      { name: '温室大棚专家', desc: '温室设计、环境控制、智能农业和设施栽培', verified: false },
      { name: '盆景艺术师', desc: '盆景修剪、造型设计、养护技巧和树种选择', verified: false },
      { name: '食用菌种植师', desc: '香菇/平菇/金针菇等食用菌栽培技术', verified: false },
      { name: '城市阳台种植', desc: '阳台菜园、盆栽蔬果、香草种植和小空间园艺', verified: false },
    ]
  },
  // ─── 手工艺 & 创意 ───
  craft: {
    display: '手工艺与DIY',
    templates: [
      { name: '编织老师', desc: '棒针/钩针编织、毛衣/围巾/玩偶制作教程', verified: false },
      { name: '木工师傅', desc: '木工基础、榫卯结构、家具制作和木材选择', verified: false },
      { name: '陶艺家', desc: '拉坯、修坯、施釉和烧制技巧', verified: false },
      { name: '剪纸艺术家', desc: '剪纸图案设计、剪刀/刻刀技法和装裱', verified: false },
      { name: '刺绣导师', desc: '苏绣/湘绣/十字绣针法技巧和图案设计', verified: false },
      { name: '皮革工艺师', desc: '皮具制作、皮雕工艺、染色和缝线技术', verified: false },
      { name: '香薰蜡烛师', desc: '手工蜡烛制作、香调搭配和模具选择', verified: false },
      { name: '手工皂制作师', desc: '冷制皂/皂基皂配方、天然添加物和包装', verified: false },
      { name: '首饰设计师', desc: '串珠/绕线/金属丝首饰设计和制作教学', verified: false },
      { name: '折纸艺术家', desc: '折纸技巧、设计原理、进阶折纸和立体折纸', verified: false },
      { name: '模型制作师', desc: '高达/GK/场景模型制作、喷涂和旧化技巧', verified: false },
      { name: '微缩景观师', desc: '微缩场景、食玩、黏土手办和迷你造景', verified: false },
      { name: '扎染艺术家', desc: '扎染技法、蓝染工艺和布料染色创意', verified: false },
      { name: '花艺师', desc: '花束设计、插花技巧、花材选择和花店运营', verified: true },
      { name: '书法老师', desc: '毛笔书法、硬笔书法、字体临帖和创作', verified: true },
      { name: '国画老师', desc: '国画花鸟/山水/人物技法、墨法和构图', verified: false },
      { name: '油画导师', desc: '油画技法、色彩调配、画布准备和作品赏析', verified: false },
      { name: '水彩画家', desc: '水彩技法、湿画/干画法、留白技巧和风景写生', verified: false },
    ]
  },
  // ─── 建筑 & 房地产 ───
  realestate: {
    display: '建筑与房地产',
    templates: [
      { name: '购房顾问', desc: '购房流程、贷款政策、区域选择和风险提示', verified: true },
      { name: '房产投资分析师', desc: '房产价值评估、租金回报率、投资策略和市场趋势', verified: true },
      { name: '房东管理助手', desc: '出租管理、租客筛选、租赁合同和维修处理', verified: false },
      { name: '建筑设计师', desc: '建筑设计、施工图绘制、BIM 和结构安全', verified: true },
      { name: '风水师', desc: '家居风水布局、办公室风水、阳宅吉凶分析', verified: false },
      { name: '物业纠纷调解', desc: '物业费争议、邻里纠纷、公共区域使用问题', verified: false },
      { name: '首次购房教练', desc: '首付规划、贷款预批、看房清单和谈判策略', verified: true },
      { name: '海外房产顾问', desc: '海外置业、移民房产、税务和法律注意事项', verified: false },
      { name: '商铺选址专家', desc: '商业选址分析、人流量评估和租金谈判', verified: false },
      { name: '建材顾问', desc: '建筑材料对比、环保等级、性价比和施工建议', verified: false },
    ]
  },
  // ─── 文化艺术 ───
  culture: {
    display: '文化与传统',
    templates: [
      { name: '博物馆导览', desc: '全球博物馆藏品讲解、展览推荐和艺术史', verified: false },
      { name: '中国文化老师', desc: '国学经典、唐诗宋词、传统文化和节日风俗', verified: true },
      { name: '文物鉴定师', desc: '古董字画鉴定、瓷器青铜器评估和收藏建议', verified: false },
      { name: '民俗研究师', desc: '民间习俗、非遗文化、传统节日和地域文化', verified: false },
      { name: '西方艺术史家', desc: '文艺复兴/印象派/现代艺术流派讲解和赏析', verified: false },
      { name: '日本文化顾问', desc: '日本传统文化、茶道花道、动漫文化和旅行', verified: false },
      { name: '佛教文化顾问', desc: '佛学入门、禅修方法、佛教艺术和经典解读', verified: false },
      { name: '神话传说专家', desc: '希腊神话、北欧神话、中国神话故事和解读', verified: false },
      { name: '非物质文化遗产顾问', desc: '非遗项目介绍、保护和传承案例', verified: false },
    ]
  },
  // ─── 身心健康 ───
  wellness: {
    display: '身心健康',
    templates: [
      { name: '冥想导师', desc: '正念冥想、呼吸冥想、身体扫描和日常练习', verified: true },
      { name: '压力管理师', desc: '压力源分析、放松技巧、时间管理和工作生活平衡', verified: true },
      { name: '情绪管理顾问', desc: '情绪识别、愤怒管理、焦虑缓解和积极心理', verified: true },
      { name: '康复理疗师', desc: '运动损伤、术后康复、物理治疗和功能训练', verified: false },
      { name: '亚健康调理师', desc: '疲劳管理、免疫力提升、作息调整和身体调理', verified: false },
      { name: '禁食指导师', desc: '间歇性禁食方案、轻断食和营养补充指导', verified: false },
      { name: '芳香疗法师', desc: '精油使用、香薰疗法、按摩油调配和身心放松', verified: false },
      { name: '太极拳教练', desc: '24式/42式太极拳、八段锦和五禽戏教学', verified: false },
      { name: '气功导师', desc: '站桩、导引术、内功修炼和养生功法', verified: false },
      { name: '舞蹈治疗师', desc: '舞动疗法、身心整合和表达性艺术治疗', verified: false },
    ]
  },
  // ─── 玄学 & 命理 ───
  metaphysics: {
    display: '玄学与命理',
    templates: [
      { name: '八字命理师', desc: '四柱八字排盘、运势分析和流年大运解读', verified: false },
      { name: '紫微斗数大师', desc: '紫微命盘、十二宫分析、事业财运和桃花', verified: false },
      { name: '塔罗占卜师', desc: '塔罗牌解读、牌阵分析和占卜咨询', verified: false },
      { name: '周公解梦', desc: '梦境解析、潜意识解读和心理象征分析', verified: false },
      { name: '姓名学顾问', desc: '姓名笔画吉凶、五行补益和改名建议', verified: false },
      { name: '手相面相师', desc: '手相纹路解读、面相分析和运势判断', verified: false },
      { name: '星座塔罗师', desc: '星座运势、月相分析、行星运行和命理综合', verified: false },
      { name: '奇门遁甲顾问', desc: '奇门预测、择日、方位选择和决策指导', verified: false },
      { name: '六爻占卜师', desc: '六爻起卦、卦象解读和吉凶判断', verified: false },
    ]
  },
  // ─── 金融 & 投资 ───
  finance: {
    display: '金融与投资',
    templates: [
      { name: '股票分析师', desc: '股票基本面/技术面分析、选股策略和投资组合', verified: true },
      { name: '基金顾问', desc: '基金定投策略、指数基金选择和组合配置', verified: true },
      { name: '加密货币专家', desc: '比特币/以太坊、DeFi、NFT 和交易策略', verified: false },
      { name: '期货交易员', desc: '期货合约、套期保值、技术分析和风险管理', verified: false },
      { name: '外汇交易顾问', desc: '外汇市场分析、货币对交易和趋势判断', verified: false },
      { name: '保险规划师', desc: '寿险/重疾/医疗/意外险选购和保障方案设计', verified: true },
      { name: '退休规划师', desc: '养老计划、养老金计算、退休生活财务安排', verified: true },
      { name: '信用管理师', desc: '信用评分提升、信用卡选择和个人债务管理', verified: false },
      { name: '天使投资顾问', desc: '早期项目评估、投资条款和退出策略', verified: false },
      { name: '量化交易师', desc: '量化策略开发、回测框架和算法交易', verified: false },
      { name: '黄金投资顾问', desc: '黄金/白银价格分析、实物黄金和 ETF 投资', verified: false },
      { name: '房地产投资信托分析师', desc: 'REITs 分析、分红评估和资产组合配置', verified: false },
    ]
  },
  // ─── 军事 & 国防 ───
  military: {
    display: '军事与国防',
    templates: [
      { name: '军事分析师', desc: '地缘政治、军力对比、武器装备和国际安全', verified: false },
      { name: '战机专家', desc: '战斗机型号对比、飞行性能、航电和武器系统', verified: false },
      { name: '海军军事顾问', desc: '舰艇分类、航母战斗群、海军战略和技术', verified: false },
      { name: '军事历史学家', desc: '经典战役分析、战争史、军事思想和战略演变', verified: false },
      { name: '枪械专家', desc: '枪械分类、射击原理、弹药知识和安全操作', verified: false },
      { name: '军事模型师', desc: '军事模型制作、场景搭建和比例收藏指导', verified: false },
      { name: '战争游戏策略师', desc: '兵棋推演、战略游戏分析和战术教学', verified: false },
    ]
  },
  // ─── 航空航天 ───
  aerospace: {
    display: '航空航天',
    templates: [
      { name: '航天科普师', desc: '火箭/卫星/空间站知识、航天历史和未来计划', verified: false },
      { name: '飞行员教练', desc: '飞行原理、仪表飞行、航空规则和模拟训练', verified: false },
      { name: '无人机飞手', desc: '无人机操作、航拍技巧、法规遵守和商业应用', verified: false },
      { name: '飞机工程师', desc: '飞机结构、引擎原理、航空电子和维修技术', verified: false },
      { name: '太空探索顾问', desc: '太空任务、行星探索、火星殖民和太空旅游', verified: false },
      { name: '航空旅行达人', desc: '航班选择、里程积累、休息室攻略和常旅客计划', verified: false },
      { name: '飞行模拟爱好者', desc: '微软模拟飞行/X-Plane 操作技巧和外设推荐', verified: false },
    ]
  },
  // ─── 婚恋 & 社交 ───
  dating: {
    display: '婚恋与社交',
    templates: [
      { name: '恋爱顾问', desc: '恋爱技巧、关系建议、约会策划和沟通方法', verified: false },
      { name: '失恋疗愈师', desc: '分手心理疏导、自我重建和情感疗愈', verified: false },
      { name: '婚姻咨询师', desc: '婚姻沟通、冲突化解、信任重建和亲密关系', verified: true },
      { name: '社交焦虑辅导', desc: '社交恐惧克服、自信建立和人际交往技巧', verified: false },
      { name: '交友软件顾问', desc: '个人资料优化、照片选择、聊天技巧和安全提醒', verified: false },
      { name: '相亲规划师', desc: '相亲准备、话题库、后续跟进和婚恋定位', verified: false },
      { name: '远距离恋爱顾问', desc: '异地恋沟通技巧、见面规划和关系维护', verified: false },
      { name: '分手复合指导', desc: '断联策略、自我提升和关系修复', verified: false },
    ]
  },
  // ─── 国学 & 传统文化 ───
  chinese_traditional: {
    display: '国学与传统文化',
    templates: [
      { name: '国学大师', desc: '论语、孟子、道德经等经典解读和国学智慧', verified: true },
      { name: '易经占卜师', desc: '周易卦象、64卦解读、占卜方法和人生指导', verified: false },
      { name: '古诗词老师', desc: '唐诗宋词鉴赏、格律诗词创作和文学典故', verified: true },
      { name: '书法老师', desc: '毛笔书法、硬笔书法、字体临帖和创作', verified: true },
      { name: '中医基础咨询', desc: '中医基础理论、阴阳五行、经络穴位和养生原则', verified: true },
      { name: '茶道老师', desc: '中国茶文化、泡茶技艺、茶具鉴赏和茶道精神', verified: true },
      { name: '汉服顾问', desc: '汉服款式、形制知识、穿搭搭配和礼仪文化', verified: false },
      { name: '象棋老师', desc: '中国象棋开局、布局和中残局战术', verified: false },
      { name: '香道老师', desc: '中国香文化、合香技艺、香具和品香礼仪', verified: false },
      { name: '古典哲学顾问', desc: '儒家/道家/佛家思想对比分析和现代应用', verified: false },
    ]
  },
  // ─── 游戏竞技 ───
  gaming: {
    display: '游戏与电竞',
    templates: [
      { name: '游戏攻略大师', desc: '各类游戏通关攻略、隐藏要素和成就解锁', verified: true },
      { name: 'LOL 战术教练', desc: '英雄联盟英雄搭配、对线技巧和团战策略', verified: false },
      { name: '王者荣耀导师', desc: '英雄出装、铭文搭配、运营思路和操作技巧', verified: false },
      { name: '原神冒险家', desc: '角色配队、圣遗物选择、元素反应和地图探索', verified: false },
      { name: 'DOTA 2 分析师', desc: '分路策略、装备选择、团队配合和高阶技巧', verified: false },
      { name: '绝地求生教练', desc: '跳伞选址、搜装备路线、枪法和决赛圈策略', verified: false },
      { name: '我的世界建筑师', desc: '红石技术、建筑构造、生存技巧和模组推荐', verified: false },
      { name: '主机游戏评测师', desc: 'PS5/Xbox/Switch 游戏评测、打折信息和推荐', verified: false },
      { name: 'Steam 游戏猎手', desc: '独立游戏推荐、史低提醒、游戏库管理和成就', verified: false },
      { name: '游戏配音师', desc: '角色配音、配音技巧、录音设备和试音指南', verified: false },
      { name: '桌游规则裁判', desc: '桌游规则解析、策略推荐和游戏评测', verified: false },
      { name: 'MMORPG 导师', desc: '魔兽世界/FF14 副本攻略、职业指导和公会管理', verified: false },
      { name: '游戏翻译顾问', desc: '游戏本地化、汉化补丁和语言包管理', verified: false },
    ]
  },
  // ─── 教育留学 ───
  study_abroad: {
    display: '留学与升学',
    templates: [
      { name: '留学顾问', desc: '院校选择、申请流程、文书指导和签证办理', verified: true },
      { name: '雅思备考教练', desc: '雅思听说读写技巧、模考分析和提分策略', verified: true },
      { name: '托福备考专家', desc: '托福备考计划、口语模板、写作批改和刷题策略', verified: true },
      { name: 'GRE 考试导师', desc: 'GRE 词汇、数学、写作和逻辑推理系统训练', verified: false },
      { name: 'GMAT 考试教练', desc: 'GMAT 语文/数学/IR/AWA 各科备考和应试策略', verified: false },
      { name: '考研规划师', desc: '考研院校选择、公共课/专业课复习和时间规划', verified: true },
      { name: '高考志愿填报', desc: '高考分数分析、院校投档、专业选择和志愿策略', verified: true },
      { name: '论文写作辅导', desc: '开题报告、文献综述、数据分析和论文格式指导', verified: true },
      { name: '奖学金申请顾问', desc: '奖学金信息搜集、申请材料和面试准备', verified: false },
      { name: '留学生活指南', desc: '住宿选择、文化适应、part-time 工作和安全提醒', verified: false },
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

  console.log(`🧬 模板总数: ${allTemplates.length}`);

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

      // Authors rotate through larger set
      const authors = ['AI Labs', 'GPT Studio', 'SkillForge', 'SmartAI', 'NovaTech', 'CloudMind',
                 'DataPulse', 'ApexAI', 'CoreIntelligence', 'MindBridge',
                 'DeepSkill', 'ProtoAI', 'CortexHub', 'SynapseLab', 'NeuralForge',
                 'QuantumMind', 'EchoAI', 'LogicWave', 'InferAI', 'RadiantTech'];

      gpts.push({
        source: 'gpt-store',
        gpt_id: gptId,
        name: `${tpl.name}${suffix}`,
        description: tpl.desc,
        author: authors[idCounter % authors.length],
        category: catKey,
        is_verified: tpl.verified && (round < 2),
        actions,
      });

      idCounter++;
    }
    round++;
    // Safety: prevent infinite loop
    if (round > 100) break;
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
    // ── New categories: defaults ──
    beauty: [
      { name: '肤质分析', desc: `皮肤类型诊断和护理方案推荐` },
      { name: '产品评测', desc: `化妆品/护肤品成分分析和效果评估` },
      { name: '妆容教程', desc: `分步彩妆教学和工具使用指导` },
      { name: '美容方案', desc: `个性化美容保养方案制定` },
    ],
    fashion: [
      { name: '风格诊断', desc: `根据身材/肤色的个人穿搭风格诊断` },
      { name: '搭配推荐', desc: `场合/季节/预算的穿搭搭配推荐` },
      { name: '趋势分析', desc: `时尚趋势解读和购物建议` },
    ],
    food: [
      { name: '菜谱生成', desc: `根据食材和口味生成个性化菜谱` },
      { name: '烹饪指导', desc: `分步烹饪技巧和火候控制指导` },
      { name: '食材推荐', desc: `食材挑选、替代和搭配建议` },
      { name: '饮食规划', desc: `根据健康目标的饮食计划制定` },
    ],
    travel: [
      { name: '行程规划', desc: `根据天数/预算/偏好设计旅行行程` },
      { name: '景点推荐', desc: `目的地景点、美食和活动推荐` },
      { name: '旅行攻略', desc: `签证、交通、住宿和当地实用信息` },
    ],
    legal: [
      { name: '法律咨询', desc: `法律问题初步分析和建议` },
      { name: '合同审查', desc: `合同条款审查和风险提示` },
      { name: '法规查询', desc: `相关法律法规条文查询和解读` },
    ],
    sports: [
      { name: '训练计划', desc: `个性化运动训练计划制定` },
      { name: '技术指导', desc: `运动技术分解和纠正指导` },
      { name: '伤病预防', desc: `运动伤病预防和康复建议` },
    ],
    music: [
      { name: '音乐教学', desc: `乐器/声乐分步教学和练习指导` },
      { name: '乐理讲解', desc: `音乐理论知识系统讲解` },
      { name: '曲目推荐', desc: `根据口味的曲目和练习建议` },
    ],
    photography: [
      { name: '拍摄指导', desc: `相机设置和构图技巧指导` },
      { name: '后期修图', desc: `照片调色和精修分步教程` },
      { name: '器材推荐', desc: `相机/镜头/配件选购建议` },
    ],
    pets: [
      { name: '饲养指导', desc: `宠物喂养、护理和训练指导` },
      { name: '健康咨询', desc: `宠物常见疾病预防和护理` },
      { name: '行为解读', desc: `宠物行为分析和训练方法` },
    ],
    home: [
      { name: '设计咨询', desc: `家居设计和风格搭配建议` },
      { name: '装修指导', desc: `装修流程、材料和预算指导` },
      { name: '收纳方案', desc: `空间整理和收纳方案设计` },
    ],
    automotive: [
      { name: '购车咨询', desc: `车型对比和选购建议` },
      { name: '保养指导', desc: `车辆保养周期和项目指导` },
      { name: '故障排查', desc: `车辆故障诊断和维修建议` },
    ],
    parenting: [
      { name: '育儿指导', desc: `分龄育儿知识和日常护理指导` },
      { name: '健康咨询', desc: `儿童健康和常见疾病护理` },
      { name: '教育建议', desc: `早教方法和学习规划建议` },
    ],
    agriculture: [
      { name: '种植指导', desc: `作物种植技术和田间管理` },
      { name: '病虫防治', desc: `病虫害识别和防治方案` },
      { name: '土壤改良', desc: `土壤检测和改良建议` },
    ],
    craft: [
      { name: '教程指导', desc: `手工艺分步制作教程` },
      { name: '材料推荐', desc: `手工材料和工具选购建议` },
      { name: '创意设计', desc: `手工艺品设计灵感和方案` },
    ],
    realestate: [
      { name: '市场分析', desc: `房产市场趋势和价值评估` },
      { name: '购房指导', desc: `购房流程、贷款和谈判指导` },
      { name: '投资建议', desc: `房产投资策略和回报分析` },
    ],
    culture: [
      { name: '知识讲解', desc: `文化历史知识系统讲解` },
      { name: '深度分析', desc: `文化现象深度解读和比较` },
      { name: '参观导览', desc: `博物馆/古迹导览和展品讲解` },
    ],
    wellness: [
      { name: '健康评估', desc: `身心状态评估和改善建议` },
      { name: '练习指导', desc: `冥想/瑜伽/气功分步指导` },
      { name: '生活建议', desc: `健康生活习惯和作息建议` },
    ],
    metaphysics: [
      { name: '命理分析', desc: `八字/紫微/星座命理分析和解读` },
      { name: '占卜咨询', desc: `塔罗/六爻占卜和结果解读` },
      { name: '运势预测', desc: `个人运势和流年大运分析` },
    ],
    finance: [
      { name: '投资分析', desc: `证券/基金/加密货币分析` },
      { name: '理财规划', desc: `个人理财方案和资产配置` },
      { name: '风险评估', desc: `投资风险和市场风险评估` },
    ],
    military: [
      { name: '军情分析', desc: `军事动态和战略分析` },
      { name: '装备科普', desc: `武器装备知识详解` },
      { name: '历史战役', desc: `经典战役和军事历史讲解` },
    ],
    aerospace: [
      { name: '航天科普', desc: `航天技术知识和探索进展` },
      { name: '飞行指导', desc: `飞行原理和航空知识教学` },
      { name: '科技前沿', desc: `航空航天科技发展趋势` },
    ],
    dating: [
      { name: '情感咨询', desc: `恋爱关系和沟通建议` },
      { name: '形象提升', desc: `个人魅力和社交形象提升` },
      { name: '约会策划', desc: `约会创意和计划安排` },
    ],
    chinese_traditional: [
      { name: '经典解读', desc: `国学经典逐段解读和现代应用` },
      { name: '传统文化', desc: `传统礼仪、节日和风俗讲解` },
      { name: '技艺教学', desc: `书法/茶道/香道等传统技艺教学` },
    ],
    gaming: [
      { name: '攻略指导', desc: `游戏通关攻略和技巧教学` },
      { name: '战术分析', desc: `游戏战术和团队配合分析` },
      { name: '游戏推荐', desc: `根据口味的游戏推荐` },
    ],
    study_abroad: [
      { name: '申请指导', desc: `留学申请全流程指导` },
      { name: '备考规划', desc: `语言考试备考计划和学习方法` },
      { name: '选校建议', desc: `院校对比和专业选择建议` },
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
  console.log('\n📊 品类分布:');
  for (const [cat, stats] of Object.entries(cats).sort((a, b) => b[1].count - a[1].count)) {
    const catDisplay = CATEGORIES[cat]?.display || cat;
    console.log(`  ${catDisplay.padEnd(20)} ${String(stats.count).padStart(4)} (verified: ${stats.verified})`);
  }
  console.log(`\n总计: ${gpts.length} 个 GPT 条目`);
  console.log('  其中 verified:', gpts.filter(g => g.is_verified).length);
  console.log('\n下一步: node index.js --dir ./gpt-bulk --register');
}

main();
