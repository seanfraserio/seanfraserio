import { useState, useMemo } from 'react';

interface AIModel {
  name: string;
  provider: string;
  color: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  contextWindow: number;
  description: string;
}

const aiModels: AIModel[] = [
  // Anthropic Claude
  {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    color: '#D97706',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    contextWindow: 200000,
    description: 'Best balance of speed and intelligence',
  },
  {
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    color: '#B45309',
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    contextWindow: 200000,
    description: 'Most powerful for complex tasks',
  },
  {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    color: '#F59E0B',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    contextWindow: 200000,
    description: 'Fastest and most cost-effective',
  },
  // OpenAI
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10B981',
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
    contextWindow: 128000,
    description: 'Flagship multimodal model',
  },
  {
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    color: '#34D399',
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    contextWindow: 128000,
    description: 'Affordable and intelligent',
  },
  {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    color: '#059669',
    inputPricePerMillion: 10.00,
    outputPricePerMillion: 30.00,
    contextWindow: 128000,
    description: 'Previous flagship model',
  },
  // Google
  {
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    color: '#3B82F6',
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
    contextWindow: 2000000,
    description: 'Long context up to 2M tokens',
  },
  {
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    color: '#60A5FA',
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
    contextWindow: 1000000,
    description: 'Fast and efficient',
  },
  // Mistral
  {
    name: 'Mistral Large',
    provider: 'Mistral AI',
    color: '#8B5CF6',
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 6.00,
    contextWindow: 128000,
    description: 'Top-tier reasoning',
  },
  {
    name: 'Mistral Small',
    provider: 'Mistral AI',
    color: '#A78BFA',
    inputPricePerMillion: 0.20,
    outputPricePerMillion: 0.60,
    contextWindow: 32000,
    description: 'Cost-efficient for simple tasks',
  },
];

const useCases = [
  { name: 'Chatbot (Light)', inputTokens: 500, outputTokens: 200, requestsPerDay: 100 },
  { name: 'Chatbot (Medium)', inputTokens: 1000, outputTokens: 500, requestsPerDay: 1000 },
  { name: 'Chatbot (Heavy)', inputTokens: 2000, outputTokens: 1000, requestsPerDay: 10000 },
  { name: 'Code Assistant', inputTokens: 3000, outputTokens: 1500, requestsPerDay: 500 },
  { name: 'Document Analysis', inputTokens: 10000, outputTokens: 2000, requestsPerDay: 200 },
  { name: 'Content Generation', inputTokens: 500, outputTokens: 2000, requestsPerDay: 100 },
  { name: 'Custom', inputTokens: 1000, outputTokens: 500, requestsPerDay: 1000 },
];

export default function AIPricingCalculator() {
  const [selectedUseCase, setSelectedUseCase] = useState(useCases[1]);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [requestsPerDay, setRequestsPerDay] = useState(1000);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['Anthropic', 'OpenAI', 'Google', 'Mistral AI']);

  const handleUseCaseChange = (useCase: typeof useCases[0]) => {
    setSelectedUseCase(useCase);
    if (useCase.name !== 'Custom') {
      setInputTokens(useCase.inputTokens);
      setOutputTokens(useCase.outputTokens);
      setRequestsPerDay(useCase.requestsPerDay);
    }
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev =>
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const results = useMemo(() => {
    const monthlyRequests = requestsPerDay * 30;
    const totalInputTokens = inputTokens * monthlyRequests;
    const totalOutputTokens = outputTokens * monthlyRequests;

    return aiModels
      .filter(model => selectedProviders.includes(model.provider))
      .map((model) => {
        const inputCost = (totalInputTokens / 1_000_000) * model.inputPricePerMillion;
        const outputCost = (totalOutputTokens / 1_000_000) * model.outputPricePerMillion;
        const totalCost = inputCost + outputCost;

        return {
          ...model,
          inputCost,
          outputCost,
          totalCost,
          costPerRequest: totalCost / monthlyRequests,
        };
      })
      .sort((a, b) => a.totalCost - b.totalCost);
  }, [inputTokens, outputTokens, requestsPerDay, selectedProviders]);

  const formatCurrency = (value: number) => {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '<$0.01';
    if (value < 1) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const providers = [...new Set(aiModels.map(m => m.provider))];

  return (
    <div className="space-y-6">
      {/* Use Case Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Select Use Case
        </h3>
        <div className="flex flex-wrap gap-2">
          {useCases.map((useCase) => (
            <button
              key={useCase.name}
              onClick={() => handleUseCaseChange(useCase)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedUseCase.name === useCase.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {useCase.name}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Configuration
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Avg Input Tokens per Request
            </label>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={inputTokens}
              onChange={(e) => {
                setInputTokens(Number(e.target.value));
                setSelectedUseCase(useCases.find(u => u.name === 'Custom')!);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="mt-2 text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(inputTokens)} tokens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Avg Output Tokens per Request
            </label>
            <input
              type="range"
              min="50"
              max="10000"
              step="50"
              value={outputTokens}
              onChange={(e) => {
                setOutputTokens(Number(e.target.value));
                setSelectedUseCase(useCases.find(u => u.name === 'Custom')!);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="mt-2 text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(outputTokens)} tokens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Requests per Day
            </label>
            <input
              type="range"
              min="10"
              max="100000"
              step="10"
              value={requestsPerDay}
              onChange={(e) => {
                setRequestsPerDay(Number(e.target.value));
                setSelectedUseCase(useCases.find(u => u.name === 'Custom')!);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="mt-2 text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(requestsPerDay)} / day ({formatNumber(requestsPerDay * 30)} / month)
            </p>
          </div>
        </div>

        {/* Provider Filter */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Filter by Provider
          </label>
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <button
                key={provider}
                onClick={() => toggleProvider(provider)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedProviders.includes(provider)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-transparent'
                }`}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Estimated Monthly Cost
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Based on {formatNumber(requestsPerDay * 30)} requests/month with {formatNumber(inputTokens)} input + {formatNumber(outputTokens)} output tokens each
          </p>
        </div>

        <div className="p-6 space-y-3">
          {results.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              Select at least one provider to see pricing
            </p>
          ) : (
            results.map((result, index) => (
              <div
                key={result.name}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg gap-3 ${
                  index === 0
                    ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800'
                    : 'bg-slate-50 dark:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1 sm:mt-0 flex-shrink-0"
                    style={{ backgroundColor: result.color }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {result.name}
                      </p>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300 rounded-full">
                          Best Value
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {result.provider} • {result.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Input: {formatCurrency(result.inputCost)} | Output: {formatCurrency(result.outputCost)} | Per request: {formatCurrency(result.costPerRequest)}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right pl-6 sm:pl-0">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(result.totalCost)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">/month</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            * Prices as of January 2025. Actual costs may vary. Does not include fine-tuning, image generation, or other specialized features.
          </p>
        </div>
      </div>
    </div>
  );
}
