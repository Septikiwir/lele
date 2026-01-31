'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import React, { useState } from 'react';
import { useApp, Kolam } from '../context/AppContext';

export default function DenahPage() {
    const { kolam, updateKolam } = useApp();
    const [editMode, setEditMode] = useState(false);
    const [selectedKolamId, setSelectedKolamId] = useState<string | null>(null);
    // Dragging State
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
    const [dragPixelPos, setDragPixelPos] = useState<{ x: number, y: number } | null>(null);
    const [cellSize, setCellSize] = useState(30);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const gridRef = React.useRef<HTMLDivElement>(null);

    // Grid Configuration
    const GRID_SIZE = 20; // 20x20 grid

    // Responsive Grid Logic
    React.useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    const isMobile = window.innerWidth < 768;
                    const padding = isMobile ? 32 : 64;
                    const sidebarSpace = (!isMobile && editMode) ? 320 : 0; // Account for sidebar if it pushed layout previously

                    const availableW = width - padding;
                    const availableH = height - padding;

                    const newSize = Math.floor(Math.min(availableW / GRID_SIZE, availableH / GRID_SIZE));
                    setCellSize(Math.max(10, newSize));
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [editMode]);

    const handleGridClick = (x: number, y: number) => {
        if (!editMode || !selectedKolamId || draggingId) return; // Ignore click if dragging

        const k = kolam.find(item => item.id === selectedKolamId);
        if (!k) return;

        // Calculate max boundaries (default to lebar = w, panjang = h)
        const w = k.position?.w || k.lebar || 2;
        const h = k.position?.h || k.panjang || 2;
        const maxX = GRID_SIZE - w;
        const maxY = GRID_SIZE - h;

        // Clamp coordinates
        const finalX = Math.max(0, Math.min(x, maxX));
        const finalY = Math.max(0, Math.min(y, maxY));

        updateKolam(selectedKolamId, {
            position: {
                x: finalX,
                y: finalY,
                w,
                h,
                color: k.position?.color
            }
        });
    };

    const handleResize = (id: string, w: number, h: number) => {
        const k = kolam.find(item => item.id === id);
        if (!k || !k.position) return;

        // Constraint: Must not exceed grid boundaries
        const maxW = GRID_SIZE - k.position.x;
        const maxH = GRID_SIZE - k.position.y;

        const finalW = Math.max(1, Math.min(w, maxW));
        const finalH = Math.max(1, Math.min(h, maxH));

        updateKolam(id, { position: { ...k.position, w: finalW, h: finalH } });
    };

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        setDraggingId(id);
        setSelectedKolamId(id);
        setDragOffset({ x: offsetX, y: offsetY });

        // Initial pixel pos relative to grid
        if (gridRef.current) {
            const gridRect = gridRef.current.getBoundingClientRect();
            const k = kolam.find(item => item.id === id);
            const currentPos = k?.position || { x: 0, y: 0 };

            setDragPixelPos({
                x: e.clientX - gridRect.left - offsetX,
                y: e.clientY - gridRect.top - offsetY
            });
        }
    };

    // Global Mouse Move/Up for smooth dragging
    React.useEffect(() => {
        if (!draggingId || !editMode || !dragOffset) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!gridRef.current) return;
            const gridRect = gridRef.current.getBoundingClientRect();

            // Calculate raw pixel position within grid
            let rawX = e.clientX - gridRect.left - dragOffset.x;
            let rawY = e.clientY - gridRect.top - dragOffset.y;

            // Optional: Clamp to grid boundaries (in pixels)
            // But let's allow slight over-drag for smoother feel, and clamp on drop

            // Just update visual position instantly
            setDragPixelPos({ x: rawX, y: rawY });
        };

        const handleMouseUp = () => {
            if (draggingId && dragPixelPos) {
                const k = kolam.find(item => item.id === draggingId);
                if (k && k.position) {
                    // Calculate snap grid position
                    let gridX = Math.round(dragPixelPos.x / cellSize);
                    let gridY = Math.round(dragPixelPos.y / cellSize);

                    const maxX = GRID_SIZE - (k.position.w || 2);
                    const maxY = GRID_SIZE - (k.position.h || 2);

                    // Clamp to grid
                    gridX = Math.max(0, Math.min(gridX, maxX));
                    gridY = Math.max(0, Math.min(gridY, maxY));

                    // Commit change (now optimistic via context)
                    updateKolam(draggingId, {
                        position: { ...k.position, x: gridX, y: gridY }
                    });
                }
            }
            // Reset
            setDraggingId(null);
            setDragOffset(null);
            setDragPixelPos(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, editMode, dragOffset, dragPixelPos, kolam, updateKolam]);

    // Helper to get status color
    const getStatusColor = (status: Kolam['status']) => {
        switch (status) {
            case 'aman': return 'bg-emerald-500 hover:bg-emerald-600';
            case 'waspada': return 'bg-amber-500 hover:bg-amber-600';
            case 'berisiko': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-slate-400';
        }
    };

    // Split kolam into positioned and unpositioned
    const positionedKolam = kolam.filter(k => k.position);
    const unpositionedKolam = kolam.filter(k => !k.position);

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 sm:gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Denah Lokasi Tambak</h1>
                        <p className="text-slate-500 text-sm">Visualisasi posisi dan status kolam secara real-time.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex gap-2 items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 border-r border-slate-100 pr-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> <span className="text-slate-600">Aman</span>
                            </div>
                            <div className="flex items-center gap-1.5 border-r border-slate-100 px-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> <span className="text-slate-600">Waspada</span>
                            </div>
                            <div className="flex items-center gap-1.5 pl-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> <span className="text-slate-600">Berisiko</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`btn text-sm px-4 py-2 ${editMode ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {editMode ? '✅ Selesai Edit' : '✏️ Edit Posisi'}
                        </button>
                    </div>
                </div>

                <div className="relative md:h-[calc(100vh-180px)] min-h-0 flex flex-col">
                    {/* Main Grid Canvas - Perfectly Centered on Desktop, Fitted on Mobile */}
                    <div
                        ref={containerRef}
                        className="w-full h-auto aspect-square md:h-full md:aspect-auto bg-white border border-slate-200 rounded-2xl p-2 sm:p-4 shadow-sm overflow-hidden flex items-center justify-center relative min-w-0 min-h-0"
                    >
                        <div
                            ref={gridRef}
                            className="bg-white shadow-sm border border-slate-100 transition-all duration-300 absolute"
                            style={{
                                width: GRID_SIZE * cellSize,
                                height: GRID_SIZE * cellSize,
                                backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                                backgroundSize: `${cellSize}px ${cellSize}px`
                            }}
                        >
                            {/* Grid Cells Interaction Layer (only in edit mode) */}
                            {editMode && Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                                const x = i % GRID_SIZE;
                                const y = Math.floor(i / GRID_SIZE);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleGridClick(x, y)}
                                        className="absolute hover:bg-blue-500/20 cursor-pointer transition-colors"
                                        style={{
                                            left: x * cellSize,
                                            top: y * cellSize,
                                            width: cellSize,
                                            height: cellSize,
                                        }}
                                        title={`Posisi ${x},${y}`}
                                    />
                                );
                            })}

                            {/* Ponds Layer */}
                            {positionedKolam.map(k => {
                                const isDragging = draggingId === k.id;
                                const isSelected = selectedKolamId === k.id;

                                // Determine effective position: Dragging > Real (Context)
                                const effectiveX = isDragging && dragPixelPos ? dragPixelPos.x
                                    : k.position!.x * cellSize;

                                const effectiveY = isDragging && dragPixelPos ? dragPixelPos.y
                                    : k.position!.y * cellSize;

                                return (
                                    <div
                                        key={k.id}
                                        onMouseDown={(e) => handleMouseDown(e, k.id)}
                                        onClick={(e) => { e.stopPropagation(); editMode && setSelectedKolamId(k.id); }}
                                        className={`absolute rounded-md shadow-sm border flex flex-col items-center justify-center p-1 cursor-grab active:cursor-grabbing overflow-hidden ${!k.position?.color ? getStatusColor(k.status) : ''
                                            } ${isDragging ? 'z-50 opacity-90 shadow-xl ring-2 ring-blue-400 scale-105' : 'z-10'
                                            } ${isSelected && editMode && !isDragging ? 'ring-4 ring-blue-400 z-20' : 'border-white/20'}`}
                                        style={{
                                            left: effectiveX, // Use effective X
                                            top: effectiveY,  // Use effective Y
                                            width: (k.position?.w || k.lebar || 2) * cellSize,
                                            height: (k.position?.h || k.panjang || 2) * cellSize,
                                            backgroundColor: k.position?.color || undefined,
                                            transition: isDragging ? 'none' : 'width 0.1s ease-out, height 0.1s ease-out, left 0.1s ease-out, top 0.1s ease-out, background-color 0.2s ease', // Snappy snappy
                                            zIndex: isDragging ? 50 : (isSelected ? 20 : 10)
                                        }}
                                    >
                                        <span
                                            className="font-bold text-white text-center leading-tight drop-shadow-md select-none pointer-events-none"
                                            style={{ fontSize: Math.max(7, cellSize * 0.35) }}
                                        >
                                            {k.nama}
                                        </span>
                                        {(k.position?.h || k.panjang || 2) > 1 && (k.position?.w || k.lebar || 2) > 1 && (
                                            <span
                                                className="text-white/90 select-none pointer-events-none mt-0.5"
                                                style={{ fontSize: Math.max(6, cellSize * 0.25) }}
                                            >
                                                {k.jumlahIkan} 🐟
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar Controls (Edit Mode) - Floating on Desktop to maintain centering */}
                    {editMode && (
                        <div className="w-full mt-4 md:mt-0 md:absolute md:right-4 md:top-4 md:bottom-4 md:w-64 lg:w-80 space-y-4 h-auto md:h-auto max-h-[40vh] md:max-h-none overflow-y-auto pr-1 flex-none custom-scrollbar z-30 md:bg-white/90 md:backdrop-blur-sm md:p-4 md:rounded-xl md:border md:border-slate-200 md:shadow-lg">

                            {/* Unpositioned Ponds List */}
                            {unpositionedKolam.length > 0 && (
                                <div className="card p-4 border-l-4 border-slate-400">
                                    <h3 className="font-bold text-slate-900 mb-2">Belum Diletakkan</h3>
                                    <p className="text-xs text-slate-500 mb-3">Klik kolam lalu klik grid untuk meletakkan.</p>
                                    <div className="space-y-2">
                                        {unpositionedKolam.map(k => (
                                            <div
                                                key={k.id}
                                                onClick={() => setSelectedKolamId(k.id)}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${selectedKolamId === k.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(k.status)}`}></div>
                                                    <span className="font-medium text-slate-700">{k.nama}</span>
                                                </div>
                                                <span className="text-xs text-slate-400">Klik untuk pilih</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="card p-4">
                                <h3 className="font-bold text-slate-900 mb-2">Instruksi Edit</h3>
                                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                    <li>Klik kolam untuk memilihnya.</li>
                                    <li>Klik area kosong pada grid untuk memindahkan/meletakkan.</li>
                                    <li>Gunakan kontrol di bawah untuk mengubah ukuran.</li>
                                </ul>
                            </div>

                            {selectedKolamId && positionedKolam.some(k => k.id === selectedKolamId) ? (
                                <div className="card p-4 border-l-4 border-l-blue-500">
                                    <h3 className="font-bold text-slate-900 mb-4">Edit: {kolam.find(k => k.id === selectedKolamId)?.nama}</h3>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase">Lebar (Grid)</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleResize(selectedKolamId, Math.max(1, (kolam.find(k => k.id === selectedKolamId)?.position?.w || kolam.find(k => k.id === selectedKolamId)?.lebar || 2) - 1), kolam.find(k => k.id === selectedKolamId)?.position?.h || kolam.find(k => k.id === selectedKolamId)?.panjang || 2)}
                                                        className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                    >-</button>
                                                    <span className="font-mono">{kolam.find(k => k.id === selectedKolamId)?.position?.w || kolam.find(k => k.id === selectedKolamId)?.lebar || 2}</span>
                                                    <button
                                                        onClick={() => handleResize(selectedKolamId, (kolam.find(k => k.id === selectedKolamId)?.position?.w || kolam.find(k => k.id === selectedKolamId)?.lebar || 2) + 1, kolam.find(k => k.id === selectedKolamId)?.position?.h || kolam.find(k => k.id === selectedKolamId)?.panjang || 2)}
                                                        className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                    >+</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase">Tinggi (Grid)</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleResize(selectedKolamId, kolam.find(k => k.id === selectedKolamId)?.position?.w || kolam.find(k => k.id === selectedKolamId)?.lebar || 2, Math.max(1, (kolam.find(k => k.id === selectedKolamId)?.position?.h || kolam.find(k => k.id === selectedKolamId)?.panjang || 2) - 1))}
                                                        className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                    >-</button>
                                                    <span className="font-mono">{kolam.find(k => k.id === selectedKolamId)?.position?.h || kolam.find(k => k.id === selectedKolamId)?.panjang || 2}</span>
                                                    <button
                                                        onClick={() => handleResize(selectedKolamId, kolam.find(k => k.id === selectedKolamId)?.position?.w || kolam.find(k => k.id === selectedKolamId)?.lebar || 2, (kolam.find(k => k.id === selectedKolamId)?.position?.h || kolam.find(k => k.id === selectedKolamId)?.panjang || 2) + 1)}
                                                        className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                    >+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedKolamId && unpositionedKolam.some(k => k.id === selectedKolamId) ? (
                                <div className="card p-4 bg-blue-50 border border-blue-200 text-center">
                                    <p className="font-semibold text-blue-800">Kolam Terpilih: {kolam.find(k => k.id === selectedKolamId)?.nama}</p>
                                    <p className="text-sm text-blue-600 mt-1">👇 Klik pada grid di kiri untuk meletakkan.</p>
                                </div>
                            ) : (
                                <div className="card p-6 text-center text-slate-500 border-dashed">
                                    <p>Pilih kolam untuk mengubah ukuran</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
