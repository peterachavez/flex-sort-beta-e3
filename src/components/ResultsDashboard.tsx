import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AssessmentData } from '../pages/Index';
import { PDFReportGenerator } from '../utils/pdfReportGenerator';

interface ResultsDashboardProps {
  data: AssessmentData;
  tier: string;
}

const ResultsDashboard = ({ data, tier }: ResultsDashboardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#149854] bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Improvement';
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  // Prepare chart data for Premium tier
  const getBlockPerformanceData = () => {
    const blocks = [];
    for (let i = 0; i < 6; i++) {
      const blockTrials = data.trials.slice(i * 6, (i + 1) * 6);
      const correct = blockTrials.filter(t => t.correct).length;
      const avgResponseTime = blockTrials.reduce((sum, t) => sum + t.response_time, 0) / blockTrials.length;
      
      blocks.push({
        block: `Block ${i + 1}`,
        accuracy: Math.round((correct / 6) * 100),
        responseTime: avgResponseTime.toFixed(1),
        rule: blockTrials[0]?.rule || 'unknown'
      });
    }
    return blocks;
  };

  const getResponseTimeData = () => {
    return data.trials.map((trial, index) => ({
      trial: index + 1,
      time: trial.response_time,
      correct: trial.correct
    }));
  };

  const exportToPDF = async () => {
    try {
      const pdfGenerator = new PDFReportGenerator();
      await pdfGenerator.generateReport(data);
      console.log('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('There was an error generating the PDF report. Please try again.');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        'Trial', 
        'Block', 
        'Rule', 
        'Correct', 
        'Response_Time', 
        'Perseverative', 
        'Trial_Type', 
        'Timestamp',
        'Adaptation_Latency',
        'Initial_Rule_Discovery_Latency',
        'Rule_Switch',
        'Consecutive_Errors',
        'Trial_In_Block',
        'Rule_Block_Number'
      ].join(','),
      ...data.trials.map((trial, index) => [
        trial.trial_number,
        Math.floor(index / 6) + 1,
        trial.rule,
        trial.correct,
        trial.response_time.toFixed(3),
        trial.perseverative,
        trial.trial_type,
        new Date(trial.timestamp).toISOString(),
        trial.adaptation_latency !== null ? trial.adaptation_latency : '',
        trial.initial_rule_discovery_latency !== null ? trial.initial_rule_discovery_latency : '',
        trial.rule_switch,
        trial.consecutive_errors,
        trial.trial_in_block,
        trial.rule_block_number
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flex-sort-raw-data.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/3a639b59-bc2c-49e1-a324-b12c5b95da35.png" 
            alt="Cogello"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">
            Flex Sort Report
          </h1>
          <p className="text-gray-600">
            Generated on {new Date(data.completed_at).toLocaleDateString()}
          </p>
          <div className="flex justify-center mt-2">
            <Badge variant={tier === 'premium' ? 'default' : 'secondary'} className="capitalize">
              {tier} Report
            </Badge>
          </div>
        </div>

        {/* Overview Cards with enhanced styling */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow duration-200 ${getScoreColor(data.cognitive_flexibility_score)}`}>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold mb-2">
                {data.cognitive_flexibility_score}
              </div>
              <div className="text-sm font-medium mb-1">
                Flexibility Score
              </div>
              <div className="text-xs">
                {getScoreLabel(data.cognitive_flexibility_score)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-[#149854] mb-2">
                {data.shifts_achieved}
              </div>
              <div className="text-sm font-medium mb-1">
                Rule Adaptations
              </div>
              <div className="text-xs text-gray-500">
                out of 5 possible
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {data.perseverative_errors}
              </div>
              <div className="text-sm font-medium mb-1">
                Perseverative Errors
              </div>
              <div className="text-xs text-gray-500">
                rule-switching errors
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {formatTime(data.avg_response_time)}
              </div>
              <div className="text-sm font-medium mb-1">
                Avg Response Time
              </div>
              <div className="text-xs text-gray-500">
                decision speed
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics for Standard and Premium with enhanced styling */}
        {tier !== 'basic' && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Cognitive Flexibility</span>
                    <span className="text-sm text-gray-600 font-semibold">{data.cognitive_flexibility_score}%</span>
                  </div>
                  <Progress value={data.cognitive_flexibility_score} className="h-3 bg-gray-200">
                    <div 
                      className="h-full bg-[#149854] transition-all duration-500 rounded-full" 
                      style={{ width: `${data.cognitive_flexibility_score}%` }}
                    />
                  </Progress>
                </div>
                
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Rule Adaptation</span>
                    <span className="text-sm text-gray-600 font-semibold">{Math.round((data.shifts_achieved / 5) * 100)}%</span>
                  </div>
                  <Progress value={(data.shifts_achieved / 5) * 100} className="h-3 bg-gray-200">
                    <div 
                      className="h-full bg-[#149854] transition-all duration-500 rounded-full" 
                      style={{ width: `${(data.shifts_achieved / 5) * 100}%` }}
                    />
                  </Progress>
                </div>
                
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Error Control</span>
                    <span className="text-sm text-gray-600 font-semibold">{Math.max(0, 100 - (data.perseverative_errors * 15))}%</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (data.perseverative_errors * 15))} className="h-3 bg-gray-200">
                    <div 
                      className="h-full bg-[#149854] transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.max(0, 100 - (data.perseverative_errors * 15))}%` }}
                    />
                  </Progress>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Adaptive Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Guided Mode</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      data.guided_mode_triggered 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {data.guided_mode_triggered ? 'Activated' : 'Not Needed'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Rule Training</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      data.rule_training_triggered 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {data.rule_training_triggered ? 'Required' : 'Not Needed'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Adaptation Latency</span>
                    <span className="text-sm text-gray-600">
                      {data.adaptation_latency} trials
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Accuracy</span>
                    <span className="text-sm text-gray-600">
                      {Math.round((data.trials.filter(t => t.correct).length / data.trials.length) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Premium Charts with Cogello green styling */}
        {tier === 'premium' && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Block Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getBlockPerformanceData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="block" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #149854',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Bar dataKey="accuracy" fill="#149854" name="Accuracy %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getResponseTimeData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="trial" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #149854',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="time" 
                      stroke="#149854" 
                      strokeWidth={3}
                      dot={{ fill: '#149854', strokeWidth: 2, r: 4 }}
                      name="Response Time (s)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced AI Summary */}
        {tier === 'standard' || tier === 'premium' ? (
          <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">AI-Generated Interpretation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Executive Summary:</strong> Your performance on the Flex Sort assessment demonstrates{' '}
                  <strong>{getScoreLabel(data.cognitive_flexibility_score).toLowerCase()}</strong> cognitive flexibility. 
                  You successfully achieved {data.shifts_achieved} out of 5 possible rule adaptations, indicating{' '}
                  {data.shifts_achieved >= 4 ? 'excellent' : data.shifts_achieved >= 3 ? 'good' : 'developing'} ability 
                  to adapt to changing task demands.
                </p>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Detailed Analysis:</strong> With {data.perseverative_errors} perseverative errors, your performance suggests{' '}
                  {data.perseverative_errors <= 2 ? 'strong inhibitory control and flexible thinking' : 
                   data.perseverative_errors <= 5 ? 'moderate difficulty with rule switching but overall adequate flexibility' :
                   'significant challenges in cognitive flexibility requiring attention'}. 
                  Your average response time of {formatTime(data.avg_response_time)} indicates{' '}
                  {data.avg_response_time <= 2.0 ? 'efficient and confident decision-making' :
                   data.avg_response_time <= 3.0 ? 'typical processing speed with adequate deliberation' :
                   'careful, methodical responding that prioritizes accuracy'}.
                </p>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Cognitive Insights:</strong> {
                    data.guided_mode_triggered 
                      ? 'The adaptive system activated guided mode to provide additional support, suggesting some difficulty with rapid rule switching. This is valuable information for understanding your cognitive processing style.'
                      : 'You demonstrated consistent performance without requiring adaptive support, indicating strong self-regulation and flexible thinking skills.'
                  }
                  {data.rule_training_triggered && ' Rule training was triggered, indicating significant difficulty with implicit rule learning that may benefit from explicit instruction.'}
                </p>

                {tier === 'premium' && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 mb-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Clinical Implications</h4>
                      <p className="text-blue-700 text-sm mb-2">
                        These results may inform clinical decision-making regarding executive function, 
                        cognitive flexibility, and adaptive reasoning abilities. Performance patterns suggest:
                      </p>
                      <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
                        <li>
                          {data.cognitive_flexibility_score >= 80 
                            ? 'Strong executive functioning with minimal intervention needs'
                            : data.cognitive_flexibility_score >= 60
                            ? 'Moderate executive functioning that may benefit from targeted strategies'
                            : 'Executive functioning challenges that may require comprehensive intervention'}
                        </li>
                        <li>
                          {data.perseverative_errors <= 2
                            ? 'Excellent inhibitory control and cognitive flexibility'
                            : 'Consider strategies to improve cognitive flexibility and reduce perseverative responding'}
                        </li>
                        <li>
                          Processing speed appears {data.avg_response_time <= 2.5 ? 'optimal' : 'deliberate'} with no significant concerns
                        </li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-amber-800 mb-2">Legal/Educational Summary</h4>
                      <p className="text-amber-700 text-sm">
                        <strong>For Educational/Legal Purposes:</strong> This assessment provides objective measures of cognitive flexibility 
                        that may be relevant for educational accommodations, workplace adaptations, or legal considerations. 
                        The {getScoreLabel(data.cognitive_flexibility_score).toLowerCase()} performance suggests{' '}
                        {data.cognitive_flexibility_score >= 70 
                          ? 'typical cognitive flexibility abilities with standard expectations appropriate.'
                          : 'potential need for accommodations or modifications to support optimal performance in demanding cognitive tasks.'
                        } Results should be interpreted by qualified professionals in conjunction with other assessment data and clinical observations.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Export Options for Premium with enhanced styling */}
        {tier === 'premium' && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Professional Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={exportToPDF} 
                  className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Export Comprehensive Report (PDF)
                </Button>
                <Button 
                  onClick={exportToCSV} 
                  variant="outline"
                  className="border-[#149854] text-[#149854] hover:bg-[#149854]/10 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Download Raw Data (CSV)
                </Button>
                <Button 
                  variant="outline" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Professional Formatting
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Professional reports include clinical interpretations, legal summaries, and detailed performance analytics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsDashboard;
