'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import {
    PlusIcon, EditIcon, TrashIcon, EyeIcon, WarningIcon,
    ClockIcon, CheckIcon, ArrowRightIcon, KolamIcon, FishIcon,
    FCRIcon, CalendarIcon, DownloadIcon, WalletIcon, TrendingUpIcon, SearchIcon
} from '../components/ui/Icons';

type ModalType = 'small' | 'medium' | 'large' | 'confirmation' | 'form' | 'info' | 'danger' | null;

export default function DesignSystemPage() {
    const [activeTab, setActiveTab] = useState('colors');
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const tabs = [
        { id: 'colors', label: 'Warna' },
        { id: 'typography', label: 'Tipografi' },
        { id: 'buttons', label: 'Tombol' },
        { id: 'inputs', label: 'Input' },
        { id: 'cards', label: 'Kartu' },
        { id: 'badges', label: 'Badge' },
        { id: 'icons', label: 'Ikon' },
        { id: 'extended', label: 'Extended' },
        { id: 'components', label: 'Komponen' },
    ];

    // Toggle states for demo
    const [toggleStates, setToggleStates] = useState({
        toggle1: false,
        toggle2: true,
        toggle3: false,
    });

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">UI Design System</h1>
                <p className="text-slate-500 mt-1">Panduan komponen dan gaya visual untuk Lele SaaS</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Colors Section */}
            {activeTab === 'colors' && (
                <div className="space-y-8">
                    {/* Primary Colors */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Primary Colors (Teal)</h2>
                        <p className="text-slate-500 text-sm mb-6">Warna utama aplikasi untuk aksi, link, dan elemen interaktif.</p>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
                                <div key={shade} className="text-center">
                                    <div
                                        className={`h-16 rounded-lg mb-2 border border-slate-200`}
                                        style={{ backgroundColor: `var(--primary-${shade})` }}
                                    />
                                    <span className="text-xs text-slate-500">{shade}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <code className="text-xs text-slate-600">
                                CSS: var(--primary-500) | Tailwind: primary-500, text-teal-500
                            </code>
                        </div>
                    </section>

                    {/* Status Colors */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Status Colors</h2>
                        <p className="text-slate-500 text-sm mb-6">Warna untuk menunjukkan status dan kondisi.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Success */}
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    Success (Green)
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-green-50 border border-green-200"></div>
                                        <span className="text-xs text-slate-500">50 - Background</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-green-100 border border-green-200"></div>
                                        <span className="text-xs text-slate-500">100 - Light</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-green-500"></div>
                                        <span className="text-xs text-slate-500">500 - Default</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-green-700"></div>
                                        <span className="text-xs text-slate-500">700 - Text</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">Gunakan: Aman, Berhasil, Profit</p>
                            </div>

                            {/* Warning */}
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    Warning (Amber)
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-amber-50 border border-amber-200"></div>
                                        <span className="text-xs text-slate-500">50 - Background</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-amber-100 border border-amber-200"></div>
                                        <span className="text-xs text-slate-500">100 - Light</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-amber-500"></div>
                                        <span className="text-xs text-slate-500">500 - Default</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-amber-700"></div>
                                        <span className="text-xs text-slate-500">700 - Text</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">Gunakan: Waspada, Perhatian, Pending</p>
                            </div>

                            {/* Danger */}
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    Danger (Red)
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-red-50 border border-red-200"></div>
                                        <span className="text-xs text-slate-500">50 - Background</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-red-100 border border-red-200"></div>
                                        <span className="text-xs text-slate-500">100 - Light</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-red-500"></div>
                                        <span className="text-xs text-slate-500">500 - Default</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 rounded bg-red-700"></div>
                                        <span className="text-xs text-slate-500">700 - Text</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">Gunakan: Berisiko, Error, Hapus, Loss</p>
                            </div>
                        </div>
                    </section>

                    {/* Neutral Colors */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Neutral Colors (Slate)</h2>
                        <p className="text-slate-500 text-sm mb-6">Warna netral untuk teks, border, dan background.</p>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
                                <div key={shade} className="text-center">
                                    <div
                                        className={`h-16 rounded-lg mb-2 border border-slate-200`}
                                        style={{ backgroundColor: `var(--slate-${shade})` }}
                                    />
                                    <span className="text-xs text-slate-500">{shade}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <strong className="text-slate-700">50-100:</strong>
                                <span className="text-slate-500 ml-2">Background, Section</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <strong className="text-slate-700">200-400:</strong>
                                <span className="text-slate-500 ml-2">Border, Divider</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <strong className="text-slate-700">500-900:</strong>
                                <span className="text-slate-500 ml-2">Teks (500=muted, 900=heading)</span>
                            </div>
                        </div>
                    </section>

                    {/* Accent Colors */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Accent Colors</h2>
                        <p className="text-slate-500 text-sm mb-6">Warna aksen untuk highlight dan diferensiasi.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-cyan-50 border border-cyan-200">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500 mb-2"></div>
                                <p className="font-semibold text-cyan-700">Cyan</p>
                                <p className="text-xs text-cyan-600">Populasi Ikan, Info</p>
                            </div>
                            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500 mb-2"></div>
                                <p className="font-semibold text-indigo-700">Indigo</p>
                                <p className="text-xs text-indigo-600">Estimasi, Terkalibrasi</p>
                            </div>
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500 mb-2"></div>
                                <p className="font-semibold text-emerald-700">Emerald</p>
                                <p className="text-xs text-emerald-600">Profit, Revenue, Panen</p>
                            </div>
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="w-10 h-10 rounded-lg bg-blue-500 mb-2"></div>
                                <p className="font-semibold text-blue-700">Blue</p>
                                <p className="text-xs text-blue-600">Tebar, Info Panel</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Typography Section */}
            {activeTab === 'typography' && (
                <div className="space-y-8">
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Heading Styles</h2>
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h1 className="text-3xl font-bold text-slate-900">Heading 1 - Page Title</h1>
                                <code className="text-xs text-slate-400 mt-1 block">text-3xl font-bold text-slate-900</code>
                            </div>
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-2xl font-bold text-slate-900">Heading 2 - Section Title</h2>
                                <code className="text-xs text-slate-400 mt-1 block">text-2xl font-bold text-slate-900</code>
                            </div>
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-slate-800">Heading 3 - Subsection</h3>
                                <code className="text-xs text-slate-400 mt-1 block">text-xl font-bold text-slate-800</code>
                            </div>
                            <div className="border-b border-slate-100 pb-4">
                                <h4 className="text-lg font-semibold text-slate-800">Heading 4 - Card Title</h4>
                                <code className="text-xs text-slate-400 mt-1 block">text-lg font-semibold text-slate-800</code>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Section Label</p>
                                <code className="text-xs text-slate-400 mt-1 block">text-sm font-medium text-slate-500 uppercase tracking-wider</code>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Body Text</h2>
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <p className="text-base text-slate-700">Body Default - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                                <code className="text-xs text-slate-400 mt-1 block">text-base text-slate-700</code>
                            </div>
                            <div className="border-b border-slate-100 pb-4">
                                <p className="text-sm text-slate-600">Body Small - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                                <code className="text-xs text-slate-400 mt-1 block">text-sm text-slate-600</code>
                            </div>
                            <div className="border-b border-slate-100 pb-4">
                                <p className="text-sm text-slate-500">Body Muted - Digunakan untuk deskripsi dan keterangan.</p>
                                <code className="text-xs text-slate-400 mt-1 block">text-sm text-slate-500</code>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Caption/Helper - Informasi tambahan atau hint.</p>
                                <code className="text-xs text-slate-400 mt-1 block">text-xs text-slate-400</code>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Numbers & Values</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-900">1,234,567</p>
                                <p className="text-xs text-slate-400 mt-1">Large Value (KPI)</p>
                                <code className="text-[10px] text-slate-400 mt-2 block">text-2xl font-bold</code>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xl font-bold text-emerald-600">Rp 25.000.000</p>
                                <p className="text-xs text-slate-400 mt-1">Currency (Positive)</p>
                                <code className="text-[10px] text-slate-400 mt-2 block">text-xl font-bold text-emerald-600</code>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xl font-bold text-red-600">-Rp 5.000.000</p>
                                <p className="text-xs text-slate-400 mt-1">Currency (Negative)</p>
                                <code className="text-[10px] text-slate-400 mt-2 block">text-xl font-bold text-red-600</code>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Buttons Section */}
            {activeTab === 'buttons' && (
                <div className="space-y-8">
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Button Variants</h2>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn btn-primary">
                                <PlusIcon /> Primary
                            </button>
                            <button className="btn btn-secondary">
                                Secondary
                            </button>
                            <button className="btn btn-success">
                                🌾 Success
                            </button>
                            <button className="btn btn-danger">
                                <TrashIcon /> Danger
                            </button>
                            <button className="btn btn-ghost">
                                Ghost
                            </button>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-1">
                            <p><strong>btn-primary:</strong> Aksi utama (Tambah, Simpan)</p>
                            <p><strong>btn-secondary:</strong> Aksi sekunder (Batal, Filter)</p>
                            <p><strong>btn-success:</strong> Aksi positif (Panen, Konfirmasi)</p>
                            <p><strong>btn-danger:</strong> Aksi destruktif (Hapus)</p>
                            <p><strong>btn-ghost:</strong> Aksi ringan (Menu, Toggle)</p>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Button Sizes</h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <button className="btn btn-primary text-xs py-1 px-3">
                                Small
                            </button>
                            <button className="btn btn-primary">
                                Default
                            </button>
                            <button className="btn btn-primary text-base py-3 px-6">
                                Large
                            </button>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Button with Icon</h2>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn btn-primary">
                                <PlusIcon /> Tambah Kolam
                            </button>
                            <button className="btn btn-secondary">
                                <DownloadIcon /> Export
                            </button>
                            <button className="btn btn-ghost px-3">
                                <EditIcon />
                            </button>
                            <button className="btn btn-ghost px-3">
                                <TrashIcon />
                            </button>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Link Buttons</h2>
                        <div className="flex flex-wrap items-center gap-6">
                            <a className="text-teal-600 font-medium hover:underline flex items-center gap-1 text-sm">
                                Detail <ArrowRightIcon />
                            </a>
                            <a className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 text-xs uppercase tracking-wider">
                                LIHAT SEMUA <ArrowRightIcon className="w-3 h-3" />
                            </a>
                        </div>
                    </section>
                </div>
            )}

            {/* Inputs Section */}
            {activeTab === 'inputs' && (
                <div className="space-y-8">
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Text Input</h2>
                        <div className="max-w-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Label Default</label>
                                <input type="text" className="input" placeholder="Placeholder text..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">With Value</label>
                                <input type="text" className="input" defaultValue="Kolam A1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Error State</label>
                                <input type="text" className="input input-error" defaultValue="Invalid input" />
                                <p className="text-xs text-red-500 mt-1">Field ini wajib diisi</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Disabled</label>
                                <input type="text" className="input" disabled defaultValue="Tidak dapat diedit" />
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Select Input</h2>
                        <div className="max-w-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kolam</label>
                                <select className="input">
                                    <option value="">-- Pilih Kolam --</option>
                                    <option value="1">Kolam A1</option>
                                    <option value="2">Kolam A2</option>
                                    <option value="3">Kolam B1</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Date Input</h2>
                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                            <input type="date" className="input" defaultValue="2026-01-30" />
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Number Input with Unit</h2>
                        <div className="max-w-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Berat (Kg)</label>
                                <div className="relative">
                                    <input type="number" className="input pr-12" defaultValue="150" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Harga</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">Rp</span>
                                    <input type="text" className="input" style={{ paddingLeft: '42px' }} defaultValue="25.000" placeholder="0" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Form Group (Inline)</h2>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex flex-wrap gap-6 items-end">
                                <div className="w-32">
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Growth Rate (g/hari)</label>
                                    <input type="number" className="input w-full text-sm py-1 h-9" defaultValue="2" />
                                </div>
                                <div className="w-40">
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Est. Harga Jual (Rp/kg)</label>
                                    <input type="text" className="input w-full text-sm py-1 h-9" defaultValue="25.000" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Cards Section */}
            {activeTab === 'cards' && (
                <div className="space-y-8">
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Basic Card</h2>
                        <p className="text-sm text-slate-500 mb-6">Varian card dengan state berbeda untuk berbagai kebutuhan UI.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Default Card */}
                            <div className="card p-6 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer">
                                <h3 className="font-bold text-slate-900 mb-2">Card Title</h3>
                                <p className="text-sm text-slate-500">Deskripsi singkat tentang konten kartu ini.</p>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-400">Default state</p>
                                </div>
                            </div>
                            
                            {/* Selected/Active Card */}
                            <div 
                                className="p-6 rounded-xl border-2 cursor-pointer transition-all"
                                style={{
                                    borderColor: 'var(--primary-500)',
                                    backgroundColor: 'var(--primary-50)',
                                    boxShadow: '0 20px 25px -5px rgba(20, 184, 166, 0.1), 0 10px 10px -5px rgba(20, 184, 166, 0.04)'
                                }}
                            >
                                <h3 className="font-bold mb-2" style={{ color: 'var(--primary-700)' }}>Selected Card</h3>
                                <p className="text-sm" style={{ color: 'var(--primary-600)' }}>Kartu dalam keadaan terpilih/aktif.</p>
                                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--primary-300)' }}>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--primary-700)' }}>✓ Active state</p>
                                </div>
                            </div>
                            
                            {/* Empty State Card */}
                            <div className="card p-6 !border-dashed !border-slate-300 !bg-slate-50 cursor-pointer hover:!bg-slate-100 transition-all">
                                <h3 className="font-bold text-slate-700 mb-2">Empty State Card</h3>
                                <p className="text-sm text-slate-500">Kartu untuk kolam kosong/siap tebar.</p>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-xs text-slate-400">Empty/Ready state</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Stat Card (KPI)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="stat-card p-6 relative overflow-hidden group">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Populasi Ikan</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <p className="text-2xl font-bold text-slate-900">12,500</p>
                                            <span className="text-xs text-slate-400 font-normal">ekor</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-100 transition-colors">
                                        <FishIcon />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                    <span><strong>5</strong> Kolam Aktif</span>
                                    <a className="text-cyan-600 font-medium hover:underline flex items-center gap-1">
                                        Detail <ArrowRightIcon />
                                    </a>
                                </div>
                            </div>

                            <div className="stat-card p-6 relative overflow-hidden group">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pakan Hari Ini</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <p className="text-2xl font-bold text-slate-900">45.5</p>
                                            <span className="text-xs text-slate-400 font-normal">kg</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                                        <CalendarIcon />
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card p-6 relative overflow-hidden group">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estimasi Aset</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <p className="text-2xl font-bold text-slate-900">Rp 125.000.000</p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                        <span className="text-xl">💎</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Pond Card (Active Cycle)</h2>
                        <div className="max-w-sm">
                            <div className="card cursor-pointer transition-all border-2 border-transparent hover:border-slate-200 relative overflow-hidden">
                                <div className="p-5 border-b border-slate-50 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">
                                                🐟
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Kolam A1</h3>
                                                <p className="text-xs text-slate-500">5,000 ekor</p>
                                            </div>
                                        </div>
                                        <span className="badge badge-success">Aktif: 45 Hari</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Est. Panen</span>
                                        <span className="font-semibold text-slate-800">2026-02-15</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Sisa Waktu</span>
                                        <span className="font-bold text-amber-600">16 hari</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-slate-100">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Est. Total</p>
                                            <p className="font-semibold text-slate-700 text-sm">450 kg</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Populasi</p>
                                            <p className="font-semibold text-slate-700 text-sm">5,000</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Potensi Omzet</span>
                                        <span className="font-bold text-emerald-600">Rp 11.250.000</span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>90g</span>
                                            <span>Target 150g</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500" style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <button className="btn btn-success w-full text-sm py-2">
                                        🌾 Panen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Highlight Cards (Gradient)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card-highlight card-gradient-green">
                                <p className="label">Total Pendapatan</p>
                                <p className="value">Rp 125.000.000</p>
                                <p className="sub">Bulan ini</p>
                            </div>
                            <div className="card-highlight card-gradient-red">
                                <p className="label">Total Pengeluaran</p>
                                <p className="value">Rp 45.000.000</p>
                                <p className="sub">Bulan ini</p>
                            </div>
                            <div className="card-highlight card-gradient-teal">
                                <p className="label">Profit Bersih</p>
                                <p className="value">Rp 80.000.000</p>
                                <p className="sub">Margin: 64%</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Badges Section */}
            {activeTab === 'badges' && (
                <div className="space-y-8">
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Status Badges</h2>
                        <div className="flex flex-wrap gap-4">
                            <span className="badge badge-success">Aktif</span>
                            <span className="badge badge-warning">Waspada</span>
                            <span className="badge badge-danger">Berisiko</span>
                            <span className="badge badge-info">Info</span>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                            <code>className="badge badge-[success|warning|danger|info]"</code>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Extended Badge Variants</h2>
                        <p className="text-sm text-slate-500 mb-4">Warna tambahan untuk diferensiasi lebih lanjut.</p>
                        <div className="flex flex-wrap gap-4">
                            <span className="badge badge-neutral">Neutral</span>
                            <span className="badge badge-indigo">Indigo</span>
                            <span className="badge badge-cyan">Cyan</span>
                            <span className="badge badge-emerald">Emerald</span>
                            <span className="badge badge-purple">Purple</span>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                            <code>className="badge badge-[neutral|indigo|cyan|emerald|purple]"</code>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Badge Sizes</h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="badge badge-sm badge-success">Small</span>
                            <span className="badge badge-success">Default</span>
                            <span className="badge badge-lg badge-success">Large</span>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                            <code>className="badge badge-sm" atau "badge badge-lg"</code>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Inline Badges</h2>
                        <p className="text-sm text-slate-500 mb-4">Badge kecil untuk inline text, tanpa uppercase.</p>
                        <div className="flex flex-wrap gap-4">
                            <span className="badge badge-inline badge-success">Parsial</span>
                            <span className="badge badge-inline badge-danger">Total</span>
                            <span className="badge badge-inline badge-indigo">Terkalibrasi</span>
                            <span className="badge badge-inline badge-emerald">Siap Panen</span>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                            <code>className="badge badge-inline badge-[variant]"</code>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Count Badge</h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">3 ISU</span>
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">5</span>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Status with Days</h2>
                        <div className="flex flex-wrap gap-4">
                            <span className="badge badge-success">Aktif: 45 Hari</span>
                            <span className="font-bold text-amber-600">16 hari</span>
                            <span className="font-bold text-red-600">3 hari</span>
                        </div>
                    </section>
                </div>
            )}

            {/* Icons Section */}
            {activeTab === 'icons' && (
                <div className="space-y-8">
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Action Icons</h2>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <PlusIcon />
                                </div>
                                <span className="text-xs text-slate-500">Plus</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <EditIcon />
                                </div>
                                <span className="text-xs text-slate-500">Edit</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <TrashIcon />
                                </div>
                                <span className="text-xs text-slate-500">Trash</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <EyeIcon />
                                </div>
                                <span className="text-xs text-slate-500">Eye</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <SearchIcon />
                                </div>
                                <span className="text-xs text-slate-500">Search</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <DownloadIcon />
                                </div>
                                <span className="text-xs text-slate-500">Download</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <CheckIcon />
                                </div>
                                <span className="text-xs text-slate-500">Check</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <ArrowRightIcon />
                                </div>
                                <span className="text-xs text-slate-500">Arrow</span>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Feature Icons (Large)</h2>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <KolamIcon />
                                </div>
                                <span className="text-xs text-slate-500">Kolam</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                                    <FishIcon />
                                </div>
                                <span className="text-xs text-slate-500">Fish</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                    <CalendarIcon />
                                </div>
                                <span className="text-xs text-slate-500">Calendar</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <WalletIcon />
                                </div>
                                <span className="text-xs text-slate-500">Wallet</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <FCRIcon />
                                </div>
                                <span className="text-xs text-slate-500">Chart</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                    <TrendingUpIcon />
                                </div>
                                <span className="text-xs text-slate-500">Trending</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                    <ClockIcon />
                                </div>
                                <span className="text-xs text-slate-500">Clock</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                    <WarningIcon className="w-6 h-6" />
                                </div>
                                <span className="text-xs text-slate-500">Warning</span>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Emoji Icons</h2>
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
                            {['🐟', '🌾', '📦', '💎', '📉', '✅', '💀', '🌱', '🍚', '📋', '📊', '💰'].map(emoji => (
                                <div key={emoji} className="flex flex-col items-center gap-1">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-xl">
                                        {emoji}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-4">Emoji digunakan untuk representasi visual cepat dalam card dan list.</p>
                    </section>
                </div>
            )}

            {/* Extended Components Section */}
            {activeTab === 'extended' && (
                <div className="space-y-8">
                    {/* Tab Navigation */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Tab Navigation</h2>
                        <p className="text-sm text-slate-500 mb-6">Komponen navigasi tab untuk switch antar section/view.</p>

                        <div className="space-y-6">
                            {/* Default Tabs */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Default Style</p>
                                <div className="tab-container">
                                    <button className="tab tab-active">Dashboard</button>
                                    <button className="tab">Kolam</button>
                                    <button className="tab">Pakan</button>
                                    <button className="tab">Laporan</button>
                                </div>
                                <code className="text-xs text-slate-400 mt-2 block">className="tab" + "tab-active"</code>
                            </div>

                            {/* Pill Tabs */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pill Style</p>
                                <div className="tab-container">
                                    <button className="tab tab-pill tab-active">Semua</button>
                                    <button className="tab tab-pill">Aktif</button>
                                    <button className="tab tab-pill">Selesai</button>
                                    <button className="tab tab-pill">Draft</button>
                                </div>
                                <code className="text-xs text-slate-400 mt-2 block">className="tab tab-pill"</code>
                            </div>

                            {/* Underline Tabs */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Underline Style</p>
                                <div className="tab-container border-b border-slate-200">
                                    <button className="tab tab-underline tab-active">Overview</button>
                                    <button className="tab tab-underline">Analytics</button>
                                    <button className="tab tab-underline">Settings</button>
                                </div>
                                <code className="text-xs text-slate-400 mt-2 block">className="tab tab-underline"</code>
                            </div>
                        </div>
                    </section>

                    {/* Toggle Switch */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Toggle Switch</h2>
                        <p className="text-sm text-slate-500 mb-6">Switch on/off untuk pengaturan dan preferensi.</p>

                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-8 items-center">
                                <div className="flex flex-col items-center gap-2">
                                    <label className="toggle toggle-sm">
                                        <input type="checkbox" className="toggle-input" checked={toggleStates.toggle3} onChange={() => setToggleStates(s => ({ ...s, toggle3: !s.toggle3 }))} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="text-xs text-slate-500">Small</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <label className="toggle">
                                        <input type="checkbox" className="toggle-input" checked={toggleStates.toggle1} onChange={() => setToggleStates(s => ({ ...s, toggle1: !s.toggle1 }))} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="text-xs text-slate-500">Default</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <label className="toggle toggle-lg">
                                        <input type="checkbox" className="toggle-input" checked={toggleStates.toggle2} onChange={() => setToggleStates(s => ({ ...s, toggle2: !s.toggle2 }))} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="text-xs text-slate-500">Large</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <label className="toggle">
                                        <input type="checkbox" className="toggle-input" disabled />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="text-xs text-slate-500">Disabled</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-600 mb-2"><strong>Usage:</strong></p>
                                <code className="text-xs text-slate-500 block">
                                    {`<label className="toggle"><input type="checkbox" className="toggle-input" /><span className="toggle-slider"></span></label>`}
                                </code>
                            </div>
                        </div>
                    </section>

                    {/* Progress Bar */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Progress Bar</h2>
                        <p className="text-sm text-slate-500 mb-6">Menampilkan progress atau persentase.</p>

                        <div className="space-y-6 max-w-lg">
                            {/* Sizes */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sizes</p>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Small (4px)</span>
                                            <span>60%</span>
                                        </div>
                                        <div className="progress progress-sm">
                                            <div className="progress-bar progress-bar-primary" style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Default (6px)</span>
                                            <span>75%</span>
                                        </div>
                                        <div className="progress">
                                            <div className="progress-bar progress-bar-cyan" style={{ width: '75%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Large (10px)</span>
                                            <span>45%</span>
                                        </div>
                                        <div className="progress progress-lg">
                                            <div className="progress-bar progress-bar-indigo" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Color Variants</p>
                                <div className="space-y-3">
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-success" style={{ width: '80%' }}></div>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-warning" style={{ width: '60%' }}></div>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-danger" style={{ width: '30%' }}></div>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-emerald" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chips */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Chips / Tags</h2>
                        <p className="text-sm text-slate-500 mb-6">Untuk menampilkan label, filter, atau kategori.</p>

                        <div className="flex flex-wrap gap-3">
                            <span className="chip">Default</span>
                            <span className="chip chip-primary">Primary</span>
                            <span className="chip chip-success">Success</span>
                            <span className="chip chip-warning">Warning</span>
                            <span className="chip chip-danger">Danger</span>
                            <span className="chip chip-closable">
                                Closable
                                <span className="chip-close">×</span>
                            </span>
                        </div>

                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <code className="text-xs text-slate-500">className="chip chip-[variant]"</code>
                        </div>
                    </section>

                    {/* Avatar */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Avatar</h2>
                        <p className="text-sm text-slate-500 mb-6">Representasi visual untuk user atau entitas.</p>

                        <div className="space-y-6">
                            {/* Sizes */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sizes</p>
                                <div className="flex items-center gap-4">
                                    <div className="avatar avatar-sm">AB</div>
                                    <div className="avatar">CD</div>
                                    <div className="avatar avatar-lg">EF</div>
                                    <div className="avatar avatar-xl">GH</div>
                                </div>
                            </div>

                            {/* Shapes */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shapes</p>
                                <div className="flex items-center gap-4">
                                    <div className="avatar">AB</div>
                                    <div className="avatar avatar-square">CD</div>
                                </div>
                            </div>

                            {/* Group */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Avatar Group</p>
                                <div className="avatar-group">
                                    <div className="avatar">A</div>
                                    <div className="avatar">B</div>
                                    <div className="avatar">C</div>
                                    <div className="avatar">+3</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Icon Box */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Icon Box</h2>
                        <p className="text-sm text-slate-500 mb-6">Container untuk ikon dengan background warna.</p>

                        <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-primary">🐟</div>
                                <span className="text-[10px] text-slate-400">primary</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-success">✓</div>
                                <span className="text-[10px] text-slate-400">success</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-warning">⚠</div>
                                <span className="text-[10px] text-slate-400">warning</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-danger">✗</div>
                                <span className="text-[10px] text-slate-400">danger</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-cyan">💧</div>
                                <span className="text-[10px] text-slate-400">cyan</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-indigo">📊</div>
                                <span className="text-[10px] text-slate-400">indigo</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-emerald">💰</div>
                                <span className="text-[10px] text-slate-400">emerald</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-amber">🍚</div>
                                <span className="text-[10px] text-slate-400">amber</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="icon-box icon-box-blue">📦</div>
                                <span className="text-[10px] text-slate-400">blue</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sizes</p>
                            <div className="flex items-center gap-4">
                                <div className="icon-box icon-box-sm icon-box-primary">🐟</div>
                                <div className="icon-box icon-box-primary">🐟</div>
                                <div className="icon-box icon-box-lg icon-box-primary">🐟</div>
                                <div className="icon-box icon-box-xl icon-box-primary">🐟</div>
                            </div>
                        </div>
                    </section>

                    {/* Skeleton */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Skeleton Loading</h2>
                        <p className="text-sm text-slate-500 mb-6">Placeholder loading state untuk konten.</p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="skeleton skeleton-avatar"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-text w-full"></div>
                                    <div className="skeleton skeleton-text w-3/4"></div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="skeleton skeleton-button"></div>
                                <div className="skeleton skeleton-button w-24"></div>
                            </div>

                            <div className="card p-4 border border-slate-200">
                                <div className="flex gap-4">
                                    <div className="skeleton w-20 h-20 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton skeleton-title"></div>
                                        <div className="skeleton skeleton-text w-full"></div>
                                        <div className="skeleton skeleton-text w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Alert */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Alert / Notification</h2>
                        <p className="text-sm text-slate-500 mb-6">Box untuk menampilkan pesan atau notifikasi.</p>

                        <div className="space-y-4 max-w-lg">
                            <div className="alert alert-info">
                                <span className="text-lg">ℹ️</span>
                                <div className="alert-content">
                                    <p className="alert-title">Informasi</p>
                                    <p className="alert-description">Ini adalah pesan informasi untuk pengguna.</p>
                                </div>
                            </div>
                            <div className="alert alert-success">
                                <span className="text-lg">✅</span>
                                <div className="alert-content">
                                    <p className="alert-title">Berhasil</p>
                                    <p className="alert-description">Data berhasil disimpan ke database.</p>
                                </div>
                            </div>
                            <div className="alert alert-warning">
                                <span className="text-lg">⚠️</span>
                                <div className="alert-content">
                                    <p className="alert-title">Perhatian</p>
                                    <p className="alert-description">Stok pakan hampir habis, segera lakukan restok.</p>
                                </div>
                            </div>
                            <div className="alert alert-danger">
                                <span className="text-lg">❌</span>
                                <div className="alert-content">
                                    <p className="alert-title">Error</p>
                                    <p className="alert-description">Gagal menyimpan data. Silakan coba lagi.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Divider</h2>
                        <p className="text-sm text-slate-500 mb-6">Pemisah antar section atau konten.</p>

                        <div className="space-y-6 max-w-lg">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Content above</p>
                                <div className="divider"></div>
                                <p className="text-sm text-slate-600">Content below</p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-600 mb-4">With text:</p>
                                <div className="divider-text">atau</div>
                            </div>

                            <div className="flex items-center h-16">
                                <span className="text-sm text-slate-600">Left</span>
                                <div className="divider-vertical"></div>
                                <span className="text-sm text-slate-600">Right</span>
                            </div>
                        </div>
                    </section>

                    {/* List Item */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">List Item</h2>
                        <p className="text-sm text-slate-500 mb-6">Item dalam daftar dengan hover effect.</p>

                        <div className="space-y-3 max-w-md">
                            <div className="list-item">
                                <div className="flex items-center gap-3">
                                    <div className="icon-box icon-box-sm icon-box-primary">🐟</div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">Kolam A1</p>
                                        <p className="text-xs text-slate-500">5,000 ekor</p>
                                    </div>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="list-item list-item-warning">
                                <div className="flex items-center gap-3">
                                    <div className="icon-box icon-box-sm icon-box-warning">⚠️</div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">Stok Pakan Menipis</p>
                                        <p className="text-xs text-slate-500">Sisa 5 kg</p>
                                    </div>
                                </div>
                                <span className="badge badge-sm badge-warning">Waspada</span>
                            </div>
                            <div className="list-item list-item-danger">
                                <div className="flex items-center gap-3">
                                    <div className="icon-box icon-box-sm icon-box-danger">❌</div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">Kolam B2 Berisiko</p>
                                        <p className="text-xs text-slate-500">Kepadatan tinggi</p>
                                    </div>
                                </div>
                                <span className="badge badge-sm badge-danger">Kritis</span>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Components Section */}
            {activeTab === 'components' && (
                <div className="space-y-8">
                    {/* Modal/Popup */}
                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Modal / Popup</h2>
                        <p className="text-sm text-slate-500 mb-6">Dialog modal untuk menampilkan konten atau form.</p>

                        <div className="space-y-4">
                            {/* Size Variants */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Size Variants</h3>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setActiveModal('small')}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        Small Modal
                                    </button>
                                    <button
                                        onClick={() => setActiveModal('medium')}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        Medium Modal
                                    </button>
                                    <button
                                        onClick={() => setActiveModal('large')}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        Large Modal
                                    </button>
                                </div>
                            </div>

                            {/* Modal Types */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Modal Types</h3>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setActiveModal('confirmation')}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Confirmation
                                    </button>
                                    <button
                                        onClick={() => setActiveModal('form')}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Form Modal
                                    </button>
                                    <button
                                        onClick={() => setActiveModal('info')}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Info Modal
                                    </button>
                                    <button
                                        onClick={() => setActiveModal('danger')}
                                        className="btn btn-danger btn-sm"
                                    >
                                        Danger Modal
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Examples */}
                        {activeModal === 'small' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-sm" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3 className="modal-title">Small Modal</h3>
                                        <button className="modal-close" onClick={() => setActiveModal(null)}>
                                            ✕
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="text-sm text-slate-600">Ini adalah contoh modal dengan ukuran kecil (400px). Cocok untuk notifikasi atau konfirmasi sederhana.</p>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Tutup</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'medium' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-md" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3 className="modal-title">Medium Modal</h3>
                                        <button className="modal-close" onClick={() => setActiveModal(null)}>
                                            ✕
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="text-sm text-slate-600 mb-4">Ini adalah contoh modal dengan ukuran medium (500px). Ukuran default yang cocok untuk sebagian besar konten.</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="form-label">Nama Kolam</label>
                                                <input type="text" className="input" placeholder="Contoh: Kolam A1" />
                                            </div>
                                            <div>
                                                <label className="form-label">Kapasitas</label>
                                                <input type="number" className="input" placeholder="Jumlah ekor" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Batal</button>
                                        <button className="btn btn-primary">Simpan</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'large' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3 className="modal-title">Large Modal</h3>
                                        <button className="modal-close" onClick={() => setActiveModal(null)}>
                                            ✕
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="text-sm text-slate-600 mb-4">Ini adalah contoh modal dengan ukuran besar (700px). Cocok untuk form yang kompleks atau konten detail.</p>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="form-label">Nama Kolam</label>
                                                <input type="text" className="input" placeholder="Contoh: Kolam A1" />
                                            </div>
                                            <div>
                                                <label className="form-label">Ukuran</label>
                                                <input type="text" className="input" placeholder="Panjang x Lebar" />
                                            </div>
                                            <div>
                                                <label className="form-label">Jumlah Tebar</label>
                                                <input type="number" className="input" placeholder="Jumlah ekor" />
                                            </div>
                                            <div>
                                                <label className="form-label">Tanggal Tebar</label>
                                                <input type="date" className="input" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="form-label">Catatan</label>
                                            <textarea className="input" rows={3} placeholder="Tambahkan catatan..." />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Batal</button>
                                        <button className="btn btn-primary">Simpan Data</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'confirmation' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-sm" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <div className="icon-box icon-box-warning">⚠️</div>
                                    </div>
                                    <div className="modal-body text-center">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Tindakan</h3>
                                        <p className="text-sm text-slate-600">Apakah Anda yakin ingin melanjutkan? Tindakan ini tidak dapat dibatalkan.</p>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary flex-1" onClick={() => setActiveModal(null)}>Batal</button>
                                        <button className="btn btn-primary flex-1">Ya, Lanjutkan</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'form' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-md" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3 className="modal-title">Tambah Pakan</h3>
                                        <button className="modal-close" onClick={() => setActiveModal(null)}>
                                            ✕
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="space-y-4">
                                            <div className="form-group">
                                                <label className="form-label">Jenis Pakan</label>
                                                <select className="input">
                                                    <option>Pilih jenis pakan</option>
                                                    <option>Pakan Premium</option>
                                                    <option>Pakan Standard</option>
                                                </select>
                                                <p className="form-hint">Pilih jenis pakan yang akan diberikan</p>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Jumlah (kg)</label>
                                                <input type="number" className="input" placeholder="0.0" step="0.1" />
                                                <p className="form-hint">Masukkan jumlah dalam kilogram</p>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Waktu Pemberian</label>
                                                <input type="time" className="input" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Batal</button>
                                        <button className="btn btn-primary">Simpan</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'info' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-sm" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <div className="icon-box icon-box-info">ℹ️</div>
                                        <button className="modal-close" onClick={() => setActiveModal(null)}>
                                            ✕
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Informasi Penting</h3>
                                        <p className="text-sm text-slate-600 mb-3">Sistem akan melakukan maintenance pada:</p>
                                        <div className="alert alert-info">
                                            <p className="text-sm font-medium">Senin, 3 Februari 2026</p>
                                            <p className="text-xs">Pukul 01:00 - 03:00 WIB</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">Mohon simpan pekerjaan Anda sebelum waktu tersebut.</p>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-primary w-full" onClick={() => setActiveModal(null)}>Mengerti</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'danger' && (
                            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                                <div className="modal-content modal-content-sm" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <div className="icon-box icon-box-danger">🗑️</div>
                                    </div>
                                    <div className="modal-body text-center">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Data Kolam?</h3>
                                        <p className="text-sm text-slate-600 mb-3">Data kolam "Kolam A1" dan semua riwayat terkait akan dihapus permanen.</p>
                                        <div className="alert alert-danger">
                                            <p className="text-xs font-medium">⚠️ Tindakan ini tidak dapat dibatalkan</p>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary flex-1" onClick={() => setActiveModal(null)}>Batal</button>
                                        <button className="btn btn-danger flex-1">Ya, Hapus</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Alert Item</h2>
                        <div className="space-y-3 max-w-md">
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg text-red-600">
                                        📦
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-red-700">Pakan Premium</p>
                                        <p className="text-xs text-slate-500">Sisa <span className="font-bold text-red-600">5.2 kg</span></p>
                                    </div>
                                </div>
                                <ArrowRightIcon className="text-slate-300 w-4 h-4 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg text-amber-600">
                                        🐟
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Kolam B2</p>
                                        <p className="text-xs text-slate-500">12.5 kg/m³</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-amber-100 text-amber-700">waspada</span>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Forecast Item</h2>
                        <div className="space-y-3 max-w-md">
                            <div className="p-3 rounded-xl border transition-all flex items-center justify-between bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer group">
                                <div>
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Kolam A1</p>
                                    <p className="text-xs text-slate-500">Bobot skrg: <span className="font-medium text-slate-700">120g</span></p>
                                </div>
                                <div className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-slate-900">16 Hari</span>
                                        <span className="text-[10px] text-slate-400">15 Feb</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl border transition-all flex items-center justify-between bg-emerald-50 border-emerald-100 hover:border-emerald-300 cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Kolam B1</p>
                                    <p className="text-xs text-slate-500">Bobot skrg: <span className="font-medium text-slate-700">155g</span></p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                                        SIAP PANEN
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Progress Bar</h2>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>90g</span>
                                    <span>Target 150g</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500" style={{ width: '60%' }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Normal Progress (60%)</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span className="text-indigo-600 font-bold">120g (Sample)</span>
                                    <span>Target 150g</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: '80%' }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Calibrated Progress (80%)</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>155g</span>
                                    <span>Target 150g</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Complete (100%)</p>
                            </div>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Activity Timeline</h2>
                        <div className="space-y-4 max-w-md">
                            {[
                                { type: 'PAKAN', title: 'Pemberian Pakan', desc: '5.2 kg Pakan Premium', kolam: 'Kolam A1', date: '30 Jan 2026' },
                                { type: 'PANEN', title: 'Panen Parsial', desc: '150 kg, Rp 3.750.000', kolam: 'Kolam B2', date: '29 Jan 2026' },
                            ].map((act, i) => (
                                <div key={i} className="flex gap-3 items-start relative pb-4 last:pb-0 border-l-2 border-slate-100 last:border-0 pl-4 -ml-2">
                                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs text-slate-500 mb-0.5">{act.date}</p>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${act.type === 'PAKAN' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {act.type}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 leading-tight">{act.title}</p>
                                        <p className="text-xs text-slate-600 mt-1">
                                            {act.desc} <span className="text-slate-400 mx-1">•</span> {act.kolam}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Empty State</h2>
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                📂
                            </div>
                            <h3 className="empty-state-title">Belum Ada Data</h3>
                            <p className="empty-state-description">Belum ada kolam yang terdaftar. Tambah kolam baru untuk memulai.</p>
                            <button className="btn btn-primary">
                                <PlusIcon /> Tambah Kolam
                            </button>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">All Clear State</h2>
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 max-w-sm">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl text-emerald-600">
                                ✅
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Semua Aman</h3>
                            <p className="text-slate-500 text-sm max-w-[200px] mx-auto mt-2">
                                Stok pakan cukup, nafsu makan stabil, dan kondisi kolam normal.
                            </p>
                        </div>
                    </section>

                    <section className="card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Table - Enhanced UX</h2>
                        <p className="text-sm text-slate-500 mb-6">Tabel yang user-friendly dengan striped rows, hover effects, dan status indicators.</p>
                        
                        {/* Basic Table */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">1. Basic Table (Striped)</h3>
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Kolam</th>
                                            <th className="text-center">Tipe</th>
                                            <th className="text-right">Berat (Kg)</th>
                                            <th className="text-right">Total (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>2026-01-30</td>
                                            <td className="text-strong">Kolam A1</td>
                                            <td className="text-center">
                                                <span className="badge badge-inline badge-indigo">PARSIAL</span>
                                            </td>
                                            <td className="text-right">150</td>
                                            <td className="text-right text-strong text-emerald-600">Rp 3.750.000</td>
                                        </tr>
                                        <tr>
                                            <td>2026-01-28</td>
                                            <td className="text-strong">Kolam B2</td>
                                            <td className="text-center">
                                                <span className="badge badge-inline badge-danger">TOTAL</span>
                                            </td>
                                            <td className="text-right">450</td>
                                            <td className="text-right text-strong text-emerald-600">Rp 11.250.000</td>
                                        </tr>
                                        <tr>
                                            <td>2026-01-25</td>
                                            <td className="text-strong">Kolam C3</td>
                                            <td className="text-center">
                                                <span className="badge badge-inline badge-success">PARSIAL</span>
                                            </td>
                                            <td className="text-right">200</td>
                                            <td className="text-right text-strong text-emerald-600">Rp 5.000.000</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table with Status Rows */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">2. Table with Row Status Indicators</h3>
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Kolam</th>
                                            <th>Status</th>
                                            <th className="text-right">Populasi</th>
                                            <th className="text-right">Umur (Hari)</th>
                                            <th className="text-right">Est. Panen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="row-success">
                                            <td className="text-strong">Kolam A1</td>
                                            <td><span className="badge badge-success">AKTIF</span></td>
                                            <td className="text-right">5,000</td>
                                            <td className="text-right">45</td>
                                            <td className="text-right font-medium">2026-02-15</td>
                                        </tr>
                                        <tr className="row-warning">
                                            <td className="text-strong">Kolam B2</td>
                                            <td><span className="badge badge-warning">WASPADA</span></td>
                                            <td className="text-right">3,200</td>
                                            <td className="text-right">28</td>
                                            <td className="text-right font-medium">2026-02-20</td>
                                        </tr>
                                        <tr className="row-danger">
                                            <td className="text-strong">Kolam C3</td>
                                            <td><span className="badge badge-danger">BERISIKO</span></td>
                                            <td className="text-right">1,500</td>
                                            <td className="text-right">60</td>
                                            <td className="text-right font-medium">2026-01-31</td>
                                        </tr>
                                        <tr className="row-active">
                                            <td className="text-strong">Kolam D4</td>
                                            <td><span className="badge badge-info">SIAP PANEN</span></td>
                                            <td className="text-right">4,800</td>
                                            <td className="text-right">75</td>
                                            <td className="text-right font-medium">2026-01-29</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Compact Table */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">3. Compact Table Variant</h3>
                            <p className="text-xs text-slate-500 mb-3">Cocok untuk data dalam jumlah banyak atau tampilan mobile.</p>
                            <div className="table-wrapper">
                                <table className="table table-compact">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Jenis</th>
                                            <th className="text-right">Jumlah</th>
                                            <th className="text-right">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>2026-01-30</td>
                                            <td className="text-strong">Pakan Lele</td>
                                            <td className="text-right">50 kg</td>
                                            <td className="text-right text-strong">Rp 500.000</td>
                                        </tr>
                                        <tr>
                                            <td>2026-01-30</td>
                                            <td className="text-strong">Obat Mata</td>
                                            <td className="text-right">2 botol</td>
                                            <td className="text-right text-strong">Rp 250.000</td>
                                        </tr>
                                        <tr>
                                            <td>2026-01-29</td>
                                            <td className="text-strong">Kapur Tohor</td>
                                            <td className="text-right">100 kg</td>
                                            <td className="text-right text-strong">Rp 150.000</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Spacious Table */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">4. Spacious Table Variant</h3>
                            <p className="text-xs text-slate-500 mb-3">Untuk detail view atau presentasi data penting.</p>
                            <div className="table-wrapper">
                                <table className="table table-spacious">
                                    <thead>
                                        <tr>
                                            <th>Pembeli</th>
                                            <th>Tipe</th>
                                            <th>Total Transaksi</th>
                                            <th className="text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="text-strong">Pasar Konsum - Sidoarjo</td>
                                            <td><span className="badge badge-success">PASAR</span></td>
                                            <td className="text-muted">15 transaksi • Rp 45.000.000</td>
                                            <td className="text-right action-cell">
                                                <button className="btn btn-ghost px-3">👁</button>
                                                <button className="btn btn-ghost px-3 text-red-500 hover:text-red-700">🗑</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-strong">Restoran Merbabu</td>
                                            <td><span className="badge badge-purple">RESTORAN</span></td>
                                            <td className="text-muted">8 transaksi • Rp 28.500.000</td>
                                            <td className="text-right action-cell">
                                                <button className="btn btn-ghost px-3">👁</button>
                                                <button className="btn btn-ghost px-3 text-red-500 hover:text-red-700">🗑</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Features Explanation */}
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                            <h4 className="font-semibold text-blue-900 text-sm">✨ Fitur Baru:</h4>
                            <ul className="text-sm text-blue-800 space-y-2 ml-4">
                                <li><strong>Striped Rows:</strong> Alternate row colors untuk readability lebih baik</li>
                                <li><strong>Enhanced Hover:</strong> Subtle background dengan border untuk visual feedback</li>
                                <li><strong>Row Status:</strong> .row-active, .row-warning, .row-danger, .row-success untuk highlight rows</li>
                                <li><strong>Better Spacing:</strong> Padding 16px, font size 14px untuk text yang lebih readable</li>
                                <li><strong>Text Variants:</strong> .text-strong, .text-muted, .text-small untuk hierarchy</li>
                                <li><strong>Responsive Wrapper:</strong> .table-wrapper dengan border dan rounded corners</li>
                                <li><strong>Compact & Spacious:</strong> .table-compact dan .table-spacious untuk flexibility</li>
                                <li><strong>Action Column:</strong> .action-cell untuk proper alignment tombol di kanan</li>
                            </ul>
                        </div>
                    </section>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-sm text-slate-500">
                    <strong>Lele SaaS Design System</strong> • v1.0 • January 2026
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Built with Tailwind CSS + Custom CSS Variables
                </p>
            </div>
        </DashboardLayout>
    );
}
