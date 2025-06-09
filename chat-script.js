
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
                'authorization': `Bearer ${config.apiKey}` // 使用配置中的api密钥
                
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
    
    if (sender === 'system') {
        // 检测是否包含markdown格式
        if (isMarkdownContent(content)) {
            const markdownContainer = document.createElement('div');
            markdownContainer.classList.add('markdown-content');
            markdownContainer.innerHTML = parseMarkdown(content);
            messageElement.appendChild(markdownContainer);
        } else {
            // 普通文本，保持原有格式
            const preElement = document.createElement('pre');
            preElement.textContent = content;
            messageElement.appendChild(preElement);
        }
    } else {
        // 用户消息，检查是否有markdown
        if (isMarkdownContent(content)) {
            const markdownContainer = document.createElement('div');
            markdownContainer.classList.add('markdown-content');
            markdownContainer.innerHTML = parseMarkdown(content);
            messageElement.appendChild(markdownContainer);
        } else {
            // 将换行符替换为 <br> 标签
            messageElement.innerHTML = content.replace(/\n/g, '<br>');
        }
    }

    messagesContainer.appendChild(messageElement);
    
    // 智能滚动到最新消息
    setTimeout(() => {
        smartScrollToBottom();
    }, 100);
}

// 检测内容是否包含markdown格式
function isMarkdownContent(content) {
    const markdownPatterns = [
        /^#{1,6}\s+/m,  // 标题
        /\*\*.*?\*\*/,  // 粗体
        /\*[^*\s].*?\*/,      // 斜体（避免误判*号）
        /`[^`\n]+`/,        // 行内代码
        /```/,          // 代码块开始
        /^\s*[-*+]\s+/m, // 无序列表
        /^\s*\d+\.\s+/m, // 有序列表
        /^\s*>\s+/m,    // 引用
        /\[.*?\]\(.*?\)/, // 链接
        /\|.*?\|.*?\|/,      // 表格（至少两个管道符）
        /^---+$/m,       // 分割线
        /^\s*\|/m       // 表格行开始
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
}

// 解析markdown内容
function parseMarkdown(content) {
    try {
        // 配置marked选项
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {}
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
        
        let html = marked.parse(content);
        
        // 为代码块添加复制按钮
        html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
            const cleanCode = code.replace(/<[^>]*>/g, ''); // 移除HTML标签获取纯文本
            return `<div class="code-block-wrapper">
                      <pre><code${attrs}>${code}</code></pre>
                      <button class="copy-button" onclick="copyCode(this, \`${escapeForTemplate(cleanCode)}\`)">复制</button>
                    </div>`;
        });
        
        // 为表格添加响应式包装器
        html = html.replace(/<table([^>]*)>([\s\S]*?)<\/table>/g, (match, attrs, content) => {
            return `<div class="table-wrapper">
                      <table${attrs}>${content}</table>
                    </div>`;
        });
        
        return html;
    } catch (error) {
        console.error('Markdown parsing error:', error);
        // 如果解析失败，返回原始内容
        return content.replace(/\n/g, '<br>');
    }
}

// 转义模板字符串中的特殊字符
function escapeForTemplate(str) {
    return str.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\');
}

// 平滑滚动到底部
function smoothScrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// 手动滚动到底部的函数
function scrollToBottomManually() {
    const chatMessages = document.getElementById('chat-messages');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
    
    // 强制滚动到底部
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
    
    // 隐藏按钮
    scrollToBottomBtn.style.display = 'none';
    
    // 重置用户滚动状态
    if (window.userScrolled !== undefined) {
        window.userScrolled = false;
    }
}

// 复制代码功能
function copyCode(button, code) {
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const generateButton = document.getElementById('generate-button');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const loadingIndicator = document.getElementById('loading-indicator');

    // 存储历史消息
    let messageHistory = [];
    
    // 用户滚动状态管理
    let userScrolled = false;
    let scrollTimer = null;
    
    // 将userScrolled暴露到全局，供其他函数使用
    window.userScrolled = userScrolled;
    
    // 确保页面加载时输入框为空并设置随机name属性
    userInput.value = '';
    
    // 动态设置随机name属性来防止历史记录
    function randomizeInputName() {
        const randomName = 'input-' + Math.random().toString(36).substr(2, 9);
        userInput.setAttribute('name', randomName);
        userInput.setAttribute('autocomplete', 'new-password');
    }
    
    // 页面加载时设置随机name
    randomizeInputName();
    
    // 输入框获得焦点时清理历史记录
    userInput.addEventListener('focus', function() {
        // 重新设置随机name和其他属性
        randomizeInputName();
        
        // 额外的历史记录清理
        this.setAttribute('data-lpignore', 'true');
        this.removeAttribute('list');
    });
    
    // 输入框失去焦点时也清理
    userInput.addEventListener('blur', function() {
        // 延迟清理，避免干扰正常提交
        setTimeout(() => {
            randomizeInputName();
        }, 100);
    });
    
    // 检测用户是否滚动到底部
    function isAtBottom() {
        const threshold = 50; // 50px的阈值
        return chatMessages.scrollTop >= chatMessages.scrollHeight - chatMessages.clientHeight - threshold;
    }
    
    // 监听用户滚动事件
    chatMessages.addEventListener('scroll', () => {
        const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
        
        // 如果用户滚动到底部，则允许自动滚动
        if (isAtBottom()) {
            userScrolled = false;
            window.userScrolled = false;
            scrollToBottomBtn.style.display = 'none'; // 隐藏按钮
        } else {
            // 用户手动滚动了
            userScrolled = true;
            window.userScrolled = true;
            scrollToBottomBtn.style.display = 'flex'; // 显示按钮
        }
        
        // 清除之前的定时器
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        
        // 3秒后如果用户没有继续滚动，且在底部，则重新启用自动滚动
        scrollTimer = setTimeout(() => {
            if (isAtBottom()) {
                userScrolled = false;
                window.userScrolled = false;
                scrollToBottomBtn.style.display = 'none';
            }
        }, 3000);
    });
    
    // 智能滚动函数：只在用户没有手动滚动时才自动滚动
    function smartScrollToBottom() {
        if (!userScrolled) {
            smoothScrollToBottom();
        }
    }
    async function handleUserInput() {
        // 如果正在自动提问，忽略用户输入
        if (isAutoAsking) {
            console.log('自动提问进行中，忽略用户输入');
            return;
        }
        
        const inputText = userInput.value.trim(); // 获取输入框的值并去除空格
        
        if (!inputText) {
            alert("请输入产品需求描述！"); // 提示用户输入内容
            return;
        }

        // 隐藏欢迎消息（如果存在）
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // 使用统一的执行逻辑
        executeUserInput(inputText);
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

    // 节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // 流式输出 - 创建流式消息容器
    function createStreamingMessage() {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'system', 'streaming');
        
        const markdownContainer = document.createElement('div');
        markdownContainer.classList.add('markdown-content');
        messageElement.appendChild(markdownContainer);
        
        messagesContainer.appendChild(messageElement);
        
        // 创建节流渲染函数
        const throttledRender = throttle(() => {
            renderStreamingContent({
                container: markdownContainer,
                content: messageElement._content || ''
            });
        }, 100); // 每100ms最多渲染一次
        
        return {
            element: messageElement,
            container: markdownContainer,
            content: '',
            throttledRender: throttledRender
        };
    }

    // 更新流式消息内容
    function updateStreamingMessage(streamingMessage, newContent) {
        streamingMessage.content += newContent;
        
        // 存储内容到元素上，供节流函数使用
        streamingMessage.element._content = streamingMessage.content;
        
        // 使用节流渲染提高性能
        streamingMessage.throttledRender();
        
        // 智能自动滚动：只在用户没有手动滚动时才滚动
        setTimeout(() => {
            smartScrollToBottom();
        }, 10);
    }

    // 渲染流式内容（支持实时markdown）
    function renderStreamingContent(streamingMessage) {
        try {
            const content = streamingMessage.content;
            let renderedHtml = '';
            
            // 检测是否包含markdown格式
            if (isMarkdownContent(content)) {
                // 实时渲染markdown
                renderedHtml = parseMarkdown(content);
                // 智能插入光标到最后的文本节点
                renderedHtml = insertCursorIntoHtml(renderedHtml);
            } else {
                // 显示纯文本
                renderedHtml = content.replace(/\n/g, '<br>');
                // 添加跟随光标
                renderedHtml += '<span class="streaming-cursor"></span>';
            }
            
            // 更新容器内容
            streamingMessage.container.innerHTML = renderedHtml;
            
            // 保持代码高亮功能
            if (window.hljs && isMarkdownContent(content)) {
                streamingMessage.container.querySelectorAll('pre code').forEach((block) => {
                    if (!block.classList.contains('hljs')) {
                        hljs.highlightElement(block);
                    }
                });
            }
        } catch (error) {
            console.warn('流式markdown渲染失败，使用纯文本:', error);
            // 如果markdown渲染失败，降级为纯文本
            const fallbackHtml = streamingMessage.content.replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>';
            streamingMessage.container.innerHTML = fallbackHtml;
        }
    }

    // 智能插入光标到HTML的最后文本位置
    function insertCursorIntoHtml(html) {
        const cursorHtml = '<span class="streaming-cursor"></span>';
        
        // 创建临时DOM来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // 找到最后一个文本节点
        function findLastTextNode(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                return node;
            }
            
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                const lastText = findLastTextNode(node.childNodes[i]);
                if (lastText) {
                    return lastText;
                }
            }
            return null;
        }
        
        const lastTextNode = findLastTextNode(tempDiv);
        
        if (lastTextNode) {
            // 在最后一个文本节点后插入光标
            const cursorElement = document.createElement('span');
            cursorElement.className = 'streaming-cursor';
            lastTextNode.parentNode.insertBefore(cursorElement, lastTextNode.nextSibling);
        } else {
            // 如果没找到文本节点，就在最后添加
            const cursorElement = document.createElement('span');
            cursorElement.className = 'streaming-cursor';
            tempDiv.appendChild(cursorElement);
        }
        
        return tempDiv.innerHTML;
    }

    // 生成后续提问选项
    function addFollowUpQuestions(streamingMessage) {
        // 根据对话内容智能生成相关的后续提问
        const followUpQuestions = generateFollowUpQuestions(streamingMessage.content);
        
        // 创建后续提问容器
        const followUpContainer = document.createElement('div');
        followUpContainer.classList.add('follow-up-questions');
        
        const title = document.createElement('div');
        title.classList.add('follow-up-title');
        title.textContent = '💡 继续完善PRD文档：';
        followUpContainer.appendChild(title);
        
        const questionsWrapper = document.createElement('div');
        questionsWrapper.classList.add('follow-up-wrapper');
        
        followUpQuestions.forEach((question, index) => {
            const questionButton = document.createElement('button');
            questionButton.classList.add('follow-up-question');
            questionButton.textContent = question;
            questionButton.onclick = () => {
                // 隐藏当前的后续提问选项
                followUpContainer.style.display = 'none';
                // 自动填写问题并提交
                autoAskQuestion(question);
            };
            questionsWrapper.appendChild(questionButton);
        });
        
        followUpContainer.appendChild(questionsWrapper);
        
        // 将后续提问添加到消息后面
        streamingMessage.element.appendChild(followUpContainer);
        
        // 添加动画效果
        setTimeout(() => {
            followUpContainer.classList.add('show');
        }, 500);
    }
    
    // 生成智能后续提问
    function generateFollowUpQuestions(content) {
        // 预设的PRD相关后续提问模板
        const questionTemplates = [
            // 功能深化类
            [
                "请详细描述核心功能的具体实现流程",
                "请补充用户界面设计要求和交互规范",
                "请说明数据结构和接口设计方案"
            ],
            // 需求分析类
            [
                "请分析用户使用场景和痛点问题",
                "请补充竞品分析和差异化优势",
                "请明确产品目标和成功指标"
            ],
            // 技术实现类
            [
                "请补充技术架构和开发规范",
                "请说明数据安全和隐私保护方案",
                "请制定项目开发时间表和里程碑"
            ],
            // 运营推广类
            [
                "请制定用户获取和增长策略",
                "请设计产品运营和推广方案",
                "请分析商业模式和盈利方式"
            ],
            // 风险评估类
            [
                "请评估项目风险和应对策略",
                "请补充产品测试和质量保证方案",
                "请说明产品迭代和版本规划"
            ]
        ];
        
        // 根据内容关键词智能选择合适的问题组
        const content_lower = content.toLowerCase();
        
        let selectedQuestions;
        if (content_lower.includes('功能') || content_lower.includes('feature') || content_lower.includes('需求')) {
            selectedQuestions = questionTemplates[0];
        } else if (content_lower.includes('用户') || content_lower.includes('场景') || content_lower.includes('分析')) {
            selectedQuestions = questionTemplates[1];
        } else if (content_lower.includes('技术') || content_lower.includes('开发') || content_lower.includes('架构')) {
            selectedQuestions = questionTemplates[2];
        } else if (content_lower.includes('运营') || content_lower.includes('推广') || content_lower.includes('营销')) {
            selectedQuestions = questionTemplates[3];
        } else if (content_lower.includes('风险') || content_lower.includes('测试') || content_lower.includes('质量')) {
            selectedQuestions = questionTemplates[4];
        } else {
            // 默认使用功能深化类问题
            selectedQuestions = questionTemplates[0];
        }
        
        return selectedQuestions;
    }
    
    // 防重复执行标志
    let isAutoAsking = false;
    
    // 自动提问功能
    function autoAskQuestion(question) {
        // 确保问题不为空
        if (!question || !question.trim()) {
            console.error('自动提问的问题为空');
            return;
        }
        
        // 防止重复执行
        if (isAutoAsking) {
            console.log('自动提问正在进行中，忽略重复调用');
            return;
        }
        
        isAutoAsking = true;
        
        // 隐藏欢迎消息（如果存在）
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // 滚动到底部确保用户看到提问过程
        smartScrollToBottom();
        
        // 添加视觉反馈，让输入框短暂高亮并显示问题文本
        userInput.style.borderColor = 'var(--primary-color)';
        userInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
        userInput.value = question.trim();
        
        // 延迟很短时间让用户看到输入内容，然后直接提交
        setTimeout(() => {
            // 重置输入框样式
            userInput.style.borderColor = '';
            userInput.style.boxShadow = '';
            
            // 立即清空输入框
            userInput.value = '';
            randomizeInputName();
            
            // 直接执行提交逻辑
            executeUserInput(question.trim());
        }, 150);
    }
    
    // 防重复执行API请求的标志
    let isProcessingRequest = false;
    
    // 提取handleUserInput的核心逻辑，供自动提问使用
    function executeUserInput(inputText) {
        // 防止重复处理请求
        if (isProcessingRequest) {
            console.log('正在处理请求中，忽略重复调用');
            return;
        }
        
        isProcessingRequest = true;
        
        // 立即清空输入框，防止在流式输出过程中显示上一次输入
        userInput.value = '';
        
        // 重新设置随机name属性防止历史记录
        randomizeInputName();
        
        // 隐藏所有之前的后续提问选项
        const previousFollowUps = document.querySelectorAll('.follow-up-questions');
        previousFollowUps.forEach(followUp => {
            followUp.style.display = 'none';
        });
        
        // 重置滚动状态，确保新消息能正常显示
        userScrolled = false;
        window.userScrolled = false;
        
        // 显示用户输入
        addMessage('user', inputText);

        // 显示加载动画并禁用按钮
        loadingIndicator.style.display = 'block';
        generateButton.disabled = true;
        generateButton.innerHTML = '<span class="button-text">生成中...</span><span class="button-icon">⏳</span>';

        // 将用户输入添加到历史消息
        messageHistory.push({ role: 'user', content: inputText });

        // 发送API请求
        sendApiRequest(messageHistory).finally(() => {
            // 恢复按钮状态
            generateButton.disabled = false;
            generateButton.innerHTML = '<span class="button-text">生成PRD</span><span class="button-icon">✨</span>';
            
            // 确保输入框已清空并重新设置随机name
            userInput.value = '';
            randomizeInputName();
            
            // 重置处理标志位
            isProcessingRequest = false;
            
            // 如果是自动提问，也重置自动提问标志位
            if (isAutoAsking) {
                isAutoAsking = false;
            }
        });
    }

    // 完成流式消息
    function finishStreamingMessage(streamingMessage) {
        streamingMessage.element.classList.remove('streaming');
        
        // 最终渲染，确保完整性（移除光标）
        try {
            if (isMarkdownContent(streamingMessage.content)) {
                const finalHtml = parseMarkdown(streamingMessage.content);
                streamingMessage.container.innerHTML = finalHtml;
                
                // 确保代码高亮完整应用
                if (window.hljs) {
                    streamingMessage.container.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
            } else {
                streamingMessage.container.innerHTML = streamingMessage.content.replace(/\n/g, '<br>');
            }
        } catch (error) {
            console.warn('最终渲染失败，使用纯文本:', error);
            streamingMessage.container.innerHTML = streamingMessage.content.replace(/\n/g, '<br>');
        }
        
        // 添加后续提问选项
        addFollowUpQuestions(streamingMessage);
        
        // 智能滚动：只在用户没有手动滚动时才滚动到底部
        setTimeout(() => {
            const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
            if (userScrolled && scrollToBottomBtn) {
                // 如果用户正在查看历史内容，更新按钮文字提示生成完成
                scrollToBottomBtn.innerHTML = '<span>✅</span><span>生成完成，查看结果</span>';
                scrollToBottomBtn.classList.add('completed');
                
                // 3秒后恢复原来的文字
                setTimeout(() => {
                    scrollToBottomBtn.innerHTML = '<span>↓</span><span>回到底部</span>';
                    scrollToBottomBtn.classList.remove('completed');
                }, 3000);
            }
            smartScrollToBottom();
        }, 100);
    }

    async function sendApiRequest(history) {
        console.log("历史消息:", history); // 打印历史消息
        
        let streamingMessage = null;
        let fullContent = '';
        
        try {
            // 发送流式请求到API
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        { role: "system", content: config.systemPrompt },
                        ...history
                    ],
                    max_tokens: config.maxTokens,
                    temperature: 0.7,
                    stream: true // 启用流式输出
                })
            });

            if (!response.ok) {
                throw new Error('API请求失败');
            }

            // 隐藏加载动画，创建流式消息容器
            loadingIndicator.style.display = 'none';
            streamingMessage = createStreamingMessage();

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            
                            if (content) {
                                fullContent += content;
                                updateStreamingMessage(streamingMessage, content);
                            }
                        } catch (e) {
                            // 忽略解析错误的行
                            console.log('忽略无效的SSE数据:', data);
                        }
                    }
                }
            }

            // 完成流式输出
            finishStreamingMessage(streamingMessage);
            
            // 将完整消息添加到历史记录
            messageHistory.push({'role': 'assistant', 'content': fullContent});
            
        } catch (error) {
            console.error('流式请求失败，尝试普通请求:', error);
            
            // 如果流式请求失败，尝试普通请求作为降级方案
            if (!streamingMessage) {
                try {
                    const fallbackResponse = await fetch(config.apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.apiKey}`
                        },
                        body: JSON.stringify({
                            model: config.model,
                            messages: [
                                { role: "system", content: config.systemPrompt },
                                ...history
                            ],
                            max_tokens: config.maxTokens,
                            temperature: 0.7,
                            stream: false // 不使用流式输出
                        })
                    });

                    if (fallbackResponse.ok) {
                        const data = await fallbackResponse.json();
                        loadingIndicator.style.display = 'none';
                        
                        const aiMessage = data.choices[0].message.content;
                        messageHistory.push({'role': 'assistant', 'content': aiMessage});
                        
                        // 使用addMessage添加消息，然后为最后一个系统消息添加后续提问
                        addMessage('system', aiMessage);
                        
                        // 为降级方案的消息也添加后续提问选项
                        setTimeout(() => {
                            const lastSystemMessage = document.querySelector('.message.system:last-child');
                            if (lastSystemMessage) {
                                const mockStreamingMessage = {
                                    element: lastSystemMessage,
                                    content: aiMessage
                                };
                                addFollowUpQuestions(mockStreamingMessage);
                            }
                        }, 500);
                        
                        // 智能滚动：只在用户没有手动滚动时才滚动到底部
                        setTimeout(() => {
                            smartScrollToBottom();
                        }, 800);
                        return;
                    }
                } catch (fallbackError) {
                    console.error('降级请求也失败:', fallbackError);
                }
            }
            
            // 所有请求都失败了
            loadingIndicator.style.display = 'none';
            
            if (streamingMessage) {
                updateStreamingMessage(streamingMessage, '生成PRD时出错，请重试。');
                finishStreamingMessage(streamingMessage);
            } else {
                addMessage('system', '生成PRD时出错，请重试。');
            }
            
            // 确保在错误情况下也清空输入框并重新设置随机name
            userInput.value = '';
            randomizeInputName();
        }
    }
});
