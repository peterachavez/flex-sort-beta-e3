import React, { useState } from 'react';
import WelcomeScreen from '../components/WelcomeScreen';
import ConsentScreen from '../components/ConsentScreen';
import InstructionsScreen from '../components/InstructionsScreen';
import DemoTrial from '../components/DemoTrial';
import PracticeTrials from '../components/PracticeTrials';
import FlexSortTask from '../components/FlexSortTask';
import PostAssessment from '../components/PostAssessment';
import PricingTiers from '../components/PricingTiers';
import ResultsDashboard from '../components/ResultsDashboard';

export type AppPhase = 
  | 'welcome' 
  | 'consent' 
  | 'instructions' 
  | 'demo' 
  | 'practice' 
  | 'flexsort' 
  | 'post-assessment' 
  | 'pricing' 
  | 'results';

export interface TrialData {
  trial_number: number;
  user_choice: string;
  correct: boolean;
  rule: 'color' | 'shape' | 'number';
  response_time: number;
  perseverative: boolean;
  adaptation_latency: number | null; // null for Block 1, number for Blocks 2-6
  trial_type: 'core' | 'buffer' | 'guided' | 'extended' | 'demo' | 'practice';
  timestamp: number;
  // New behavioral metrics
  initial_rule_discovery_latency: number | null; // Block 1 only
  rule_switch: boolean; // true if current trial follows a rule change
  consecutive_errors: number; // running error count
  trial_in_block: number; // 1-6 within current block
  rule_block_number: number; // 1-6
}

export interface AssessmentData {
  trials: TrialData[];
  cognitive_flexibility_score: number;
  shifts_achieved: number;
  perseverative_errors: number;
  adaptation_latency: number;
  avg_response_time: number;
  guided_mode_triggered: boolean;
  rule_training_triggered: boolean;
  completed_at: string;
}

const Index = () => {
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('welcome');
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    trials: [],
    cognitive_flexibility_score: 0,
    shifts_achieved: 0,
    perseverative_errors: 0,
    adaptation_latency: 0,
    avg_response_time: 0,
    guided_mode_triggered: false,
    rule_training_triggered: false,
    completed_at: ''
  });
  const [selectedTier, setSelectedTier] = useState<string>('');

  const handlePhaseTransition = (nextPhase: AppPhase) => {
    setCurrentPhase(nextPhase);
  };

  const handleAssessmentComplete = (data: AssessmentData) => {
    setAssessmentData(data);
    setCurrentPhase('post-assessment');
  };

  const handleTierSelection = (tier: string) => {
    setSelectedTier(tier);
    setCurrentPhase('results');
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return <WelcomeScreen onNext={() => handlePhaseTransition('consent')} />;
      case 'consent':
        return <ConsentScreen onNext={() => handlePhaseTransition('instructions')} />;
      case 'instructions':
        return <InstructionsScreen onNext={() => handlePhaseTransition('demo')} />;
      case 'demo':
        return <DemoTrial onNext={() => handlePhaseTransition('practice')} />;
      case 'practice':
        return <PracticeTrials onNext={() => handlePhaseTransition('flexsort')} />;
      case 'flexsort':
        return <FlexSortTask onComplete={handleAssessmentComplete} />;
      case 'post-assessment':
        return <PostAssessment onNext={() => handlePhaseTransition('pricing')} />;
      case 'pricing':
        return <PricingTiers onTierSelect={handleTierSelection} />;
      case 'results':
        return <ResultsDashboard data={assessmentData} tier={selectedTier} />;
      default:
        return <WelcomeScreen onNext={() => handlePhaseTransition('consent')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPhase()}
    </div>
  );
};

export default Index;
