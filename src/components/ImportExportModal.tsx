import React, { useState } from 'react';
import { Download, Upload, X, FileSpreadsheet, FileJson, Check } from 'lucide-react';
import { Trade } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onImportTrades: (newTrades: Trade[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  trades,
  onImportTrades,
}) => {
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trades, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trade-journal-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download CSV
  const handleExportCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Date',
      'Time',
      'Symbol',
      'Direction',
      'EntryPrice',
      'ExitPrice',
      'SLPrice',
      'TPPrice',
      'RiskPips',
      'StrategyType',
      'LevelTimeframe',
      'ConfirmationTimeframe',
      'EmotionalState',
      'Status',
      'CalculatedRR',
      'PnLAmount',
      'Notes',
    ];

    const csvRows = [
      headers.join(','),
      ...trades.map((t) =>
        [
          `"${t.date}"`,
          `"${t.time || ''}"`,
          `"${t.symbol}"`,
          `"${t.direction}"`,
          t.entryPrice,
          t.exitPrice !== undefined ? t.exitPrice : '',
          t.slPrice,
          t.tpPrice,
          t.riskPips,
          `"${t.strategyType}"`,
          `"${t.levelTimeframe || ''}"`,
          `"${t.confirmationTimeframe || ''}"`,
          `"${t.emotionalState}"`,
          `"${t.status}"`,
          t.calculatedRiskReward,
          t.pnlAmount || 0,
          `"${(t.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `trade-journal-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSuccessMessage(null);
    setImportErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportTrades(json);
          setImportSuccessMessage(`Successfully imported ${json.length} trade entries!`);
        } else {
          setImportErrorMessage('Invalid JSON format. Expected an array of trade entries.');
        }
      } catch (err) {
        setImportErrorMessage('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Import & Export Trade Journal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          
          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">
              Export Journal Entries ({trades.length} trades)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-slate-800 font-bold transition-all hover:bg-blue-50/50 shadow-sm"
              >
                <FileJson className="w-4 h-4 text-blue-600" />
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-slate-800 font-bold transition-all hover:bg-blue-50/50 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export CSV
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Import Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">
              Import JSON Journal File
            </h3>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 p-4 rounded-xl text-center transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSONFile}
                id="json-import-input"
                className="hidden"
              />
              <label htmlFor="json-import-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-slate-800">Click to select trade-journal-export.json</span>
              </label>
            </div>
          </div>

          {importErrorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 font-medium text-xs">
              {importErrorMessage}
            </div>
          )}

          {importSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

        </div>

        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
