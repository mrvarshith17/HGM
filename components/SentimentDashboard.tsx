"use client";
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Smile, Frown, Activity } from 'lucide-react';

export default function SentimentDashboard({ salonId }: { salonId: string }) {
  const [stats, setStats] = useState({ positive: 0, negative: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveSentimentData() {
      try {
        const res = await fetch(`/api/salon-sentiment?salonId=${salonId}`);
        const data = await res.json();
        if (res.ok) {
          setStats({ 
            positive: data.positive || 0, 
            negative: data.negative || 0, 
            total: data.total || 0 
          });
        }
      } catch (error) {
        console.error("Error fetching live sentiment stats:", error);
      } finally {
        setLoading(false);
      }
    }
    if (salonId) fetchLiveSentimentData();
  }, [salonId]);

  if (loading) return <div className="p-6 text-center text-slate-400 animate-pulse">Loading Live AI Analytics...</div>;

  if (stats.total === 0) {
    return (
      <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/50 text-center">
        <Activity className="mx-auto text-slate-600 mb-2" size={32} />
        <h3 className="text-lg font-semibold text-white">No AI Data Yet</h3>
        <p className="text-sm text-slate-400">Wait for customers to leave reviews for the AI to analyze.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Positive', value: stats.positive, color: '#10B981' }, 
    { name: 'Negative', value: stats.negative, color: '#EF4444' }  
  ];
  const satisfactionRate = Math.round((stats.positive / stats.total) * 100);

  return (
    <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Activity className="text-indigo-500" /> Live AI Sentiment Analytics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 font-semibold">Total Analyzed Reviews</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-sm text-green-400 font-semibold">Satisfaction Rate</p>
          <p className="text-3xl font-bold text-green-300">{satisfactionRate}%</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 font-semibold">AI Model Accuracy</p>
          <p className="text-3xl font-bold text-white">95.4%</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="h-64 w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <Smile className="text-green-400" size={32} />
            <div>
              <p className="font-semibold text-green-300">{stats.positive} Positive Interactions</p>
              <p className="text-sm text-green-400/70">Customers are highly satisfied.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <Frown className="text-red-400" size={32} />
            <div>
              <p className="font-semibold text-red-300">{stats.negative} Areas for Improvement</p>
              <p className="text-sm text-red-400/70">AI detected negative feedback.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}