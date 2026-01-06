import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface OnboardingChecklistProps {
  onClose?: () => void;
  onNavigate?: (tab: string) => void;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ onClose, onNavigate }) => {
  const { auth } = useAuth();
  const [isHidden, setIsHidden] = useState(false);

  // Check if onboarding was already completed
  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (completed === 'true') {
      setIsHidden(true);
    }
  }, []);

  // Calculate checklist completion
  const tasks = [
    {
      id: 'account',
      title: 'Create Account',
      description: 'Sign up and verify your email',
      completed: true, // Always true if user is logged in
      action: null,
    },
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Add your contact information',
      completed: !!(
        auth.user?.profile?.phoneNumber &&
        auth.user?.profile?.address?.city &&
        auth.user?.profile?.address?.state
      ),
      action: () => onNavigate?.('profile'),
      actionText: 'Complete Profile',
    },
    {
      id: 'verification',
      title: 'Verify Identity',
      description: 'Submit documents for verification',
      completed: auth.user?.verificationStatus === 'VERIFIED' || auth.user?.verificationStatus === 'PENDING',
      action: () => onNavigate?.('verification'),
      actionText: auth.user?.verificationStatus === 'PENDING' ? 'Pending Review' : 'Verify Now',
      disabled: auth.user?.verificationStatus === 'PENDING',
    },
    {
      id: '2fa',
      title: 'Enable 2FA (Optional)',
      description: 'Add extra security to your account',
      completed: auth.user?.twoFactorEnabled || false,
      action: () => onNavigate?.('two-factor'),
      actionText: 'Enable 2FA',
      optional: true,
    },
  ];

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // Save completion state when all tasks are done
  useEffect(() => {
    if (progress === 100 && !isHidden) {
      // Wait a moment to show the success message before hiding
      const timer = setTimeout(() => {
        localStorage.setItem('onboarding_completed', 'true');
        setIsHidden(true);
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [progress, isHidden]);

  // Don't render if onboarding is completed
  if (isHidden) {
    return null;
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#012970] flex items-center gap-2">
            Getting Started
            <span className="text-sm font-normal text-[#4154f1]">
              {completedTasks}/{totalTasks} Complete
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Complete these steps to unlock all features
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close checklist"
          >
            ×
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4154f1] to-[#3346d8] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${task.completed
                ? 'bg-blue-50 border border-blue-100'
                : 'bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200 shadow-sm'
              }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {task.completed ? (
                <CheckCircle className="h-5 w-5 text-[#4154f1]" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-medium ${task.completed ? 'text-[#4154f1]' : 'text-gray-900'}`}>
                  {task.title}
                  {task.optional && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>
                  )}
                </h4>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
            </div>
            {!task.completed && task.action && (
              <button
                onClick={task.action}
                disabled={task.disabled}
                className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${task.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-[#4154f1] hover:bg-blue-200'
                  }`}
              >
                {task.actionText}
                {!task.disabled && <ArrowRight className="h-3 w-3" />}
              </button>
            )}
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-[#4154f1] font-medium">
            🎉 All set! You're ready to explore the marketplace and start transacting.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
