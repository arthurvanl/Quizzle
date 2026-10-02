import {useState, useRef, useCallback} from "react";
import {generateUuid} from "@/common/utils/UuidUtil.js";
import toast from "react-hot-toast";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faWandMagicSparkles} from "@fortawesome/free-solid-svg-icons";
import {imageCache} from "@/common/utils/ImageCacheUtil.js";

export const useAIGeneration = ({setQuestions, setActiveQuestion, setTitle, setDescription}) => {
    const [generating, setGenerating] = useState(false);
    const abortRef = useRef(null);

    const stop = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    const generate = useCallback(async (options) => {
        const opts = typeof options === 'string'
            ? {topic: options, questionCount: arguments[1]}
            : (options || {});
        const {topic, questionCount, context, difficulty, generateMetadata} = opts;

        const hasTopic = typeof topic === 'string' && topic.trim().length >= 2;
        const hasContext = typeof context === 'string' && context.trim().length >= 50;
        if ((!hasTopic && !hasContext) || generating) return;

        setGenerating(true);

        const controller = new AbortController();
        abortRef.current = controller;
        let stage = 'Waiting for AI...';
        let firstQuestionHandled = false;

        const isEmptyQuestion = (q) => !q || (!q.title?.trim() && (!q.answers || q.answers.length === 0));

        const renderToast = (msg, count) => (
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <span>{msg}{count > 0 ? ` (${count})` : ''}</span>
                <button
                    onClick={() => stop()}
                    style={{
                        background: 'none', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '0.4rem',
                        padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        color: '#EC5555', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif'
                    }}
                >Stop
                </button>
            </div>
        );

        const toastId = toast.loading(renderToast(stage, 0), {
            icon: <FontAwesomeIcon icon={faWandMagicSparkles} style={{color: '#8B5CF6'}}/>,
            duration: Infinity
        });

        const updateToast = (msg, count) => toast.loading(renderToast(msg, count), {
            id: toastId,
            icon: <FontAwesomeIcon icon={faWandMagicSparkles} style={{color: '#8B5CF6'}}/>
        });

        try {
            const body = {};
            if (hasTopic) body.topic = topic.trim();
            if (hasContext) body.context = context;
            if (questionCount && questionCount >= 1 && questionCount <= 50) body.questionCount = questionCount;
            if (difficulty && difficulty !== 'none') body.difficulty = difficulty;
            if (generateMetadata) body.generateMetadata = true;

            const response = await fetch("/api/ai/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || "Generation failed.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let count = 0;

            updateToast(generateMetadata ? "AI is creating title & description..." : "AI is generating questions...", 0);

            while (true) {
                const {done: readerDone, value} = await reader.read();
                if (readerDone) break;

                buffer += decoder.decode(value, {stream: true});
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    try {
                        const event = JSON.parse(trimmed.slice(6));

                        if (event.type === 'status') {
                            if (event.stage === 'metadata') {
                                updateToast("AI is creating title & description...", count);
                            } else if (event.stage === 'questions') {
                                updateToast("AI is generating questions...", count);
                            }
                        } else if (event.type === 'metadata') {
                            const {title: metaTitle, description: metaDesc} = event.data || {};
                            if (metaTitle && setTitle) setTitle(metaTitle);
                            if (metaDesc && setDescription) setDescription(metaDesc);
                        } else if (event.type === 'question') {
                            const q = event.data;
                            const newQuestion = {
                                uuid: q.uuid || generateUuid(),
                                title: q.title,
                                type: q.type,
                                answers: q.answers || []
                            };

                            setQuestions(prev => {
                                if (!firstQuestionHandled && prev.length > 0 && prev.every(isEmptyQuestion)) {
                                    firstQuestionHandled = true;
                                    return [newQuestion];
                                }
                                firstQuestionHandled = true;
                                return [...prev, newQuestion];
                            });

                            setActiveQuestion(newQuestion.uuid);
                            count++;
                            updateToast("AI is generating questions...", count);
                        } else if (event.type === 'image') {
                            const {uuid, b64_image} = event;
                            if (uuid && b64_image) {
                                try {
                                    const byteString = atob(b64_image.split(',')[1]);
                                    const mimeType = b64_image.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
                                    const ab = new Uint8Array(byteString.length);
                                    for (let i = 0; i < byteString.length; i++) ab[i] = byteString.charCodeAt(i);
                                    const file = new File([ab], 'ai-image.jpg', {type: mimeType});
                                    imageCache.storeImage(uuid, file).then(imageId => {
                                        setQuestions(prev => prev.map(q =>
                                            q.uuid === uuid ? {...q, imageId} : q
                                        ));
                                    });
                                } catch (e) {
                                    console.warn('Failed to store AI image:', e);
                                }
                            }
                        } else if (event.type === 'error') {
                            throw new Error(event.message);
                        }
                    } catch (e) {
                        if (e.message && !e.message.includes('JSON')) throw e;
                    }
                }
            }

            toast.success(`${count} question${count !== 1 ? 's' : ''} generated!`, {id: toastId, duration: 4000});
        } catch (e) {
            if (e.name !== 'AbortError') {
                toast.error(e.message || "AI generation failed.", {id: toastId, duration: 4000});
            } else {
                toast.dismiss(toastId);
            }
        }

        setGenerating(false);
        abortRef.current = null;
    }, [generating, stop, setQuestions, setActiveQuestion, setTitle, setDescription]);

    return {generating, generate, stop};
};
