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
    const [dragPreview, setDragPreview] = useState<{ x: number, y: number } | null>(null);
    const gridRef = React.useRef<HTMLDivElement>(null);

    // Grid Configuration
    const GRID_SIZE = 20; // 20x20 grid
    const CELL_SIZE = 30; // px (visual only)

    const handleGridClick = (x: number, y: number) => {
        if (!editMode || !selectedKolamId || draggingId) return; // Ignore click if dragging

        const k = kolam.find(item => item.id === selectedKolamId);
        if (!k) return;

        updateKolam(selectedKolamId, {
            position: {
                x,
                y,
                w: k.position?.w || 2,
                h: k.position?.h || 2,
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
    const handleMouseDown = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
        if (!editMode) return;
        e.preventDefault(); // Prevent text selection/native drag
        e.stopPropagation();

        setDraggingId(id);
        setSelectedKolamId(id);
        setDragPreview({ x: currentX, y: currentY });
    };

    // Global Mouse Move/Up for smooth dragging
    React.useEffect(() => {
        if (!draggingId || !editMode) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!gridRef.current) return;
            const rect = gridRef.current.getBoundingClientRect();

            // Calculate grid position relative to container
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            // Snap to nearest cell
            let gridX = Math.floor(relativeX / CELL_SIZE);
            let gridY = Math.floor(relativeY / CELL_SIZE);

            // Immediate update (Preview) 
            const k = kolam.find(item => item.id === draggingId);
            if (k && k.position) {
                // Determine max allowable X and Y based on pond size
                const maxX = GRID_SIZE - (k.position.w || 2);
                const maxY = GRID_SIZE - (k.position.h || 2);

                console.log('Drag Boundary:', {
                    id: k.id,
                    currentX: gridX,
                    maxX,
                    w: k.position.w
                });

                // Boundaries
                gridX = Math.max(0, Math.min(gridX, maxX));
                gridY = Math.max(0, Math.min(gridY, maxY));

                // Only update if changed to avoid unnecessary re-renders
                if (k.position.x !== gridX || k.position.y !== gridY) {
                    // Update PREVIEW only (smooth, local)
                    setDragPreview({ x: gridX, y: gridY });
                }
            }
        };

        const handleMouseUp = () => {
            if (draggingId && dragPreview) {
                const k = kolam.find(item => item.id === draggingId);
                if (k && k.position) {
                    // Determine max allowable X and Y based on pond size
                    const maxX = GRID_SIZE - (k.position.w || 2);
                    const maxY = GRID_SIZE - (k.position.h || 2);

                    // Re-clamp for safety on drop
                    const finalX = Math.max(0, Math.min(dragPreview.x, maxX));
                    const finalY = Math.max(0, Math.min(dragPreview.y, maxY));

                    // Commit the change
                    if (k.position.x !== finalX || k.position.y !== finalY) {
                        updateKolam(draggingId, {
                            position: { ...k.position, x: finalX, y: finalY }
                        });
                    }
                }
            }
            // Reset
            setDraggingId(null);
            setDragPreview(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, editMode, dragPreview, kolam, updateKolam]);

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
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${editMode ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
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
                            // Use preview position if dragging, otherwise actual position
                            const pos = (isDragging && dragPreview)
                                ? { ...k.position!, x: dragPreview.x, y: dragPreview.y }
                                : k.position!;

                            const isSelected = selectedKolamId === k.id;

                            return (
                                <div
                                    key={k.id}
                                    onMouseDown={(e) => handleMouseDown(e, k.id, pos.x, pos.y)}
                                    onClick={(e) => { e.stopPropagation(); editMode && setSelectedKolamId(k.id); }}
                                    className={`absolute transition-all ${isDragging ? 'duration-0 z-50 opacity-90 scale-105 shadow-xl ring-2 ring-blue-400' : 'duration-300 z-10'} rounded-md shadow-sm border flex flex-col items-center justify-center p-1 cursor-grab active:cursor-grabbing overflow-hidden ${pos.color || getStatusColor(k.status)
                                        } ${isSelected && editMode && !isDragging ? 'ring-4 ring-blue-400 z-20 scale-105' : 'border-white/20'}`}
                                    style={{
                                        left: pos.x * CELL_SIZE,
                                        top: pos.y * CELL_SIZE,
                                        width: pos.w * CELL_SIZE,
                                        height: pos.h * CELL_SIZE,
                                        // Disable pointer events on the element WHILE dragging so the grid accepts the mouse events? 
                                        // Actually no, we attached window listener so it doesn't matter.
                                        // But removing transition duration (duration-0) is CRITICAL for 1:1 movement.
                                    }}
                                >
                                    <span className="font-bold text-white text-xs text-center leading-tight drop-shadow-md select-none pointer-events-none">{k.nama}</span>
                                    {pos.h > 1 && pos.w > 1 && (
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
