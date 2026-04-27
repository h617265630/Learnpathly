# Questions & TODOs

Date: 2026-04-27

## 1) AI 功能：资源与 subnodes / 大纲的关联

Question:
- 目前“资源获取（search/resources）”与“学习路径（outline + subnodes）”之间的关联关系是什么？资源是按 topic 全局关联，还是按 section/subnode 精准关联？

Impact:
- 如果资源与 subnode 不强关联，detail 页展示可能会出现“资源和内容不匹配/泛化”的问题，管理端也难以复用与编辑。

TODO:
- 明确资源的归属层级：project / section / subnode / subnode_detail。
- 设计并实现资源与 outline/subnodes 的关联写入策略（生成时就写入 DB，还是延迟绑定）。
- 给管理端提供可编辑的资源绑定能力（调整/替换/批量导入）。

## 2) Detail 页面：资源与文字内容的展示逻辑

Question:
- detail 页面现在展示的“文字内容（summary/explanation/detail markdown）”和“资源卡片（resources）”的组合逻辑是否合理？哪些内容属于 overview，哪些属于 stage/subnode/detail？

Impact:
- 展示逻辑不清晰会导致用户读起来割裂：看不懂该先做什么、资源与段落对不上、信息密度过高或过低。

TODO:
- 梳理并固定信息架构（IA）：Overview -> Stages -> Subnodes -> Subnode detail -> Resources。
- 明确每一层展示字段与顺序（标题、目标、关键点、练习、资源）。
- 统一“资源展示位置”：是 stage 下集中展示，还是 subnode/detail 内紧邻展示。

## 3) Admin 页面：用户可直接访问

Question:
- 目前用户是否可以直接访问 `/admin`？是否缺少鉴权/权限控制？

Impact:
- 安全风险：未授权用户可能看到或操作管理功能（批量生成、内容管理、发布等）。

TODO:
- 加入管理员权限校验（前端路由守卫 + 后端接口权限校验）。
- 明确 Admin 入口与可见性（是否对普通用户隐藏）。
- 记录/审计关键操作（生成、发布、删除）。

## 4) 学习路径制作逻辑需要重新设定

Question:
- “学习路径制作/发布”的定义是什么：AI 生成的 ai_path_* 表数据如何变成产品里可展示的正式 learning path（例如 learning_paths/path_items）？

Impact:
- 逻辑不明确会导致内容难以规模化运营：无法批量生成、审核、编辑、发布、回滚、版本化。

TODO:
- 重新定义 pipeline：Draft（ai_path_*）-> Review/Edit -> Publish（正式表）-> Display。
- 设计发布策略：是否保留版本（v1/v2）、是否允许覆盖、是否需要审核状态机。
- 明确后台管理端的工作流：批量生成、筛选、编辑、发布、下线。

## 5) 文字信息修改写入（Updates / Plan 等）

Question:
- 产品内的文字内容（updates、plan、介绍文案、标签等）目前是写死在前端、写在数据库、还是由 AI 生成？修改入口和发布流程是什么？

Impact:
- 无法快速迭代文案与信息结构；上线后内容调整成本高；多端一致性难保证。

TODO:
- 明确“文案来源”的单一真相（DB/配置文件/前端常量/AI 生成结果）。
- 设计一个可运营的更新机制：后台可编辑、可预览、可发布/回滚。
- 若需要多语言：定义 i18n 策略与存储方式。

## 6) 代码与逻辑检查（稳定性/回归/测试）

Question:
- 目前 AI 生成链路（outline、subnode detail、缓存/DB 读写）是否有系统性的回归验证？错误与超时是否可观测？

Impact:
- 线上容易出现“0 秒返回垃圾内容”“超时无提示”“缓存脏数据”这类体验问题；排查成本高。

TODO:
- 增加关键路径的集成测试（生成 outline、加载 project、生成 detail、语言判断/覆盖逻辑）。
- 增加可观测性：每次生成记录耗时、provider、是否命中缓存/DB、失败原因。
- 前端补齐 loading/error 状态与重试入口（尤其是生成耗时 2-5 分钟时）。

## 7) Real User Case 展示（带资源、带图片）

Question:
- 是否需要一个“真实案例库/模板库”，展示完整的学习路径：包含主题封面图、资源卡、章节结构、示例产出？

Impact:
- 没有真实案例，用户难以理解产品价值与路径质量；转化与留存受影响。

TODO:
- 选 5-10 个高价值主题做“精品案例”（AI 生成 + 人工校对 + 资源补全）。
- 为案例加入封面图策略：自动生成/选图/人工上传，统一风格。
- 页面增加“Case”区块：卡片展示 + 详情页深度浏览（资源可点击）。

## 8) 学习主题展示卡的图片问题

Question:
- 目前学习主题卡片的图片来源是什么（favicon、固定图、AI 生成、外链图）？在不同主题下为什么会出现空白/不匹配/风格不统一？

Impact:
- 列表页观感不稳定；用户对内容质量的第一印象变差。

TODO:
- 明确图片策略与兜底：优先级（自定义封面 > 主题库默认图 > 自动生成 > favicon）。
- 为 LearnPath/Topic 卡片增加统一的封面规范（尺寸、padding、背景、文字可读性）。
- 补齐图片缓存与加载错误处理，避免闪烁与布局跳动。
