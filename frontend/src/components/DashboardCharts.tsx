'use client';

import { useMemo } from 'react';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';

const COLORS = ['#004ac6', '#006c49', '#f59e0b', '#ba1a1a', '#8b5cf6', '#ec4899'];

export function ClassPerformanceChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-surface p-6 rounded-3xl shadow-sm border border-outline-variant hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Class-wise Performance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c3c6d7" />
          <XAxis dataKey="Class" tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
            cursor={{ fill: '#e5eeff' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Bar dataKey="Pass %" fill="#006c49" radius={[4, 4, 0, 0]} maxBarSize={50} />
          <Line type="monotone" dataKey="Avg %" stroke="#004ac6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectionPerformanceChart({ data }: { data: any[] }) {
  // Format data for section chart
  const formattedData = data.map(d => ({
    name: `${d.Class}-${d.Section}`,
    "Pass %": d["Pass %"],
    "Avg %": d["Avg %"]
  }));

  return (
    <div className="h-80 w-full bg-surface p-6 rounded-3xl shadow-sm border border-outline-variant hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Section-wise Pass Percentage</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={formattedData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#c3c6d7" />
          <XAxis type="number" domain={[0, 100]} tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} width={80} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
            cursor={{ fill: '#e5eeff' }}
          />
          <Bar dataKey="Pass %" fill="#004ac6" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectAverageChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-surface p-6 rounded-3xl shadow-sm border border-outline-variant hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Subject-wise Average Marks</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c3c6d7" />
          <XAxis dataKey="Subject" tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
            cursor={{ fill: '#e5eeff' }}
          />
          <Bar dataKey="Average" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GradeDistributionChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-surface p-6 rounded-3xl shadow-sm border border-outline-variant flex flex-col hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-on-surface mb-2">Grade Distribution</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="Count"
              nameKey="Grade"
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => {
                // Color code specifically for grades
                let color = '#004ac6'; // default primary
                if (entry.Grade === 'A+') color = '#006c49'; // secondary
                else if (entry.Grade === 'A') color = '#6cf8bb'; // secondary-container
                else if (entry.Grade === 'B') color = '#0053db'; // surface-tint
                else if (entry.Grade === 'C') color = '#f59e0b'; // warning (custom)
                else if (entry.Grade === 'Fail') color = '#ba1a1a'; // error
                
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SectionComparisonChart({ data }: { data: any[] }) {
  // Identify all unique sections present in the data to create dynamic bars
  const sections = useMemo(() => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]).filter(k => k.startsWith('Sec '));
    return keys;
  }, [data]);

  return (
    <div className="h-80 w-full bg-surface p-6 rounded-3xl shadow-sm border border-outline-variant hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Section-wise Comparison (Pass %)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c3c6d7" />
          <XAxis dataKey="Class" tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          {sections.map((sec, index) => (
            <Bar 
              key={sec} 
              dataKey={sec} 
              fill={COLORS[index % COLORS.length]} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={30} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectionAvgPercentageChart({ data }: { data: any[] }) {
  const formattedData = data.map(d => ({
    name: `${d.Class}-${d.Section}`,
    value: d["Avg %"]
  }));

  return (
    <div className="h-80 w-full bg-surface p-6 rounded-3xl shadow-sm border border-outline-variant hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Section Performance (Avg %)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={formattedData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#c3c6d7" />
          <XAxis type="number" domain={[0, 100]} tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{fill: '#434655', fontSize: 12}} axisLine={false} tickLine={false} width={60} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
          />
          <Bar dataKey="value" name="Avg %" fill="#004ac6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PerformanceTrendChart({ data }: { data: any[] }) {
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', fontSize: '10px' }}
          />
          <Bar dataKey="percentage" fill="#004ac6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
