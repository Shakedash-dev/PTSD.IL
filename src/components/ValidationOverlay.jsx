import React, { useState, useRef } from 'react';
import { Shield, Download, Upload, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useValidation } from '@/contexts/ValidationContext';
import { Button } from '@/components/ui/button';

export default function ValidationOverlay() {
  const { isValidationMode, toggleValidationMode, stats, totalTracked, exportState, importState } = useValidation();
  const [expanded, setExpanded] = useState(false);
  const importRef = useRef(null);

  const issues = (stats.invalid || 0) + (stats.needs_fix || 0);

  return (
    <div className="fixed bottom-4 left-4 z-[9990] flex flex-col items-start gap-1.5">
      {/* Stats panel */}
      {expanded && isValidationMode && (
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-52 text-sm">
          <p className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">סטטוס אימות</p>
          <div className="space-y-2">
            <StatRow color="text-success" label="מאומת" value={stats.validated || 0} />
            <StatRow color="text-warning" label="דורש תיקון" value={stats.needs_fix || 0} />
            <StatRow color="text-destructive" label="לא תקין" value={stats.invalid || 0} />
            <div className="border-t border-border pt-2">
              <StatRow color="text-muted-foreground" label='סה"כ עם סטטוס' value={totalTracked} />
            </div>
          </div>

          {/* Export / Import */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="subtle"
              size="none"
              onClick={exportState}
              className="flex-1 gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-border"
              title="ייצוא נתוני אימות כ-JSON"
            >
              <Download className="w-3 h-3" />
              ייצא
            </Button>
            <label
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-muted text-foreground rounded-lg text-xs hover:bg-border transition-colors cursor-pointer"
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
        <Button
          variant={isValidationMode ? 'destructive' : 'default'}
          radius="full"
          size="none"
          onClick={() => {
            if (!isValidationMode) { toggleValidationMode(); setExpanded(true); }
            else setExpanded(e => !e);
          }}
          className={`gap-2 px-3 py-2 shadow-lg text-sm font-medium ${
            isValidationMode ? '' : 'bg-foreground text-background hover:bg-foreground/90 opacity-70 hover:opacity-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          {isValidationMode ? 'מצב אימות' : 'אימות'}
          {isValidationMode && issues > 0 && (
            <span className="bg-card text-destructive rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold leading-none">
              {issues}
            </span>
          )}
          {isValidationMode && (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
          )}
        </Button>

        {isValidationMode && (
          <Button
            variant="quiet"
            size="none"
            onClick={toggleValidationMode}
            className="text-xs underline"
            title="כבה מצב אימות"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StatRow({ color, label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${color} text-xs`}>{label}</span>
      <span className="font-mono font-semibold text-foreground text-xs">{value}</span>
    </div>
  );
}
