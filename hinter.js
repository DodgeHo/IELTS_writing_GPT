class IELTSHinter {
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

    static async loadDefaultTopic(topicFile) {
        try {
            const response = await fetch(topicFile);
            if (!response.ok) {
                throw new Error('Failed to load default topic');
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading default topic:', error);
            return '';
        }
    }

    static async loadPromptFile(task) {
        try {
            const response = await fetch(`prompts/ielts/ielts_writing_${task}_prompt_writing_sample.txt`);
            if (!response.ok) {
                throw new Error(`Failed to load prompts for task ${task}`);
            }
            const text = await response.text();
            return text.split('\n').filter(line => line.trim()); // 移除空行
        } catch (error) {
            console.error('Error loading prompts:', error);
            return [];
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

    async loadPrompts(topicText, task) {
        try {
            const loadedPrompts = await IELTSHinter.loadPromptFile(task);
            if (loadedPrompts.length > 0) {
                // 在第一个提示前添加题目
                loadedPrompts[0] = `${topicText}\n\n${loadedPrompts[0]}`;
                return loadedPrompts;
            } else {
                throw new Error('No prompts loaded');
            }
        } catch (error) {
            this.updateStatus('Error in loadPrompts:', error);
            throw error; // 重新抛出错误以便调用者处理
        }
    }

    clean(text) {
        return text.replace(/<br>/g, "\n");
    }

    async generateHints(topicText, task) {
        const prompts = await this.loadPrompts(topicText, task);
        const assessments = [];
        const conversationHistory = [];
        const hintsElement = document.getElementById('hints');
        const statusElement = document.getElementById('status');
        
        this.updateStatus("\nStarting analysis...");
        hintsElement.innerHTML = marked.parse(topicText + "\n\n");
        
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
                
                hintsElement.innerHTML = marked.parse(cleanResponse);
                this.updateStatus(`✓ Completed ${prompt.substring(0,25)}...`);
            } catch (e) {
                this.updateStatus(`Failed to process prompt: ${e}`);
                continue;
            }
        }

        this.updateStatus("\nAll analyzed. Generating final summary...");
        
        statusElement.classList.remove('processing');
        statusElement.classList.add('completed');
        
        const finalContent = assessments.join('\n\n');
        hintsElement.innerHTML = marked.parse(finalContent);
        
        this.updateStatus("✓ Final summary generated");
        
        return finalContent;
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    const config = await IELTSHinter.loadConfig();
    
    // 设置 API key, baseUrl 和 modelName
    document.getElementById('apiKey').value = config.api_key;
    document.getElementById('baseUrl').value = config.base_url;
    document.getElementById('modelName').value = config.model_name;
    document.getElementById('task').value = `${config.task}`;
    
    // 加载默认话题文本
    if (config.topic_file) {
        const defaultTopic = await IELTSHinter.loadDefaultTopic(config.topic_file);
        document.getElementById('topicText').value = defaultTopic;
    }
});
