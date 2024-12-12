class IELTS_GPT_Caller {
    static async loadConfig() {
        try {
            const response = await fetch('key.cfg');
            if (!response.ok) {
                throw new Error('Failed to load configuration');
            }
            const configText = await response.text();
            const config = {};
            configText.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    config[key.trim()] = value.trim();
                }
            });
            return config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            return {};
        }
    }

    static async loadTextFromFile(file) {
        try {
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`Failed to load ${file}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading ${file}:', error);
            return '';
        }
    }

    static async loadPromptFile(task, type = 'writing_sample') {
        try {
            let prompts = [];
            
            if (type === 'writing_sample') {
                // 加载写作示例提示
                const response = await fetch(`prompts/ielts/ielts_writing_${task}_prompt_writing_sample.txt`);
                if (!response.ok) {
                    throw new Error(`Failed to load prompts for task ${task}`);
                }
                const text = await response.text();
                prompts = text.split('\n').filter(line => line.trim());
            } else if (type === 'evaluation') {
                // 评估的四个维度
                const aspects = [
                    { id: 'ta', name: 'Task Achievement' },
                    { id: 'cc', name: 'Coherence and Cohesion' },
                    { id: 'lr', name: 'Lexical Resource' },
                    { id: 'gra', name: 'Grammatical Range and Accuracy' }
                ];
                
                // 加载评估提示
                for (const aspect of aspects) {
                    try {
                        const response = await fetch(`prompts/ielts/ielts_writing_${task}_prompt_${aspect.id}.txt`);
                        if (!response.ok) {
                            console.error(`Failed to load ${aspect.name} prompt for task ${task}`);
                            continue;
                        }
                        const text = await response.text();
                        if (text.trim()) {
                            prompts.push(text.trim());
                        }
                    } catch (error) {
                        console.error(`Error loading ${aspect.name} prompt:`, error);
                        continue;
                    }
                }
            }
            
            if (prompts.length === 0) {
                throw new Error('No prompts loaded');
            }
            
            return prompts;
        } catch (error) {
            console.error('Error loading prompts:', error);
            throw error; // 向上传递错误以便更好地处理
        }
    }

    constructor(apiKey, baseUrl, modelName) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.modelName = modelName;
        this.statusElement = document.getElementById('status');
    }

    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent += message + '\n';
            // 自动滚动到底部
            this.statusElement.scrollTop = this.statusElement.scrollHeight;
        }
        console.log(message);  // 保留控制台输出
    }

    async askLLM(messages) {
        this.updateStatus(`Sending request to ${this.modelName}...`);
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: messages
                })
            });

            const data = await response.json();
            const answer = data.choices[0].message.content;
            this.updateStatus(`Response received successfully for prompt: ...${messages[messages.length-1].content.substring(0,25)}...`);
            return answer.trim();
        } catch (e) {
            this.updateStatus(`Error during API call: ${e}`);
            throw e;
        }
    }

    async loadPrompts(text, task, type) {
        try {
            const loadedPrompts = await IELTS_GPT_Caller.loadPromptFile(task, type);
            if (loadedPrompts.length > 0) {
                if (type === 'writing_sample'){
                    // 在第一个提示前添加文本
                    loadedPrompts[0] = `${text}\n${loadedPrompts[0]}`;
                    }
                else{
                    //在每个提示前添加文本
                    for (let i = 0; i < loadedPrompts.length; i++) {
                        loadedPrompts[i] = `${text}\n${loadedPrompts[i]}`;    
                    }
                }
                return loadedPrompts;
            } else {
                throw new Error('No prompts loaded');
            }
        } catch (error) {
            this.updateStatus('Error in loadPrompts:', error);
            throw error;
        }
    }

    clean(text) {
        return text.replace(/<br>/g, "\n");
    }

    async generateHints(topicText, task) {
        const prompts = await this.loadPrompts(topicText, task, 'writing_sample');
        const assessments = [];
        const conversationHistory = [];
        const finalResultsElement = document.getElementById('finalResults');
        const statusElement = document.getElementById('status');
        
        this.updateStatus("\nStarting analysis...");
        finalResultsElement.innerHTML = marked.parse(topicText + "\n");
        
        statusElement.classList.add('processing');
        statusElement.classList.remove('completed');
        
        for (const prompt of prompts) {
            this.updateStatus(`\nAnalyzing ${prompt.substring(0,25)}...`);
            
            try {
                conversationHistory.push({"role": "user", "content": prompt});
                const response = await this.askLLM(conversationHistory);
                conversationHistory.push({"role": "assistant", "content": response});
                
                const cleanResponse = this.clean(response);
                assessments.push(cleanResponse);
                
                finalResultsElement.innerHTML = marked.parse(cleanResponse);
                this.updateStatus(`✓ Completed ${prompt.substring(0,25)}...`);
            } catch (e) {
                this.updateStatus(`Failed to process prompt: ${e}`);
                continue;
            }
        }

        this.updateStatus("\nAll analyzed. Generating final summary...");
        
        statusElement.classList.remove('processing');
        statusElement.classList.add('completed');
        
        const finalContent = assessments.join('\n');
        finalResultsElement.innerHTML = marked.parse(finalContent);
        
        this.updateStatus("✓ Final summary generated");
        
        return finalContent;
    }

    async generateEvaluation(essayText, task) {
        const prompts = await this.loadPrompts(essayText, task, 'evaluation');
        const assessments = [];
        const feedbacks = [];
        const conversationHistory = [];
        const finalResultsElement = document.getElementById('finalResults');
        const statusElement = document.getElementById('status');
        
        this.updateStatus("\nStarting evaluation...");
        finalResultsElement.innerHTML = marked.parse(essayText + "\n");
        
        statusElement.classList.add('processing');
        statusElement.classList.remove('completed');
        const essayLength = essayText.length;
        
        // First process all aspect evaluations
        for (const prompt of prompts) {
            this.updateStatus(`\nAnalyzing ${prompt.substring(essayLength + 36, essayLength + 55)}...`);
            
            try {
                conversationHistory.push({"role": "user", "content": prompt});
                const response = await this.askLLM(conversationHistory);
                conversationHistory.push({"role": "assistant", "content": response});
                
                const cleanResponse = this.clean(response);
                assessments.push(cleanResponse);
                feedbacks.push(cleanResponse);
                
                finalResultsElement.innerHTML = marked.parse(cleanResponse);
                this.updateStatus(`✓ Completed ${prompt.substring(essayLength + 36, essayLength + 55)}...`);
            } catch (e) {
                this.updateStatus(`Failed to process prompt: ${e}`);
                continue;
            }
        }

        // Load and process summary prompt
        try {
            const summaryPrompt = await IELTS_GPT_Caller.loadTextFromFile('prompts/ielts/ielts_writing_prompt_summary.txt');
            if (summaryPrompt) {
                this.updateStatus("\nGenerating final summary...");
                const finalPrompt = summaryPrompt + "\n" + feedbacks.join("\n");
                const summaryResponse = await this.askLLM([{"role": "user", "content": finalPrompt}]);
                assessments.push(this.clean(summaryResponse));
            }
        } catch (e) {
            this.updateStatus(`Failed to generate summary: ${e}`);
        }

        // Load and process polish prompt
        try {
            const polishPrompt = await IELTS_GPT_Caller.loadTextFromFile('prompts/ielts/ielts_writing_prompt_polish.txt');
            if (polishPrompt) {
                this.updateStatus("\nGenerating polished version...");
                const finalPolishPrompt = polishPrompt + "\n" + feedbacks.join("\n");
                const polishResponse = await this.askLLM([{"role": "user", "content": finalPolishPrompt}]);
                assessments.push(this.clean(polishResponse));
            }
        } catch (e) {
            this.updateStatus(`Failed to generate polish: ${e}`);
        }

        this.updateStatus("\nAll analyzed. Generating final evaluation...");
        
        statusElement.classList.remove('processing');
        statusElement.classList.add('completed');
        
        const finalContent = assessments.join('\n');
        finalResultsElement.innerHTML = marked.parse(finalContent);
        
        this.updateStatus("✓ Final evaluation generated");
        
        return finalContent;
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    const config = await IELTS_GPT_Caller.loadConfig();
    
    // 设置 API key, baseUrl 和 modelName
    document.getElementById('apiKey').value = config.api_key;
    document.getElementById('baseUrl').value = config.base_url;
    document.getElementById('modelName').value = config.model_name;
    document.getElementById('task').value = `${config.task}`;
    
    // 加载默认话题文本
    if (config.topic_file) {
        const defaultTopic = await IELTS_GPT_Caller.loadTextFromFile(config.topic_file);
        document.getElementById('topicText').value = defaultTopic;
    }
    if (config.essay_file) {
        const defaultEssay = await IELTS_GPT_Caller.loadTextFromFile(config.essay_file);
        document.getElementById('essayText').value = defaultEssay;
    }
});
