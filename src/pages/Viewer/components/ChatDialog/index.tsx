import React, { useState, useRef, useEffect } from 'react';
import { Bubble } from '@ant-design/x';
import { Input } from 'antd';
import { BookAI } from './icons';
import styles from './ChatDialog.module.css';

const { TextArea } = Input;

// 消息类型
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatDialogProps {
    bookTitle?: string;
    currentChapter?: string;
    open: boolean;
    onClose: () => void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
    bookTitle,
    currentChapter,
    open,
    onClose,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 模拟 AI 响应（后续接入真实 API）
    const simulateAIResponse = async (userMessage: string): Promise<string> => {
        // 这里后续替换为真实的大模型 API 调用
        // 当前返回模拟响应
        return `关于"${userMessage}"，这是模拟的 AI 响应。\n\n在实际的书籍阅读中，我可以帮助您：\n\n1. **解释概念** - 理解书中的专业术语\n2. **分析情节** - 讨论故事的发展和人物关系\n3. **延伸思考** - 将书中的观点与现实联系起来\n4. **解答疑问** - 回答您阅读中的困惑\n\n您当前阅读的是《${bookTitle || '未知书籍'}》${currentChapter ? `的 "${currentChapter}" 部分` : ''}。有什么想要探讨的吗？`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open) {
            scrollToBottom();
        }
    }, [messages, open]);

    const handleSend = async (value: string) => {
        if (!value.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: value.trim(),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            const aiResponse = await simulateAIResponse(value.trim());
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI 响应失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 渲染消息内容 - 使用 markdown 格式
    const renderMessageContent = (content: string) => {
        return content;
    };

    if (!open) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <BookAI className={styles.headerIcon} />
                    <span className={styles.headerTitle}>书籍探讨</span>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
            </div>

            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.welcome}>
                        <BookAI className={styles.welcomeIcon} />
                        <div className={styles.welcomeTitle}>欢迎开始探讨</div>
                        <div className={styles.welcomeText}>
                            您正在阅读《{bookTitle || '未知书籍'}》
                            {currentChapter && ` · ${currentChapter}`}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <Bubble
                                key={msg.id}
                                placement={msg.role === 'user' ? 'end' : 'start'}
                                content={renderMessageContent(msg.content)}
                                className={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}
                            />
                        ))}
                        {loading && (
                            <Bubble
                                placement="start"
                                content="思考中..."
                                className={styles.assistantBubble}
                            />
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
                <TextArea
                    placeholder="输入您的问题..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            handleSend((e.target as HTMLTextAreaElement).value);
                        }
                    }}
                    className={styles.input}
                />
                <button
                    className={styles.sendBtn}
                    onClick={(e) => {
                        const textarea = (e.currentTarget.previousSibling as HTMLTextAreaElement);
                        if (textarea?.value.trim()) {
                            handleSend(textarea.value);
                            textarea.value = '';
                        }
                    }}
                >
                    发送
                </button>
            </div>
        </div>
    );
};

export default ChatDialog;
