import { useState, useMemo } from 'react';

interface Provider {
  name: string;
  color: string;
  freeTier: {
    requests: number;
    computeGBs: number;
  };
  pricing: {
    perRequest: number;
    perGBSecond: number;
  };
}

const providers: Provider[] = [
  {
    name: 'AWS Lambda',
    color: '#FF9900',
    freeTier: { requests: 1_000_000, computeGBs: 400_000 },
    pricing: { perRequest: 0.0000002, perGBSecond: 0.0000166667 },
  },
  {
    name: 'Azure Functions',
    color: '#0078D4',
    freeTier: { requests: 1_000_000, computeGBs: 400_000 },
    pricing: { perRequest: 0.0000002, perGBSecond: 0.000016 },
  },
  {
    name: 'Google Cloud Functions',
    color: '#4285F4',
    freeTier: { requests: 2_000_000, computeGBs: 400_000 },
    pricing: { perRequest: 0.0000004, perGBSecond: 0.0000025 },
  },
  {
    name: 'Cloudflare Workers',
    color: '#F38020',
    freeTier: { requests: 100_000, computeGBs: 0 },
    pricing: { perRequest: 0.00000015, perGBSecond: 0 },
  },
];

export default function PricingCalculator() {
  const [executions, setExecutions] = useState(1_000_000);
  const [duration, setDuration] = useState(200);
  const [memory, setMemory] = useState(256);

  const results = useMemo(() => {
    const gbSeconds = (memory / 1024) * (duration / 1000) * executions;

    return providers.map((provider) => {
      const billableRequests = Math.max(0, executions - provider.freeTier.requests);
      const billableGBs = Math.max(0, gbSeconds - provider.freeTier.computeGBs);

      const requestCost = billableRequests * provider.pricing.perRequest;
      const computeCost = billableGBs * provider.pricing.perGBSecond;
      const total = requestCost + computeCost;

      return {
        ...provider,
        requestCost,
        computeCost,
        total,
      };
    }).sort((a, b) => a.total - b.total);
  }, [executions, duration, memory]);

  const formatCurrency = (value: number) => {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '<$0.01';
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Serverless Pricing Calculator
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Compare costs across cloud providers
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Inputs */}
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Monthly Executions
            </label>
            <input
              type="range"
              min="100000"
              max="100000000"
              step="100000"
              value={executions}
              onChange={(e) => setExecutions(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="mt-2 text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(executions)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Avg Duration (ms)
            </label>
            <input
              type="range"
              min="10"
              max="10000"
              step="10"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="mt-2 text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(duration)} ms
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Memory (MB)
            </label>
            <select
              value={memory}
              onChange={(e) => setMemory(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {[128, 256, 512, 1024, 2048, 4096].map((mb) => (
                <option key={mb} value={mb}>
                  {mb} MB
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={result.name}
              className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0
                  ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800'
                  : 'bg-slate-50 dark:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: result.color }}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {result.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Requests: {formatCurrency(result.requestCost)} | Compute: {formatCurrency(result.computeCost)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(result.total)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">/month</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          * Estimates based on published pricing. Actual costs may vary. Cloudflare Workers uses a different pricing model (CPU time, not GB-seconds).
        </p>
      </div>
    </div>
  );
}
