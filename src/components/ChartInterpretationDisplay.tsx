// src/components/ChartInterpretationDisplay.tsx - Component hiển thị luận giải lá số

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TuViChartData } from '@/services/TuViService';
import { interpretChart, ChartInterpretation, InterpretationSection } from '@/lib/tuvi/chartInterpretation';

interface Props {
  chart: TuViChartData;
}

function getLevelStyles(level: InterpretationSection['level']): string {
  switch (level) {
    case 'positive':
      return 'border-green-600/40 bg-gradient-to-br from-green-900/20 to-emerald-900/10';
    case 'negative':
      return 'border-red-600/40 bg-gradient-to-br from-red-900/20 to-orange-900/10';
    case 'info':
      return 'border-blue-600/40 bg-gradient-to-br from-blue-900/20 to-indigo-900/10';
    default:
      return 'border-slate-600/40 bg-gradient-to-br from-slate-800/50 to-slate-900/50';
  }
}

function getLevelBadge(level: InterpretationSection['level']): React.ReactNode {
  switch (level) {
    case 'positive':
      return <Badge className="bg-green-500/30 text-green-300 border-green-500/50 text-[10px]">Thuận lợi</Badge>;
    case 'negative':
      return <Badge className="bg-red-500/30 text-red-300 border-red-500/50 text-[10px]">Cần lưu ý</Badge>;
    case 'info':
      return <Badge className="bg-blue-500/30 text-blue-300 border-blue-500/50 text-[10px]">Thông tin</Badge>;
    default:
      return <Badge className="bg-slate-500/30 text-slate-300 border-slate-500/50 text-[10px]">Trung bình</Badge>;
  }
}

function InterpretationCard({ section, defaultOpen = false }: { section: InterpretationSection; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={`p-3 rounded-lg border ${getLevelStyles(section.level)} hover:opacity-90 transition-opacity`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{section.icon}</span>
              <h3 className="font-semibold text-amber-200">{section.title}</h3>
              {getLevelBadge(section.level)}
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className={`mt-1 p-4 rounded-lg border-l-2 ${
          section.level === 'positive' ? 'border-l-green-500 bg-green-900/10' :
          section.level === 'negative' ? 'border-l-red-500 bg-red-900/10' :
          section.level === 'info' ? 'border-l-blue-500 bg-blue-900/10' :
          'border-l-slate-500 bg-slate-900/30'
        }`}>
          <ul className="space-y-2">
            {section.content.map((item, index) => (
              <li key={index} className="text-sm text-gray-300 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ChartInterpretationDisplay({ chart }: Props) {
  const interpretation = interpretChart(chart);
  
  const sections: InterpretationSection[] = [
    interpretation.overview,
    interpretation.personality,
    interpretation.career,
    interpretation.wealth,
    interpretation.love,
    interpretation.health,
    interpretation.fortune,
    interpretation.advice,
  ];
  
  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-900/90 border-amber-600/30">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-xl text-amber-400 flex items-center justify-center gap-2">
          <span>📜</span>
          Luận Giải Tự Động
        </CardTitle>
        <p className="text-sm text-gray-400">
          Phân tích dựa trên các sao và cung trong lá số của bạn
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sections.map((section, index) => (
          <InterpretationCard 
            key={section.title} 
            section={section} 
            defaultOpen={index === 0} // Mở section đầu tiên
          />
        ))}
        
        <AnalysisDisclaimer />
      </CardContent>
    </Card>
  );
}

export default ChartInterpretationDisplay;
