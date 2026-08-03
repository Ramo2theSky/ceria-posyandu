'use client';

import { useState, useEffect } from 'react';
import { RiwayatPemeriksaan, getStatusBg } from '@/lib/riwayat';
import { klasifikasiIMT, klasifikasiTD, klasifikasiGulaDarah } from '@/lib/klasifikasi';

interface RiwayatModalProps {
  riwayat: RiwayatPemeriksaan[];
  onClose: () => void;
}

function getMetricStatus(metric: { status: string }): 'ok' | 'warn' | 'risk' {
  return metric.status as 'ok' | 'warn' | 'risk';
}

function MetricDot({ status }: { status: 'ok' | 'warn' | 'risk' }) {
  const color = status === 'ok' ? 'bg-[var(--color-hijau-ok)]' : status === 'warn' ? 'bg-[var(--color-kuning-warn)]' : 'bg-[var(--color-merah-risiko)]';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export default function RiwayatModal({ riwayat, onClose }: RiwayatModalProps) {
  const sorted = [...riwayat].sort((a, b) => a.tanggal_periksa.localeCompare(b.tanggal_periksa));
  const latest = sorted[sorted.length - 1];

  const [usiaSaatIni, setUsiaSaatIni] = useState<number | null>(null);
  useEffect(() => {
    if (!latest?.tanggal_lahir) {
      setUsiaSaatIni(null);
      return;
    }
    setUsiaSaatIni(Math.floor((Date.now() - new Date(latest.tanggal_lahir).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  }, [latest?.tanggal_lahir]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-[var(--color-kertas)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-kertas)] border-b border-[var(--color-garis)] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-lg text-[var(--color-tinta)]">Riwayat Pemeriksaan</h2>
            <p className="text-xs text-[var(--color-tinta-lembut)]">
              NIK {latest.nik} · {riwayat.length}x periksa
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-tinta-lembut)] hover:bg-[var(--color-garis)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-[var(--color-garis)] p-3 text-center">
              <p className="text-[10px] text-[var(--color-tinta-lembut)]">Usia Saat Ini</p>
              <p className="text-lg font-bold text-[var(--color-tinta)]">
                {usiaSaatIni !== null ? `${usiaSaatIni} th` : '-'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--color-garis)] p-3 text-center">
              <p className="text-[10px] text-[var(--color-tinta-lembut)]">Jumlah Periksa</p>
              <p className="text-lg font-bold text-[var(--color-tinta)]">{riwayat.length}x</p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--color-garis)] p-3 text-center">
              <p className="text-[10px] text-[var(--color-tinta-lembut)]">Status Terakhir</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBg(latest.catatan)}`}>
                {latest.catatan || '-'}
              </span>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl border border-[var(--color-garis)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-garis)]">
              <h3 className="font-bold text-sm text-[var(--color-tinta)]">Tabel Riwayat</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--color-kertas-dalam)]">
                    <th className="px-3 py-2 text-left font-semibold text-[var(--color-tinta-lembut)]">Tanggal</th>
                    <th className="px-3 py-2 text-right font-semibold text-[var(--color-tinta-lembut)]">BB</th>
                    <th className="px-3 py-2 text-right font-semibold text-[var(--color-tinta-lembut)]">IMT</th>
                    <th className="px-3 py-2 text-right font-semibold text-[var(--color-tinta-lembut)]">TD</th>
                    <th className="px-3 py-2 text-right font-semibold text-[var(--color-tinta-lembut)]">Gula Darah</th>
                    <th className="px-3 py-2 text-center font-semibold text-[var(--color-tinta-lembut)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d, i) => {
                    const prev = i > 0 ? sorted[i - 1] : null;
                    const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
                    const td = klasifikasiTD(d.td_sistol, d.td_diastol);
                    const gds = klasifikasiGulaDarah(d.gds, d.jenis_gula_darah || 'sewaktu');
                    const isSehat = d.catatan === 'SEHAT';
                    const isRujukan = d.catatan === 'PERLU RUJUKAN';
                    const isPemantauan = d.catatan === 'PERLU PEMANTAUAN';

                    const rowBg = isRujukan
                      ? 'bg-[var(--color-merah-risiko-bg)]/30'
                      : isPemantauan
                      ? 'bg-[var(--color-kuning-warn-bg)]/30'
                      : '';

                    return (
                      <tr key={d.id} className={`border-t border-[var(--color-garis)]/50 ${rowBg}`}>
                        <td className="px-3 py-2 font-medium text-[var(--color-tinta)]">
                          {new Date(d.tanggal_periksa).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-[var(--color-tinta)]">{d.berat_badan}</span>
                          {prev && d.berat_badan !== prev.berat_badan && (
                            <DeltaChip value={d.berat_badan - prev.berat_badan} />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <MetricDot status={getMetricStatus(imt)} />
                            <span className="text-[var(--color-tinta)]">{d.imt}</span>
                          </span>
                          {prev && d.imt !== prev.imt && (
                            <DeltaChip value={d.imt - prev.imt} />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <MetricDot status={getMetricStatus(td)} />
                            <span className="text-[var(--color-tinta)]">{d.td_sistol}/{d.td_diastol}</span>
                          </span>
                          {prev && (d.td_sistol !== prev.td_sistol || d.td_diastol !== prev.td_diastol) && (
                            <DeltaChip value={d.td_sistol - prev.td_sistol} />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <MetricDot status={getMetricStatus(gds)} />
                            <span className="text-[var(--color-tinta)]">{d.gds} <span className="text-[var(--color-tinta-lembut)] text-[9px]">({d.jenis_gula_darah === 'puasa' ? 'GDP' : 'GDS'})</span></span>
                          </span>
                          {prev && d.gds !== prev.gds && (
                            <DeltaChip value={d.gds - prev.gds} />
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBg(d.catatan)}`}>
                            {!isSehat && <span>★</span>}
                            {d.catatan === 'SEHAT' ? 'Sehat' : d.catatan === 'PERLU PEMANTAUAN' ? 'Pemantauan' : 'Rujukan'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          {sorted.length >= 1 && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-[var(--color-tinta)]">
                {sorted.length === 1 ? 'Data Pemeriksaan' : 'Grafik Perubahan'}
              </h3>
              <LineChart
                title="Berat Badan (kg) & IMT"
                data={sorted}
                lines={[
                  { key: 'berat_badan', label: 'BB', color: '#4A9DAA' },
                  { key: 'imt', label: 'IMT', color: 'var(--color-padi)' },
                ]}
              />
              <LineChart
                title="Tekanan Darah (mmHg)"
                data={sorted}
                lines={[
                  { key: 'td_sistol', label: 'Sistol', color: '#E87C6B' },
                  { key: 'td_diastol', label: 'Diastol', color: 'var(--color-kuning-warn)' },
                ]}
              />
              <LineChart
                title="Gula Darah (mg/dL)"
                data={sorted}
                lines={[
                  { key: 'gds', label: 'GDS', color: '#4A9DAA' },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Delta Chip (perubahan dari pemeriksaan sebelumnya) ─── */
function DeltaChip({ value }: { value: number }) {
  if (value === 0) return null;
  const isUp = value > 0;
  const absVal = Math.abs(value);
  const isGood = (v: number) => v < 0;
  const color = isGood(value)
    ? 'text-[var(--color-hijau-ok)] bg-[var(--color-hijau-ok-bg)]'
    : 'text-[var(--color-merah-risiko)] bg-[var(--color-merah-risiko-bg)]';

  return (
    <span className={`ml-1 inline-block px-1 py-0 rounded text-[9px] font-bold ${color}`}>
      {isUp ? '+' : ''}{absVal % 1 === 0 ? absVal : absVal.toFixed(1)}
    </span>
  );
}

/* ─── Pure SVG Line Chart with Tooltip ─── */
interface ChartLine {
  key: string;
  label: string;
  color: string;
}

function LineChart({ title, data, lines }: { title: string; data: RiwayatPemeriksaan[]; lines: ChartLine[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const padding = { top: 20, right: 16, bottom: 36, left: 40 };
  const width = 500;
  const height = 180;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const labels = data.map((d) =>
    new Date(d.tanggal_periksa).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  );

  const allValues = data.flatMap((d) => lines.map((l) => Number(d[l.key as keyof RiwayatPemeriksaan])));
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const range = maxVal - minVal || 1;

  const getX = (i: number) => padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const getY = (val: number) => padding.top + chartH - ((val - minVal) / range) * chartH;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-garis)] p-4">
      <p className="text-xs font-semibold text-[var(--color-tinta)] mb-3">{title}</p>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 200 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + chartH - pct * chartH;
            const val = minVal + pct * range;
            return (
              <g key={pct}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--color-garis)" strokeWidth="0.5" strokeDasharray="3,3" />
                <text x={padding.left - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--color-tinta-lembut)">
                  {val % 1 === 0 ? val : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X labels */}
          {labels.map((label, i) => (
            <text key={i} x={getX(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--color-tinta-lembut)">
              {label}
            </text>
          ))}

          {/* Lines */}
          {lines.map((line) => {
            const points = data.map((d, i) => {
              const val = Number(d[line.key as keyof RiwayatPemeriksaan]);
              return `${getX(i)},${getY(val)}`;
            }).join(' ');
            return (
              <g key={line.key}>
                {data.length > 1 && <polyline points={points} fill="none" stroke={line.color} strokeWidth="2" strokeLinejoin="round" />}
                {data.map((d, i) => {
                  const val = Number(d[line.key as keyof RiwayatPemeriksaan]);
                  const isHovered = hoveredIdx === i;
                  return (
                    <g
                      key={i}
                      onMouseEnter={() => { setHoveredIdx(i); setHoveredLine(line.key); }}
                      onMouseLeave={() => { setHoveredIdx(null); setHoveredLine(null); }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Larger invisible hit area */}
                      <circle cx={getX(i)} cy={getY(val)} r="12" fill="transparent" />
                      {/* Visible circle */}
                      <circle
                        cx={getX(i)}
                        cy={getY(val)}
                        r={isHovered ? 6 : 4}
                        fill="white"
                        stroke={line.color}
                        strokeWidth={isHovered ? 3 : 2}
                        style={{ transition: 'r 0.15s ease' }}
                      />
                      {data.length === 1 && (
                        <text x={getX(i)} y={getY(val) - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill={line.color}>
                          {val % 1 === 0 ? val : val.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${(padding.top / height) * 100 - 5}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-[var(--color-tinta)] text-white rounded-lg px-3 py-2 shadow-lg text-center min-w-[120px]">
              <p className="text-[10px] font-semibold opacity-80">
                {new Date(data[hoveredIdx].tanggal_periksa).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              {lines.map((line) => {
                const val = Number(data[hoveredIdx][line.key as keyof RiwayatPemeriksaan]);
                return (
                  <p key={line.key} className="text-xs font-bold mt-0.5" style={{ color: line.color === 'var(--color-tinta)' ? 'white' : line.color }}>
                    {line.label}: {val % 1 === 0 ? val : val.toFixed(1)}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 justify-center">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded" style={{ backgroundColor: line.color }} />
            <span className="text-[10px] text-[var(--color-tinta-lembut)]">{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
