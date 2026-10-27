// ==UserScript==
// @name         大川学堂助手（整合版）
// @namespace    https://ecourse.scu.edu.cn/
// @version      4.0
// @description  川大大川学堂助手：防切屏暂停、自动播放、自动按目录顺序下一课、视频倍速记忆，完美支持单页应用，可拖拽悬浮窗。
// @match        https://ecourse.scu.edu.cn/*
// @grant        none
// @author       MarsMrx
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    console.log('[大川学堂助手] 终极整合版(顺序播放)已启动');

    // =========================================================
    // 1. 防切屏核心代码 (保持不变)
    // =========================================================
    try {
        Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    } catch (e) {}

    const blockEvents = ['visibilitychange', 'blur', 'focus', 'focusin', 'focusout', 'pagehide'];
    blockEvents.forEach(evt => {
        window.addEventListener(evt, (e) => {
            if (e.isTrusted) {
                e.stopImmediatePropagation();
                e.stopPropagation();
            }
        }, true);
    });

    const props = ['onvisibilitychange', 'onblur', 'onfocus'];
    props.forEach(prop => {
        try {
            Object.defineProperty(window, prop, { get: () => null, set: () => {}, configurable: true });
        } catch (e) {}
    });

    // =========================================================
    // 2. 倍速控制模块 (保持不变)
    // =========================================================
    let targetPlaybackRate = parseFloat(localStorage.getItem('scu_course_playback_rate')) || 1.0;

    function applyPlaybackRate() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (video.playbackRate !== targetPlaybackRate) {
                video.playbackRate = targetPlaybackRate;
            }
        });
    }

    document.addEventListener('ratechange', (e) => {
        if (e.target.tagName === 'VIDEO' && e.target.playbackRate !== targetPlaybackRate) {
            e.target.playbackRate = targetPlaybackRate;
        }
    }, true);

    document.addEventListener('loadedmetadata', (e) => {
        if (e.target.tagName === 'VIDEO') {
            e.target.playbackRate = targetPlaybackRate;
        }
    }, true);

    // =========================================================
    // 3. 可拖拽 UI 控制面板 (保持不变)
    // =========================================================
    function buildSpeedUI() {
        if (window.top !== window.self) return;
        if (document.getElementById('scu-speed-panel')) return;

        const savedPos = JSON.parse(localStorage.getItem('scu_panel_pos') || 'null');
        const isCollapsed = localStorage.getItem('scu_panel_collapsed') === 'true';

        const panel = document.createElement('div');
        panel.id = 'scu-speed-panel';

        let defaultTop = window.innerHeight - 150;
        let defaultLeft = 20;
        panel.style.cssText = `
            position: fixed;
            top: ${savedPos ? savedPos.top + 'px' : defaultTop + 'px'};
            left: ${savedPos ? savedPos.left + 'px' : defaultLeft + 'px'};
            z-index: 2147483647;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            border-radius: 12px;
            padding: 8px 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            display: flex; flex-direction: column; gap: 8px;
            color: #333; user-select: none;
            transition: box-shadow 0.2s, background 0.3s;
            min-width: 180px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            cursor: move; font-weight: 600; color: #555; font-size: 12px;
            border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 6px;
        `;

        const title = document.createElement('span');
        title.innerHTML = '⚙️ 播放设置';

        const toggleBtn = document.createElement('span');
        toggleBtn.innerHTML = isCollapsed ? '▼' : '▲';
        toggleBtn.style.cssText = 'cursor: pointer; padding: 0 4px; font-size: 10px; color: #888; transition: transform 0.2s;';

        header.appendChild(title);
        header.appendChild(toggleBtn);
        panel.appendChild(header);

        const content = document.createElement('div');
        content.style.cssText = `
            display: ${isCollapsed ? 'none' : 'grid'};
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
        `;

        const speeds = [1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0];
        speeds.forEach(speed => {
            const btn = document.createElement('button');
            btn.textContent = speed + 'x';
            btn.style.cssText = `
                border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.8);
                border-radius: 6px; padding: 4px 0; cursor: pointer; font-size: 11px;
                color: #444; font-weight: 500; transition: all 0.2s ease;
                outline: none; user-select: none;
            `;

            if (speed === targetPlaybackRate) {
                btn.style.background = '#4CAF50';
                btn.style.color = '#fff';
                btn.style.borderColor = '#4CAF50';
                btn.style.boxShadow = '0 2px 6px rgba(76, 175, 80, 0.3)';
            }

            btn.onmouseenter = () => {
                if (speed !== targetPlaybackRate) {
                    btn.style.background = 'rgba(0,0,0,0.05)';
                    btn.style.transform = 'translateY(-1px)';
                }
            };
            btn.onmouseleave = () => {
                if (speed !== targetPlaybackRate) {
                    btn.style.background = 'rgba(255,255,255,0.8)';
                    btn.style.transform = 'translateY(0)';
                }
            };

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                targetPlaybackRate = speed;
                localStorage.setItem('scu_course_playback_rate', targetPlaybackRate);
                applyPlaybackRate();

                Array.from(content.querySelectorAll('button')).forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.8)';
                    b.style.color = '#444';
                    b.style.borderColor = 'rgba(0,0,0,0.08)';
                    b.style.boxShadow = 'none';
                });

                btn.style.background = '#4CAF50';
                btn.style.color = '#fff';
                btn.style.borderColor = '#4CAF50';
                btn.style.boxShadow = '0 2px 6px rgba(76, 175, 80, 0.3)';
            });

            content.appendChild(btn);
        });

        panel.appendChild(content);

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const collapsed = content.style.display === 'none';
            content.style.display = collapsed ? 'grid' : 'none';
            toggleBtn.innerHTML = collapsed ? '▲' : '▼';
            localStorage.setItem('scu_panel_collapsed', !collapsed);
        });

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                    isDragging = true;
                }

                if (isDragging) {
                    let newLeft = initialLeft + dx;
                    let newTop = initialTop + dy;

                    const maxLeft = window.innerWidth - panel.offsetWidth;
                    const maxTop = window.innerHeight - panel.offsetHeight;

                    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                    newTop = Math.max(0, Math.min(newTop, maxTop));

                    panel.style.left = newLeft + 'px';
                    panel.style.top = newTop + 'px';
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.style.userSelect = '';

                if (isDragging) {
                    localStorage.setItem('scu_panel_pos', JSON.stringify({
                        left: parseInt(panel.style.left),
                        top: parseInt(panel.style.top)
                    }));
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const appendUI = () => {
            if (document.body) {
                document.body.appendChild(panel);
            } else {
                setTimeout(appendUI, 500);
            }
        };
        appendUI();
    }

    // =========================================================
    // 4. 自动播放视频 + 【基于目录顺序自动下一课】
    // =========================================================
    let isClickingNext = false; // 防止重复点击

    function tryAutoPlay() {
        const video = document.querySelector('video');
        if (video) {
            if (video.paused && video.readyState >= 2) {
                video.muted = true; // 必须静音才能绕过自动播放限制
                video.play().catch(() => {});
            }
            if (video.playbackRate !== targetPlaybackRate) {
                video.playbackRate = targetPlaybackRate;
            }
        }
    }

    function tryClickNextByTreeOrder() {
        // 1. 找到当前正在播放的小节 (有 is-current 的父节点)
        const currentNode = document.querySelector('.el-tree-node.is-current');
        if (!currentNode) return; // 如果没找到当前节点，说明还没加载好

        // 2. 找到当前节点的所有同级兄弟节点（整个目录列表）
        // 注意：这里需要找到包含所有小节的父容器，通常是 <div role="group"> 或它的上层
        // 根据您的HTML，所有章节都在最外层，直接找所有 .section_item 更稳妥
        const allSections = Array.from(document.querySelectorAll('a.section_item'));
        if (allSections.length === 0) return;

        // 3. 找到当前节点在列表中的索引
        const currentIndex = allSections.indexOf(currentNode.querySelector('a.section_item'));
        if (currentIndex === -1 || currentIndex === allSections.length - 1) {
            // 如果找不到或已经是最后一个，不进行操作
            return;
        }

        // 4. 检查视频是否已经播完（当前时间接近总时长）
        const video = document.querySelector('video');
        if (!video || !video.duration) return;
        const timeLeft = video.duration - video.currentTime;

        // 当视频距离结束还剩不到 2 秒时，开始点击下一个
        if (timeLeft <= 2 && !isClickingNext) {
            const nextSection = allSections[currentIndex + 1];
            if (nextSection) {
                console.log('[大川学堂助手] 检测到视频即将结束，自动点击目录中的下一个视频');
                isClickingNext = true;
                nextSection.click(); // 直接点击下一个目录项

                // 5. 等待新视频加载，然后重置点击锁
                setTimeout(() => {
                    isClickingNext = false;
                }, 5000); // 5秒后解锁，防止卡死
            }
        }
    }

    // =========================================================
    // 5. 页面监控 + SPA 路由监听 (保持不变)
    // =========================================================
    function startObserver() {
        tryAutoPlay();
        tryClickNextByTreeOrder(); // 初次检查，但通常不会触发，因为视频刚加载

        const observer = new MutationObserver(() => {
            tryAutoPlay();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        setInterval(() => {
            tryAutoPlay();
            tryClickNextByTreeOrder(); // 定时检查视频是否即将结束
            applyPlaybackRate();
        }, 1000); // 每秒检查一次

        buildSpeedUI();
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('[大川学堂助手] 检测到页面路由变化，重新激活监控');
            setTimeout(() => {
                tryAutoPlay();
                isClickingNext = false; // 路由变化时，重置点击锁
                tryClickNextByTreeOrder();
                applyPlaybackRate();
            }, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

    if (document.documentElement) {
        startObserver();
    } else {
        const waitForDocument = new MutationObserver(() => {
            if (document.documentElement) {
                waitForDocument.disconnect();
                startObserver();
            }
        });
        waitForDocument.observe(document, { childList: true });
    }

})();