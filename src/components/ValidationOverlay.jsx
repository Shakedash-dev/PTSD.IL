import React, { useState, useRef } from 'react';
import { Shield, Download, Upload, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useValidation } from '@/contexts/ValidationContext';

export default function ValidationOverlay() {
  const { isValidationMode, toggleValidationMode, stats, totalTracked, exportState, importState } = useValidation();
  const [expanded, setExpanded] = useState(false);
  const importRef = useRef(null);

  const issues = (stats.invalid || 0) + (stats.needs_fix || 0);

  return (
    <div className="fixed bottom-4 left-4 z-[9990] flex flex-col items-start gap-1.5">
      {/* Stats panel */}
      {expanded && isValidationMode && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xl p-4 w-52 text-sm">
          <p className="font-bold text-zinc-800 mb-3 text-xs uppercase tracking-wider">סטטוס אימות</p>
          <div className="space-y-2">
            <StatRow color="text-green-600" label="מאומת" value={stats.validated || 0} />
            <StatRow color="text-orange-500" label="דורש תיקון" value={stats.needs_fix || 0} />
            <StatRow color="text-red-600" label="לא תקין" value={stats.invalid || 0} />
            <div className="border-t border-zinc-100 pt-2">
              <StatRow color="text-zinc-500" label='סה"כ עם סטטוס' value={totalTracked} />
            </div>
          </div>

          {/* Export / Import */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={exportState}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs hover:bg-zinc-200 transition-colors"
              title="ייצוא נתוני אימות כ-JSON"
            >
              <Download className="w-3 h-3" />
              ייצא
            </button>
            <label
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
              title="ייבוא נתוני אימות מ-JSON"
            >
              <Upload className="w-3 h-3" />
              ייבא
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => importState(ev.target.result);
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Main toggle button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!isValidationMode) { toggleValidationMode(); setExpanded(true); }
            else setExpanded(e => !e);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-sm font-medium transition-all ${
            isValidationMode
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-zinc-800 text-white hover:bg-zinc-700 opacity-70 hover:opacity-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          {isValidationMode ? 'מצב אימות' : 'אימות'}
          {isValidationMode && issues > 0 && (
            <span className="bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">
              {issues}
            </span>
          )}
          {isValidationMode && (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>

        {isValidationMode && (
          <button
            onClick={toggleValidationMode}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
            title="כבה מצב אימות"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function StatRow({ color, label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${color} text-xs`}>{label}</span>
      <span className="font-mono font-bold text-zinc-800 text-xs">{value}</span>
    </div>
  );
}
