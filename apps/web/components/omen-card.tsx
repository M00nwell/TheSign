'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { motion, useMotionValue, useAnimation, PanInfo, animate } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { getDailyOmen, OmenData } from '../app/actions/get-daily-omen'
import { useUser } from '@/providers/user-provider'

// Module-level variable to deduplicate fetches (Double-Lock)
// using a map to handle different user contexts (e.g. anon vs logged in)
// Key: 'anon' or user.id
let activeFetchPromises: Record<string, Promise<OmenData | null>> = {};

const toChineseLunarMonth = (m: number) => {
    const months = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    return months[m - 1] || m.toString();
}

const toChineseLunarDay = (d: number) => {
    const chineseDays = [
        '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    return chineseDays[d] || d.toString();
}


export interface OmenCardHandle {
    share: () => Promise<void>
}

const OmenCard = forwardRef<OmenCardHandle>(function OmenCard(_, ref) {
    const [isFlipped, setIsFlipped] = useState(false)
    const [omenData, setOmenData] = useState<OmenData | null>(null)
    const [loading, setLoading] = useState(true)
    const [imageError, setImageError] = useState(false)
    const { language, user } = useUser()

    // Animation controls
    const x = useMotionValue(0)
    const rotateY = useMotionValue(0)
    const baseRotation = useRef(0)
    const controls = useAnimation()

    // ─────────────────────────────────────────────────────────────────────────
    // Share Logic – Canvas 2D, dynamic height (no empty space)
    // ─────────────────────────────────────────────────────────────────────────
    const handleShare = async () => {
        if (!omenData) return;

        const W = 680;
        const PAD = 56;        // horizontal padding
        const TOP_PAD = 56;    // top breathing room
        const BOT_PAD = 72;    // bottom breathing room
        const maxTextW = W - PAD * 2;

        // ── Text-wrap helper (CJK char-by-char, EN word-by-word) ──
        const makeWrap = (measureCtx: CanvasRenderingContext2D) =>
            (text: string, font: string, maxW: number): string[] => {
                measureCtx.font = font;
                const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/.test(text);
                const tokens = isCJK ? text.split('') : text.split(' ');
                const lines: string[] = [];
                let cur = '';
                for (const t of tokens) {
                    const next = isCJK ? cur + t : (cur ? `${cur} ${t}` : t);
                    if (measureCtx.measureText(next).width > maxW && cur) {
                        lines.push(cur);
                        cur = t;
                    } else {
                        cur = next;
                    }
                }
                if (cur) lines.push(cur);
                return lines;
            };

        // ── Pass 1: measure using a scratch canvas ──
        const scratch = document.createElement('canvas');
        scratch.width = W; scratch.height = 10;
        const sc = scratch.getContext('2d')!;
        const wrap = makeWrap(sc);

        const EXP_FONT_SIZE = 30;
        const EXP_LINE_H = 50;
        const TXT_FONT_SIZE = 40;
        const TXT_LINE_H = 60;
        const IMG_SIZE = Math.round(W * 0.82); // ~557px

        let H: number;
        let expLines: string[] = [];
        let frontTextLines: string[] = [];

        if (isFlipped) {
            const BOX_H = 268;
            const BADGE_H = 28;
            const DIV_H = 1;
            expLines = wrap(
                omenData.content[language].explanation,
                `400 ${EXP_FONT_SIZE}px sans-serif`,
                maxTextW
            );
            H = TOP_PAD
                + BOX_H           // almanac box
                + 44              // gap box→badge
                + BADGE_H         // EN badge
                + 44              // gap badge→explanation
                + expLines.length * EXP_LINE_H
                + 44              // gap explanation→divider
                + DIV_H
                + 24              // gap divider→branding
                + 26              // branding text
                + BOT_PAD;
        } else {
            frontTextLines = wrap(
                omenData.content[language].text,
                `italic 400 ${TXT_FONT_SIZE}px serif`,
                maxTextW
            );
            H = TOP_PAD
                + IMG_SIZE        // omen image (square)
                + 32              // gap image→text
                + frontTextLines.length * TXT_LINE_H
                + 40              // gap text→divider
                + 1               // divider
                + 22              // gap divider→branding
                + 26              // branding text
                + BOT_PAD;
        }

        // ── Pass 2: render onto correctly-sized canvas ──
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        // Background
        if (isFlipped) {
            ctx.fillStyle = '#f8f7f4';
            ctx.fillRect(0, 0, W, H);
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, 'rgba(235,228,215,0.55)');
            bg.addColorStop(1, 'rgba(248,247,244,0)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
        }

        // Rounded border
        const RR = 44;
        ctx.strokeStyle = isFlipped ? '#ddd5ee' : '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(RR, 0); ctx.lineTo(W - RR, 0);
        ctx.arcTo(W, 0, W, RR, RR);
        ctx.lineTo(W, H - RR);
        ctx.arcTo(W, H, W - RR, H, RR);
        ctx.lineTo(RR, H);
        ctx.arcTo(0, H, 0, H - RR, RR);
        ctx.lineTo(0, RR);
        ctx.arcTo(0, 0, RR, 0, RR);
        ctx.closePath();
        ctx.stroke();

        ctx.textAlign = 'center';
        let y = TOP_PAD;

        if (isFlipped) {
            // ── Almanac box ──
            const BOX_H = 268;
            const bx = PAD, bw = W - PAD * 2;
            ctx.fillStyle = '#f4e4bc';
            ctx.beginPath();
            ctx.roundRect(bx, y, bw, BOX_H, 10);
            ctx.fill();
            ctx.strokeStyle = '#e6d2a0'; ctx.lineWidth = 1.5; ctx.stroke();

            if (omenData.almanac) {
                const { gzYear, lunarMonth, lunarDay } = omenData.almanac;
                const zhMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
                const days = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

                ctx.fillStyle = '#8b6f3a';
                ctx.font = '600 28px serif';
                ctx.fillText(`${gzYear}年`, W / 2, y + 44);

                ctx.font = '600 28px serif';
                ctx.fillText(`${zhMonths[lunarMonth - 1] || lunarMonth}月${days[lunarDay] || lunarDay}`, W / 2, y + 82);

                ctx.font = '900 80px serif';
                ctx.fillStyle = omenData.type === 'avoid' ? '#b91c1c' : '#15803d';
                ctx.fillText(omenData.type === 'avoid' ? '忌' : '宜', W / 2, y + 178);

                ctx.strokeStyle = 'rgba(139,111,58,0.22)'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bx + 28, y + 196); ctx.lineTo(bx + bw - 28, y + 196);
                ctx.stroke();

                ctx.font = '700 32px serif';
                ctx.fillStyle = '#1f2937';
                ctx.fillText(omenData.content['zh'].activityDisplayName, W / 2, y + 240);
            }
            y += BOX_H + 44;

            // ── EN badge ──
            ctx.font = '700 24px sans-serif';
            ctx.fillStyle = omenData.type === 'avoid' ? '#dc2626' : '#16a34a';
            ctx.fillText(
                `${omenData.type === 'avoid' ? '⚠ AVOID' : '✓ DO'} · ${omenData.content['en'].activityDisplayName.toUpperCase()}`,
                W / 2, y
            );
            y += 28 + 44; // badge height + gap

            // ── Explanation text ──
            ctx.fillStyle = '#374151';
            ctx.font = `400 ${EXP_FONT_SIZE}px sans-serif`;
            expLines.forEach(line => {
                ctx.fillText(line, W / 2, y);
                y += EXP_LINE_H;
            });
            y += 44;

            // ── Divider ──
            ctx.strokeStyle = '#dde1f5'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(W * 0.22, y); ctx.lineTo(W * 0.78, y);
            ctx.stroke();
            y += 24;

            // ── Branding ──
            ctx.fillStyle = '#a0abc0';
            ctx.font = '500 22px sans-serif';
            ctx.fillText('THE SIGN', W / 2, y + 20);

        } else {
            // ── Omen image ──
            const imgX = (W - IMG_SIZE) / 2;
            const imgSrc = (!imageError && omenData.imageUrl) ? omenData.imageUrl : '/sign.png';
            const img = new window.Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>(resolve => {
                img.onload = () => {
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.22)';
                    ctx.shadowBlur = 36;
                    ctx.shadowOffsetY = 16;
                    ctx.drawImage(img, imgX, y, IMG_SIZE, IMG_SIZE);
                    ctx.restore();
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = imgSrc;
            });
            y += IMG_SIZE + 32;

            // ── Omen text ──
            ctx.fillStyle = '#4b5563';
            ctx.font = `italic 400 ${TXT_FONT_SIZE}px serif`;
            frontTextLines.forEach(line => {
                ctx.fillText(line, W / 2, y);
                y += TXT_LINE_H;
            });
            y += 40;

            // ── Divider ──
            ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(W * 0.28, y); ctx.lineTo(W * 0.72, y);
            ctx.stroke();
            y += 22;

            // ── Branding ──
            ctx.fillStyle = '#a0abc0';
            ctx.font = '500 22px sans-serif';
            ctx.fillText('THE SIGN · Daily Omen', W / 2, y + 20);
        }

        // ── Share or download ──
        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) return;
            const file = new File([blob], 'daily-omen.png', { type: 'image/png' });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'My Daily Omen', text: 'Check out my omen for today!' });
                    return;
                } catch { /* fall through */ }
            }
            const link = document.createElement('a');
            link.download = 'daily-omen.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    };

    useImperativeHandle(ref, () => ({
        share: handleShare,
    }));

    // Drive rotation manually
    const handleDrag = (event: any, info: PanInfo) => {
        const rotationOffset = info.offset.x * 0.72
        rotateY.set(baseRotation.current + rotationOffset)
    }

    const handleDevReload = async () => {
        setLoading(true)
        const todayKey = new Date().toLocaleDateString('en-CA')
        const userIdSuffix = user?.id ? `-${user.id}` : '-anon'
        const storageKey = `daily-omen-v4-${todayKey}${userIdSuffix}`
        localStorage.removeItem(storageKey)

        const userKey = user?.id || 'anon';
        delete activeFetchPromises[userKey];

        rotateY.set(0)
        baseRotation.current = 0
        x.set(0)
        setIsFlipped(false)
        setImageError(false)

        try {
            const data = await getDailyOmen()
            if (data) {
                localStorage.setItem(storageKey, JSON.stringify(data))
                setOmenData(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setImageError(false)
    }, [omenData])

    // Fetch Logic
    useEffect(() => {
        async function loadOmen() {
            setLoading(true)
            try {
                const todayKey = new Date().toLocaleDateString('en-CA')
                const userIdSuffix = user?.id ? `-${user.id}` : '-anon'
                const storageKey = `daily-omen-v4-${todayKey}${userIdSuffix}`

                const cached = localStorage.getItem(storageKey)
                if (cached) {
                    setOmenData(JSON.parse(cached))
                    setLoading(false)
                    return
                }

                const userKey = user?.id || 'anon';
                if (!activeFetchPromises[userKey]) {
                    activeFetchPromises[userKey] = getDailyOmen().finally(() => {
                        delete activeFetchPromises[userKey]
                    })
                }

                const data = await activeFetchPromises[userKey]
                if (data) {
                    localStorage.setItem(storageKey, JSON.stringify(data))
                    setOmenData(data)
                }
            } catch (error) {
                console.error("Failed to fetch omen", error)
            } finally {
                setLoading(false)
            }
        }
        loadOmen()
    }, [user?.id])

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100
        const velocityThreshold = 500
        const offset = info.offset.x
        const velocity = info.velocity.x

        let newBase = baseRotation.current

        if (offset > threshold || velocity > velocityThreshold) {
            newBase += 180
        } else if (offset < -threshold || velocity < -velocityThreshold) {
            newBase -= 180
        }

        baseRotation.current = newBase

        animate(rotateY, newBase, { type: "spring", stiffness: 300, damping: 30 })
        controls.start({ x: 0, transition: { duration: 0 } })

        const normalized = Math.abs(newBase % 360)
        setIsFlipped(normalized === 180)
    }

    return (
        <div className="relative w-[340px] h-[520px] select-none">

            {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDevReload();
                    }}
                    className="absolute top-4 left-4 z-[100] bg-gray-100 px-2 py-1 rounded opacity-50 text-[10px] text-gray-500 hover:opacity-100 transition-opacity cursor-pointer"
                >
                    Dev Reload
                </button>
            )}
            {/* 1. Drag Sensor (Invisible Top Layer) */}
            <motion.div
                className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
                style={{ x }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
            />

            {/* 2. Visual Card (Reacts to sensor) */}
            <div className={`perspective-1000 w-full h-full pointer-events-none`}>
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    style={{
                        rotateY,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* FRONT FACE: The Omen Result (Image + Text) */}
                    <div
                        className="absolute w-full h-full bg-white rounded-3xl border border-gray-200 shadow-2xl flex flex-col items-center justify-between p-6"
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transformStyle: 'preserve-3d',
                            transform: 'translateZ(1px)'
                        }}
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                <p className="text-gray-400 text-sm font-medium animate-pulse">Consulting the oracles...</p>
                            </div>
                        ) : omenData ? (
                            <>
                                <div className="relative w-full h-full -mt-8" style={{ transformStyle: 'preserve-3d' }}>
                                    <motion.div
                                        className="relative w-full h-full"
                                        style={{ transform: 'translateZ(16px)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.3))' }}
                                    >
                                        <Image
                                            src={(!imageError && omenData.imageUrl) ? omenData.imageUrl : '/sign.png'}
                                            alt="Omen Sign"
                                            fill
                                            className="object-contain scale-[1.1] -translate-y-4"
                                            onError={() => setImageError(true)}
                                            unoptimized
                                        />
                                    </motion.div>
                                </div>

                                <div className="w-full flex-1 flex flex-col items-center justify-center text-center -mt-32 z-10">
                                    <p className="text-2xl font-serif italic text-gray-600 leading-tight px-2">
                                        {omenData.content[language].text}
                                    </p>
                                </div>

                                <div className="mt-4 text-xs text-gray-400 font-medium tracking-wide uppercase">
                                    {language === 'en' ? 'Swipe to Interpret' : '滑动查看解读'}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>No omen found for today.</p>
                            </div>
                        )}
                        {/* Card texture/grain */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                    </div>

                    {/* BACK FACE: The Explanation */}
                    <div
                        className="absolute w-full h-full bg-slate-50 rounded-3xl border border-indigo-100 shadow-2xl flex flex-col items-center p-8 pt-16 pointer-events-auto"
                        style={{
                            transform: 'rotateY(180deg) translateZ(1px)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        {omenData && (
                            <>
                                {omenData.almanac && (
                                    <div className="w-[80%] bg-[#f4e4bc] relative rounded-sm p-4 mb-4 shadow-xl border border-[#e6d2a0] flex flex-col items-center justify-center font-serif text-gray-800"
                                        style={{
                                            backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')",
                                            transform: 'translateZ(15px)',
                                        }}>
                                        <div className="text-sm tracking-widest mb-1 opacity-80 font-medium">
                                            {omenData.almanac.gzYear}年
                                        </div>
                                        <div className="text-lg font-bold tracking-widest mb-2 text-[#8b5a2b]">
                                            {toChineseLunarMonth(omenData.almanac.lunarMonth)}月{toChineseLunarDay(omenData.almanac.lunarDay)}
                                        </div>
                                        <div className={`text-4xl font-black mb-1 font-serif ${omenData.type === 'avoid' ? 'text-red-700' : 'text-green-700'}`}>
                                            {omenData.type === 'avoid' ? '忌' : '宜'}
                                        </div>
                                        <div className="text-xl font-bold tracking-widest text-gray-900 border-t border-b border-gray-400/30 py-1 px-4 mt-2">
                                            {omenData.content['zh'].activityDisplayName}
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                                            <div className="w-12 h-12 border-2 border-red-800 rounded-full flex items-center justify-center text-[10px] text-red-800 rotate-12">
                                                通勝
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {language === 'en' ? (
                                    <div className="flex items-center justify-center gap-3 mb-4 w-full" style={{ transform: 'translateZ(10px)' }}>
                                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${omenData.type === 'avoid' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {omenData.type === 'avoid' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                            <span className="text-xs font-bold tracking-widest uppercase">
                                                {omenData.type === 'avoid' ? 'Avoid' : 'Do'}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-800 tracking-wide">
                                            {omenData.content['en'].activityDisplayName}
                                        </h2>
                                    </div>
                                ) : (
                                    <div className="h-8 mb-4 w-full" />
                                )}

                                <div className="flex-1 overflow-y-auto w-full pr-2 custom-scrollbar flex flex-col justify-start pt-2">
                                    <p className="text-gray-700 leading-relaxed text-base font-normal whitespace-pre-wrap text-center">
                                        {omenData.content[language].explanation}
                                    </p>
                                </div>

                                <div className="w-full h-[1px] bg-indigo-100 my-6" />

                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">The Sign</p>
                                </div>
                            </>
                        )}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                    </div>
                </motion.div>
            </div >
        </div >
    )
})

export default OmenCard
