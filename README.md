# IELTS Writing GPT 评分助手

这是一个使用 GPT 模型来评估和改进 IELTS 写作的工具。该工具可以对写作进行多维度评分,并提供详细的反馈和改进建议。

## 功能特点

- 多维度评分:任务完成度(Task Achievement)、连贯与衔接(Coherence and Cohesion)、词汇资源(Lexical Resource)、语法范围与准确性(Grammatical Range and Accuracy)
- 提供详细的评分反馈和改进建议
- 生成优化后的写作样本
- 提供写作提示和词汇建议

## 使用说明

### 1. 配置文件 (key.cfg)

在使用前需要先配置 `key.cfg` 文件:

```ini
[option]
# GPT模型设置
model_name = deepseek-chat  # 或其他支持的模型
api_key = your_api_key_here
base_url = https://api.deepseek.com/beta/v1  # ChatGPT用户使用 https://api.openai.com/v1

# 任务类型
task = 1  # 1表示Task1，2表示Task2

# 输入输出文件设置
essay_file = data/essay.txt  # 待评估的作文
#output_feedback_file = <essay_file>_feedback.md  # 评分反馈输出
#output_polish_file = <essay_file>_polish.md  # 优化后的作文输出
topic_file = data/topic.txt  # 作文题目
#output_hinter_file = <topic_file>_hinter.md  # 写作提示输出

# 提示词设置
prompt_prefix = prompts/ielts/ielts_writing_
aspects = ta,cc,lr,gra
```

### 2. （用法一）使用评分功能

将你的作文（含题目）放入 `data/essay.txt` 文件中，然后运行：

```bash
python IELTS_writing_GPT_evaluator.py
```

系统会生成：
- 详细的评分反馈 (`data/feedback.md`)
- 优化后的作文样本 (`data/polish.md`)

### 3. （用法二）获取写作提示

将作文题目放入 `data/topic.txt` 文件中，然后运行：

```bash
python IELTS_writing_GPT_hinter.py
```

系统会生成写作提示和相关词汇建议 (`data/hinter.md`)以及写作范文 (`data/sample.md`)

## 文件结构

```
.
├── IELTS_writing_GPT_evaluator.py  # 主评分程序
├── IELTS_writing_GPT_hinter.py     # 写作提示生成程序
├── key.cfg                         # 配置文件
├── requirements.txt                # 依赖项
├── data/                          # 数据文件夹
│   ├── essay2.txt                 # 待评估作文
│   ├── feedback.md                # 评分反馈
│   ├── polish.md                  # 优化后的作文
│   ├── topic.txt                  # 作文题目
│   └── hinter.md                  # 写作提示
└── prompts/                       # 提示词模板
    └── ielts/                     # IELTS相关提示词
```

## 评分维度

1. **Task Achievement (TA)**
   - 评估作文是否充分回应了任务要求
   - 观点是否清晰且相关
   - 是否提供了充分的支持细节

2. **Coherence and Cohesion (CC)**
   - 评估文章的逻辑性和连贯性
   - 段落之间的过渡是否自然
   - 连接词的使用是否恰当

3. **Lexical Resource (LR)**
   - 评估词汇的多样性和准确性
   - 高级词汇的使用情况
   - 词汇错误的情况

4. **Grammatical Range and Accuracy (GRA)**
   - 评估语法结构的多样性和准确性
   - 复杂句型的使用情况
   - 语法错误的情况

## 注意事项

1. 确保 API key 的安全性，不要将其分享给他人
2. 建议每次评估前备份原始作文
3. 系统生成的建议仅供参考，最终写作时要结合个人风格

## License

MIT License
```

这个 README.md 文件提供了项目的完整说明，包括安装、配置、使用方法和注意事项。你可以根据实际需求进行调整和补充。

