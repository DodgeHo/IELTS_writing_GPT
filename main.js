// 文件上传处理
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('topicText').value = event.target.result;
        };
        reader.readAsText(file);
    }
});

// 上传按钮点击事件
document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

// 处理主题文本
async function processTopic() {
    const topicText = document.getElementById('topicText').value;
    const apiKey = document.getElementById('apiKey').value;
    const baseUrl = document.getElementById('baseUrl').value;
    const modelName = document.getElementById('modelName').value;
    const statusElement = document.getElementById('status');
    const finalResults = document.getElementById('finalResults');
    const downloadHintBtn = document.getElementById('downloadHintBtn');
    const downloadEvalBtn = document.getElementById('downloadEvalBtn');
    const task = document.getElementById('task').value;

    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }

    if (!topicText.trim()) {
        alert('Please enter topic text');
        return;
    }

    statusElement.textContent = "Processing...";
    downloadHintBtn.style.display = 'none';
    downloadEvalBtn.style.display = 'none';
    
    try {
        const gptCaller = new IELTS_GPT_Caller(apiKey, baseUrl, modelName);
        const results = await gptCaller.generateHints(topicText, task);
        
        // Display results
        document.getElementById('finalResults').innerHTML = marked.parse(results);
        
        // Show download button
        downloadHintBtn.style.display = 'block';
        downloadEvalBtn.style.display = 'none';
        statusElement.textContent = "Processing completed!";
    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
    }
}

// 下载结果
function downloadHints() {
    const results = document.getElementById('finalResults').textContent;
    const element = document.createElement('a');
    const file = new Blob([results], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = 'hinter_and_sample.md';
    element.click();
}

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    const taskSelector = document.querySelector('#taskSelector').content.cloneNode(true);
    // 默认放在第一个容器中
    document.querySelector('#taskSelectorContainer').appendChild(taskSelector);
});

// 修改 switchTab 函数
function switchTab(tabName) {
    // 移除所有标签页的 active 类
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // 激活选中的标签页
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    // 移动 task selector 到当前激活的标签页
    const select = document.getElementById('task');
    const targetContainer = tabName === 'hinter' ? 
        document.querySelector('#taskSelectorContainer') : 
        document.querySelector('#taskSelectorContainer2');
    
    if (select && targetContainer) {
        targetContainer.appendChild(select);
    }
} 

async function processEvaluation() {
    const essayText = document.getElementById('essayText').value;
    const apiKey = document.getElementById('apiKey').value;
    const baseUrl = document.getElementById('baseUrl').value;
    const modelName = document.getElementById('modelName').value;
    const statusElement = document.getElementById('status');
    const finalResults = document.getElementById('finalResults');
    const downloadEvalBtn = document.getElementById('downloadEvalBtn');
    const task = document.getElementById('task').value;

    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }

    if (!essayText.trim()) {
        alert('Please enter your essay');
        return;
    }

    statusElement.textContent = "Processing...";
    downloadEvalBtn.style.display = 'none';
    
    try {
        const gptCaller = new IELTS_GPT_Caller(apiKey, baseUrl, modelName);
        const evaluation = await gptCaller.generateEvaluation(essayText, task);
        
        // Display evaluation
        finalResults.textContent = evaluation;
        
        // Show download button
        downloadEvalBtn.style.display = 'block';
        statusElement.textContent = "Processing completed!";
    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
    }
}

// 添加下载评估结果的函数
function downloadEval() {
    const evaluation = document.getElementById('hints').textContent;
    const element = document.createElement('a');
    const file = new Blob([evaluation], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = 'evaluation_feedback_polish.md';
    element.click();
} 