/**
 * AzurTant PRO - Enterprise Dashboard
 * Real-time business intelligence and control center
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Users, DollarSign,
  AlertTriangle, CheckCircle, Clock, Globe, Server, Bot,
  MessageSquare, Share2, Settings, Bell, Search, Menu, X,
  ChevronRight, Zap, Shield, Database, Cloud, Cpu,
  Linkedin, Twitter, Instagram, Facebook, Youtube,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Download
} from 'lucide-react';

// Chart colors
const CHART_COLORS = ['#1E40AF', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function EnterpriseDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState('operational');
  const [realTimeMetrics, setRealTimeMetrics] = useState(getInitialMetrics());

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        ...prev,
        revenue: prev.revenue + Math.floor(Math.random() * 1000 - 200),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3 - 1),
        tickets: prev.tickets + Math.floor(Math.random() * 2 - 1),
        efficiency: Math.min(99, prev.efficiency + Math.floor(Math.random() * 2 - 1))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AzurTant PRO
              </span>
              <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded">Enterprise</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2">
              <Activity className="text-green-400" size={16} />
              <span className="text-sm text-green-400">System: {systemStatus}</span>
            </div>
            <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
              <Bell size={20} className="text-slate-400" />
            </button>
            <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
              <Settings size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4">
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
              { id: 'ventas', label: 'Ventas', icon: TrendingUp },
              { id: 'operaciones', label: 'Operaciones', icon: Settings },
              { id: 'marketing', label: 'Marketing', icon: Share2 },
              { id: 'redes', label: 'Redes Sociales', icon: Globe },
              { id: 'innovacion', label: 'Innovación', icon: Bot },
              { id: 'ml', label: 'ML Analytics', icon: Cpu }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">DEPARTMENTS</h3>
            <div className="space-y-2">
              {['CEO', 'Finanzas', 'Operaciones', 'Legal', 'RRHH', 'Tech', 'Marketing', 'Ventas', 'Compras', 'Seguridad', 'Innovación', 'Redes', 'SysAdmin'].map((dept, i) => (
                <div key={dept} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{dept}</span>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 overflow-auto p-6">
          {activeView === 'overview' && <OverviewPanel metrics={realTimeMetrics} timeRange={timeRange} setTimeRange={setTimeRange} />}
          {activeView === 'finanzas' && <FinanzasPanel />}
          {activeView === 'ventas' && <VentasPanel />}
          {activeView === 'ml' && <MLPanel />}
          {activeView === 'marketing' && <MarketingPanel />}
          {activeView === 'redes' && <RedesPanel />}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({ metrics, timeRange, setTimeRange }) {
  const revenueData = generateRevenueData(timeRange);
  const userActivityData = generateUserActivityData(timeRange);
  const departmentPerformance = generateDepartmentPerformance();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard
          title="Revenue (MXN)"
          value={`$${(metrics.revenue / 1000).toFixed(1)}K`}
          change={12.5}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Active Users"
          value={metrics.activeUsers}
          change={8.2}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Tickets Open"
          value={metrics.tickets}
          change={-15}
          icon={AlertTriangle}
          color="amber"
          invertTrend
        />
        <KPICard
          title="Efficiency"
          value={`${metrics.efficiency}%`}
          change={3.1}
          icon={Activity}
          color="cyan"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-800 text-sm rounded-lg px-3 py-1"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ background: '#1E293B', border: '#334155' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity Chart */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">User Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ background: '#1E293B', border: '#334155' }} />
              <Line type="monotone" dataKey="users" stroke="#06B6D4" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance & Alerts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Department Performance */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Department Performance</h3>
          <div className="space-y-4">
            {departmentPerformance.map((dept, i) => (
              <div key={dept.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                  {dept.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{dept.name}</span>
                    <span className={dept.change > 0 ? 'text-green-400' : 'text-red-400'}>
                      {dept.change > 0 ? '+' : ''}{dept.change}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-1">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${dept.performance}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            {[
              { name: 'Ollama LLM', status: 'operational', uptime: '99.9%' },
              { name: 'GraphRAG', status: 'operational', uptime: '99.7%' },
              { name: 'Mem0 Memory', status: 'operational', uptime: '100%' },
              { name: 'DeepResearch', status: 'operational', uptime: '99.5%' },
              { name: 'Voice Service', status: 'operational', uptime: '99.8%' },
              { name: 'ML Engine', status: 'operational', uptime: '99.6%' }
            ].map(system => (
              <div key={system.name} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-sm">{system.name}</span>
                </div>
                <span className="text-xs text-slate-500">{system.uptime}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { agent: 'Finanzas Agent', action: 'Generated invoice #1234', time: '2m ago', type: 'success' },
              { agent: 'Marketing Agent', action: 'Created 5 social posts', time: '5m ago', type: 'success' },
              { agent: 'Ventas Agent', action: 'Updated CRM for client ABC', time: '8m ago', type: 'success' },
              { agent: 'Tech Agent', action: 'Ticket #456 resolved', time: '12m ago', type: 'success' },
              { agent: 'CEO Agent', action: 'Routed task to Operaciones', time: '15m ago', type: 'info' }
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1 ${activity.type === 'success' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                <div>
                  <p className="text-sm font-medium">{activity.agent}</p>
                  <p className="text-xs text-slate-400">{activity.action}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanzasPanel() {
  const [chartData] = useState(generateFinancialData());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Dashboard</h2>

      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value="$1.25M" change={15.2} icon={DollarSign} color="green" />
        <KPICard title="Accounts Receivable" value="$780K" change={8.5} icon={TrendingUp} color="blue" />
        <KPICard title="Accounts Payable" value="$245K" change={-3.2} icon={TrendingDown} color="amber" invertTrend />
        <KPICard title="Net Profit" value="$385K" change={22.1} icon={TrendingUp} color="cyan" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Revenue by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.departmentRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ background: '#1E293B', border: '#334155' }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.expenses}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.expenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1E293B', border: '#334155' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h3 className="text-lg font-semibold mb-6">Cash Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData.cashFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip contentStyle={{ background: '#1E293B', border: '#334155' }} />
            <Area type="monotone" dataKey="inflow" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            <Area type="monotone" dataKey="outflow" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VentasPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sales Dashboard</h2>

      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Total Deals" value="47" change={12} icon={TrendingUp} color="green" />
        <KPICard title="Pipeline Value" value="$2.3M" change={18.5} icon={DollarSign} color="blue" />
        <KPICard title="Conversion Rate" value="23%" change={5.2} icon={Activity} color="cyan" />
        <KPICard title="Avg Deal Size" value="$48K" change={-2.1} icon={TrendingDown} color="amber" invertTrend />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Sales Pipeline</h3>
          <div className="space-y-4">
            {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed'].map((stage, i) => (
              <div key={stage} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <span className="text-sm font-medium">{stage}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${[15, 25, 35, 45, 60][i]}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400">{[8, 12, 18, 6, 3][i]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Top Clients</h3>
          <div className="space-y-3">
            {[
              { name: 'Corporativo ABC', value: '$450K', deals: 5 },
              { name: 'Grupo XYZ', value: '$380K', deals: 3 },
              { name: 'Servicios Gómez', value: '$290K', deals: 7 },
              { name: 'Consultora 123', value: '$210K', deals: 4 }
            ].map((client, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-slate-400">{client.deals} deals</p>
                </div>
                <span className="text-green-400 font-medium">{client.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MLPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Machine Learning Analytics</h2>

      <div className="grid grid-cols-3 gap-6">
        <KPICard title="Sales Forecast" value="$1.4M" change={18} icon={TrendingUp} color="green" />
        <KPICard title="Churn Risk" value="12%" change={-8} icon={AlertTriangle} color="amber" invertTrend />
        <KPICard title="Efficiency Gain" value="+23%" change={15} icon={Cpu} color="cyan" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">ML Predictions</h3>
          <div className="space-y-4">
            {[
              { model: 'Sales Forecast', accuracy: '94%', lastRun: '2h ago' },
              { model: 'Churn Prediction', accuracy: '89%', lastRun: '4h ago' },
              { model: 'Anomaly Detection', accuracy: '96%', lastRun: '1h ago' },
              { model: 'Sentiment Analysis', accuracy: '92%', lastRun: '30m ago' },
              { model: 'Resource Optimization', accuracy: '87%', lastRun: '6h ago' }
            ].map((model, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium">{model.model}</p>
                  <p className="text-xs text-slate-400">Last: {model.lastRun}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-cyan-500"
                      style={{ width: model.accuracy }}
                    />
                  </div>
                  <span className="text-sm text-cyan-400">{model.accuracy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Model Insights</h3>
          <div className="space-y-4">
            {[
              { insight: 'High demand expected in Q2 for legal services', confidence: 'High', type: 'opportunity' },
              { insight: '3 customers showing churn signals', confidence: 'Medium', type: 'warning' },
              { insight: 'Revenue trending up 18% vs last quarter', confidence: 'High', type: 'positive' },
              { insight: 'Invoice processing time can be reduced by 40%', confidence: 'Medium', type: 'optimization' }
            ].map((insight, i) => (
              <div key={i} className={`p-4 rounded-lg border ${
                insight.type === 'opportunity' ? 'bg-blue-900/30 border-blue-600' :
                insight.type === 'warning' ? 'bg-amber-900/30 border-amber-600' :
                insight.type === 'positive' ? 'bg-green-900/30 border-green-600' :
                'bg-purple-900/30 border-purple-600'
              }`}>
                <div className="flex justify-between items-start">
                  <p className="text-sm">{insight.insight}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    insight.confidence === 'High' ? 'bg-green-600/50' : 'bg-amber-600/50'
                  }`}>
                    {insight.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketingPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Marketing Dashboard</h2>

      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Campaigns Active" value="8" change={2} icon={Share2} color="green" />
        <KPICard title="Leads Generated" value="234" change={15} icon={Users} color="blue" />
        <KPICard title="Engagement Rate" value="4.2%" change={0.8} icon={Activity} color="cyan" />
        <KPICard title="Brand Reach" value="12.5K" change={22} icon={Globe} color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Content Performance</h3>
          <div className="space-y-4">
            {[
              { content: 'Post: Nuevo servicio apostilla', reach: '3.2K', engagement: '4.8%' },
              { content: 'Blog: Guía corporativa', reach: '1.8K', engagement: '6.2%' },
              { content: 'Video: Presentación', reach: '2.4K', engagement: '3.1%' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <span className="text-sm truncate flex-1">{item.content}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-400">👁 {item.reach}</span>
                  <span className="text-green-400">❤️ {item.engagement}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[
                { name: 'Website', value: 45 },
                { name: 'LinkedIn', value: 30 },
                { name: 'Referrals', value: 15 },
                { name: 'Other', value: 10 }
              ]} cx="50%" cy="50%" outerRadius={100} label>
                {CHART_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1E293B', border: '#334155' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RedesPanel() {
  const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok', 'YouTube'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Social Media Command Center</h2>

      <div className="grid grid-cols-6 gap-4">
        {platforms.map((platform) => (
          <div key={platform} className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
              {platform === 'Instagram' ? '📷' : platform === 'Facebook' ? '📘' : platform === 'LinkedIn' ? '💼' : platform === 'Twitter' ? '🐦' : platform === 'TikTok' ? '🎵' : '▶️'}
            </div>
            <p className="font-medium text-sm">{platform}</p>
            <p className="text-2xl font-bold mt-2">1.2K</p>
            <p className="text-xs text-slate-400">Followers</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Content Calendar</h3>
          <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm">+ Create Post</button>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center">
              <p className="text-sm text-slate-400 mb-2">{day}</p>
              <div className="space-y-2">
                <div className="h-8 bg-blue-900/50 rounded border border-blue-600"></div>
                <div className="h-8 bg-green-900/50 rounded border border-green-600"></div>
                <div className="h-8 bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KPICard({ title, value, change, icon: Icon, color, invertTrend = false }) {
  const isPositive = change > 0;
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400'
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${invertTrend ? (isPositive ? 'text-red-400' : 'text-green-400') : (isPositive ? 'text-green-400' : 'text-red-400')}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-slate-800`}>
          <Icon size={24} className={colorClasses[color]} />
        </div>
      </div>
    </div>
  );
}

// Data Generators
function getInitialMetrics() {
  return {
    revenue: 1250000,
    activeUsers: 24,
    tickets: 3,
    efficiency: 94
  };
}

function generateRevenueData(range) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return Array.from({ length: days }, (_, i) => ({
    date: `Day ${i + 1}`,
    revenue: 150000 + Math.random() * 50000
  }));
}

function generateUserActivityData(range) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return Array.from({ length: days }, (_, i) => ({
    date: `Day ${i + 1}`,
    users: 20 + Math.floor(Math.random() * 10),
    sessions: 45 + Math.floor(Math.random() * 20)
  }));
}

function generateDepartmentPerformance() {
  return [
    { name: 'Finanzas', icon: '💰', performance: 92, change: 12 },
    { name: 'Ventas', icon: '📈', performance: 88, change: 8 },
    { name: 'Marketing', icon: '📣', performance: 85, change: 15 },
    { name: 'Operaciones', icon: '⚙️', performance: 79, change: -3 },
    { name: 'Tech', icon: '💻', performance: 95, change: 5 }
  ];
}

function generateFinancialData() {
  return {
    departmentRevenue: [
      { name: 'Ventas', value: 450000 },
      { name: 'Servicios', value: 380000 },
      { name: 'Consultoría', value: 250000 },
      { name: 'Otros', value: 170000 }
    ],
    expenses: [
      { name: 'Nómina', value: 400000 },
      { name: 'Renta', value: 120000 },
      { name: 'Servicios', value: 80000 },
      { name: 'Marketing', value: 60000 },
      { name: 'Otros', value: 40000 }
    ],
    cashFlow: [
      { month: 'Ene', inflow: 450000, outflow: 380000 },
      { month: 'Feb', inflow: 520000, outflow: 400000 },
      { month: 'Mar', inflow: 480000, outflow: 420000 },
      { month: 'Abr', inflow: 600000, outflow: 450000 },
      { month: 'May', inflow: 550000, outflow: 410000 }
    ]
  };
}

export default EnterpriseDashboard;