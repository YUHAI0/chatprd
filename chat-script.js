
// 处理用户输入
async function handleuserinput() {
    const userinput = document.getelementbyid('user-input').value;

    // 显示用户输入
    addmessage('user', userinput);

    // 清空输入框
    document.getelementbyid('user-input').value = '';

    // 显示加载动画
    const loadingindicator = document.getelementbyid('loading-indicator');
    loadingindicator.style.display = 'block'; // 显示加载指示器

    // 在加载指示器之前添加到消息容器
    const messagescontainer = document.getelementbyid('chat-messages');
    messagescontainer.appendchild(loadingindicator);

    try {
        // 发送请求到chatgpt api
        const response = await fetch(config.apiurl, {
            method: 'post',
            headers: {
                'content-type': 'application/json',
                'authorization': `bearer ${config.apikey}` // 使用配置中的api密钥
            },
            body: json.stringify({
                model: config.model, // 使用配置中的模型
                messages: [
                    { role: "system", content: config.systemprompt }, // 使用配置中的系统提示
                    { role: "user", content: userinput }
                ],
                max_tokens: config.maxtokens, // 使用配置中的最大token数
                temperature: 0.7 // 控制生成文本的随机性
            })
        });

        if (!response.ok) {
            throw new error('api请求失败');
        }

        const data = await response.json();

        // 隐藏加载动画
        loadingindicator.style.display = 'none'; // 隐藏加载指示器

        // 显示生成的prd
        addmessage('system', data.choices[0].message.content); // 获取生成的内容
    } catch (error) {
        console.error('error:', error);
        loadingindicator.style.display = 'none'; // 隐藏加载指示器
        addmessage('system', '生成prd时出错,请重试。');
    }
}

// 处理选项选择
function selectOption(option) {
    let prompt;
    let systemPrompt;

    switch (option) {
        case 'writePRD':
            prompt = "请帮助我编写一个产品需求文档。";
            systemPrompt = "你是一个专门帮助用户编写产品需求文档的助手。";
            break;
        case 'refinePRD':
            prompt = "请帮我润色或完善我的产品需求文档。";
            systemPrompt = "你是一个专门帮助用户润色和完善产品需求文档的助手。";
            break;
        case 'brainstormFeatures':
            prompt = "请帮我头脑风暴出更多的产品特性。";
            systemPrompt = "你是一个专门帮助用户头脑风暴产品特性的助手。";
            break;
        default:
            return;
    }

    // 更新系统提示
    config.systemPrompt = systemPrompt;

    // 直接调用handleUserInput来处理选项
    document.getElementById('user-input').value = prompt;
    document.getElementById('options').style.display = 'none'; // 隐藏选项
    handleUserInput();
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

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const generateButton = document.getElementById('generate-button');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const loadingIndicator = document.getElementById('loading-indicator');

    // 存储历史消息
    let messageHistory = [];
    async function handleUserInput() {
        // 显示加载动画
        loadingIndicator.style.display = 'block'; // 显示加载指示器
        const inputText = userInput.value.trim(); // 获取输入框的值并去除空格

        // 显示用户输入
        addMessage('user', inputText);

        // 在加载指示器之前添加到消息容器
        const messagescontainer = document.getElementById('chat-messages');
        messagescontainer.appendChild(loadingIndicator);


        if (inputText) {
            // 将用户输入添加到历史消息
            messageHistory.push({ role: 'user', content: inputText });


            // 发送API请求
            sendApiRequest(messageHistory);

            // 清空输入框
            userInput.value = '';
        } else {
            alert("请输入产品需求描述！"); // 提示用户输入内容
        }

        // 清空输入框
        document.getElementById('user-input').value = '';
    }

    document.getElementById('user-input').addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // 检查是否按下回车键且没有按下Shift
            e.preventDefault(); // 防止换行
            await handleUserInput();
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 防止表单默认提交行为
        await handleUserInput();

    });

    async function sendApiRequest(history) {
        console.log("历史消息:", history); // 打印历史消息
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
                        ...history
                    ],
                    max_tokens: config.maxTokens, // 使用配置中的最大token数
                    temperature: 0.7 // 控制生成文本的随机性
                })
            });

            if (!response.ok) {
                throw new Error('API请求失败');
            }

            const data = await response.json();

            // 隐藏加载动画
            loadingIndicator.style.display = 'none'; // 隐藏加载指示器

            // 显示生成的PRD
            let aiMessage = data.choices[0].message.content
            messageHistory.push({'role': 'assistant', 'content': aiMessage})
            addMessage('system', aiMessage); // 获取生成的内容
        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.style.display = 'none'; // 隐藏加载指示器
            addMessage('system', '生成PRD时出错,请重试。');
        }
    }
});