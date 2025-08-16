import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

interface DebugSnapshot {
  drawing?: boolean;
  tool?: string;
  pressure?: number;
  points?: number;
  gesture?: string;
  corners?: number;
  aspect?: number;
  closure?: number;
  timestamp?: number;
}

interface DebugConsoleProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: string[];
  snapshot: DebugSnapshot;
  onClear: () => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ 
  isOpen, 
  onToggle, 
  logs, 
  snapshot, 
  onClear 
}) => {
  return (
    <Card className="mt-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-primary" />
            <span className="font-medium">Debug Console</span>
            <Badge variant="secondary" className="text-xs">
              {logs.length} logs
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" 
              size="sm"
              onClick={onClear}
              className="h-8 text-xs"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-4">
            {/* Current State */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Drawing</div>
                <div className="font-mono text-sm">
                  {snapshot.drawing ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Tool</div>
                <div className="font-mono text-sm">
                  {snapshot.tool || 'none'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Pressure</div>
                <div className="font-mono text-sm">
                  {snapshot.pressure?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Points</div>
                <div className="font-mono text-sm">
                  {snapshot.points || 0}
                </div>
              </div>
            </div>

            {/* Gesture Analysis */}
            {snapshot.gesture && (
              <div className="bg-accent/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-2">Last Gesture Analysis</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Type:</span> 
                    <span className="font-mono ml-1">{snapshot.gesture}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Corners:</span> 
                    <span className="font-mono ml-1">{snapshot.corners || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aspect:</span> 
                    <span className="font-mono ml-1">{snapshot.aspect?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="text-xs text-muted-foreground mb-2">Activity Log</div>
              {logs.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">No logs yet...</div>
              ) : (
                <div className="space-y-1">
                  {logs.slice(-10).map((log, index) => (
                    <div key={index} className="font-mono text-xs text-foreground/80">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DebugConsole;