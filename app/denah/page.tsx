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
    const [optimisticMoves, setOptimisticMoves] = useState<Record<string, { x: number, y: number }>>({});
    const gridRef = React.useRef<HTMLDivElement>(null);

    // Sync optimistic moves with real data
    React.useEffect(() => {
        setOptimisticMoves(prev => {
            const next = { ...prev };
            let changed = false;
            kolam.forEach(k => {
                const opt = next[k.id];
                if (opt && k.position && k.position.x === opt.x && k.position.y === opt.y) {
                    delete next[k.id];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [kolam]);

    // Grid Configuration
    const GRID_SIZE = 20; // 20x20 grid
    const CELL_SIZE = 30; // px (visual only)

    const handleGridClick = (x: number, y: number) => {
        if (!editMode || !selectedKolamId || draggingId) return; // Ignore click if dragging

        const k = kolam.find(item => item.id === selectedKolamId);
        if (!k) return;

        // Calculate max boundaries
        const w = k.position?.w || 2;
        const h = k.position?.h || 2;
        const maxX = GRID_SIZE - w;
        const maxY = GRID_SIZE - h;

        // Clamp coordinates
        const finalX = Math.max(0, Math.min(x, maxX));
        const finalY = Math.max(0, Math.min(y, maxY));

        setOptimisticMoves(prev => ({ ...prev, [selectedKolamId]: { x: finalX, y: finalY } }));
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
        if (!k) return;
        updateKolam(id, { position: { ...k.position!, w, h } });
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
            // Start from CURRENT visual position (which might be optimistic)
            const k = kolam.find(item => item.id === id);
            const currentPos = optimisticMoves[id] || k?.position || { x: 0, y: 0 };

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
                    let gridX = Math.round(dragPixelPos.x / CELL_SIZE);
                    let gridY = Math.round(dragPixelPos.y / CELL_SIZE);

                    const maxX = GRID_SIZE - (k.position.w || 2);
                    const maxY = GRID_SIZE - (k.position.h || 2);

                    // Clamp to grid
                    gridX = Math.max(0, Math.min(gridX, maxX));
                    gridY = Math.max(0, Math.min(gridY, maxY));

                    // Optimistic update
                    setOptimisticMoves(prev => ({ ...prev, [draggingId]: { x: gridX, y: gridY } }));

                    // Commit change
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Denah Lokasi Tambak</h1>
                    <p className="text-slate-500 mt-1">Visualisasi posisi dan status kolam</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {editMode ? '✅ Selesai Edit' : '✏️ Edit Posisi'}
                    </button>
                    <div className="flex gap-2 items-center bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Aman
                        <div className="w-3 h-3 rounded-full bg-amber-500 ml-2"></div> Waspada
                        <div className="w-3 h-3 rounded-full bg-red-500 ml-2"></div> Berisiko
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Grid Canvas */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-auto shadow-inner">
                    <div
                        ref={gridRef}
                        className="relative bg-white shadow-sm border border-slate-100 mx-auto"
                        style={{
                            width: GRID_SIZE * CELL_SIZE,
                            height: GRID_SIZE * CELL_SIZE,
                            backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
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
                                        left: x * CELL_SIZE,
                                        top: y * CELL_SIZE,
                                        width: CELL_SIZE,
                                        height: CELL_SIZE,
                                    }}
                                    title={`Posisi ${x},${y}`}
                                />
                            );
                        })}

                        {/* Ponds Layer */}
                        {positionedKolam.map(k => {
                            const isDragging = draggingId === k.id;
                            const isSelected = selectedKolamId === k.id;

                            // Determine effective position: Dragging > Optimistic > Real
                            const optPos = optimisticMoves[k.id];
                            const effectiveX = isDragging && dragPixelPos ? dragPixelPos.x
                                : (optPos ? optPos.x * CELL_SIZE : k.position!.x * CELL_SIZE);

                            const effectiveY = isDragging && dragPixelPos ? dragPixelPos.y
                                : (optPos ? optPos.y * CELL_SIZE : k.position!.y * CELL_SIZE);

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
                                        width: (k.position?.w || 2) * CELL_SIZE,
                                        height: (k.position?.h || 2) * CELL_SIZE,
                                        backgroundColor: k.position?.color || undefined,
                                        transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth snap on drop
                                        zIndex: isDragging ? 50 : (isSelected ? 20 : 10)
                                    }}
                                >
                                    <span className="font-bold text-white text-xs text-center leading-tight drop-shadow-md select-none pointer-events-none">{k.nama}</span>
                                    {(k.position?.h || 2) > 1 && (k.position?.w || 2) > 1 && (
                                        <span className="text-[10px] text-white/90 select-none pointer-events-none">{k.jumlahIkan} 🐟</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Controls (Edit Mode) */}
                {editMode && (
                    <div className="w-full lg:w-80 space-y-4">

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
                                                    onClick={() => handleResize(selectedKolamId, Math.max(1, (kolam.find(k => k.id === selectedKolamId)?.position?.w || 2) - 1), kolam.find(k => k.id === selectedKolamId)?.position?.h || 2)}
                                                    className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                >-</button>
                                                <span className="font-mono">{kolam.find(k => k.id === selectedKolamId)?.position?.w || 2}</span>
                                                <button
                                                    onClick={() => handleResize(selectedKolamId, (kolam.find(k => k.id === selectedKolamId)?.position?.w || 2) + 1, kolam.find(k => k.id === selectedKolamId)?.position?.h || 2)}
                                                    className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                >+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Tinggi (Grid)</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => handleResize(selectedKolamId, kolam.find(k => k.id === selectedKolamId)?.position?.w || 2, Math.max(1, (kolam.find(k => k.id === selectedKolamId)?.position?.h || 2) - 1))}
                                                    className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                                                >-</button>
                                                <span className="font-mono">{kolam.find(k => k.id === selectedKolamId)?.position?.h || 2}</span>
                                                <button
                                                    onClick={() => handleResize(selectedKolamId, kolam.find(k => k.id === selectedKolamId)?.position?.w || 2, (kolam.find(k => k.id === selectedKolamId)?.position?.h || 2) + 1)}
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
        </DashboardLayout>
    );
}
