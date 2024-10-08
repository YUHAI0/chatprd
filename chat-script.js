document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleUserInput();
});

document.getElementById('user-input').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // 检查是否按下回车键且没有按下Shift
        e.preventDefault(); // 防止换行
        await handleUserInput();
    }
});

async function handleUserInput() {
    const userInput = document.getElementById('user-input').value;

    // 显示用户输入
    addMessage('user', userInput);

    // 清空输入框
    document.getElementById('user-input').value = '';

    // 显示加载中消息
    addMessage('system', '正在生成PRD,请稍候...');

    try {
        // 发送请求到ChatGPT API
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}` // 使用配置中的API密钥
            },
            body: JSON.stringify({
                model: config.model, // 使用配置中的模型
                messages: [
                    { role: "system", content: config.systemPrompt }, // 使用配置中的系统提示
                    { role: "user", content: userInput }
                ],
                max_tokens: 300, // 根据需要设置生成的最大token数
                temperature: 0.7 // 控制生成文本的随机性
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();

        // 显示生成的PRD
        addMessage('system', data.choices[0].message.content); // 获取生成的内容
    } catch (error) {
        console.error('Error:', error);
        addMessage('system', '生成PRD时出错,请重试。');
    }
}

function addMessage(sender, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    // 将换行符替换为 <br> 标签
    messageElement.innerHTML = content.replace(/\n/g, '<br>'); // 处理换行符

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // 滚动到最新消息
}
