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
    const hintsElement = document.getElementById('hints');
    const downloadBtn = document.getElementById('downloadBtn');
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
    downloadBtn.style.display = 'none';
    
    try {
        const hinter = new IELTSHinter(apiKey, baseUrl, modelName);
        const hints = await hinter.generateHints(topicText, task);
        
        // Display hints
        hintsElement.textContent = hints;
        
        // Show download button
        downloadBtn.style.display = 'inline-block';
        statusElement.textContent = "Processing completed!";
    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
    }
}

// 下载结果
function downloadHints() {
    const hints = document.getElementById('hints').textContent;
    const element = document.createElement('a');
    const file = new Blob([hints], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = 'hinter_and_sample.md';
    element.click();
} 