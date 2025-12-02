import { useCallback } from 'react';
import type { Agent } from '@shared/types';

/**
 * AgentList Props following design.md interface
 */
interface AgentListProps {
  agents: Agent[];
  currentAgentId: string | null;
  onSelectAgent: (agent: Agent) => void;
  onSettings: (agent: Agent) => void;
  onCreateAgent?: () => void;
  isLoading?: boolean;
}

/**
 * AgentList - Component for displaying and selecting agents in the current project
 *
 * Features:
 * - Lists all agents for current project
 * - Highlights currently selected agent
 * - Settings icon button on each row (does not trigger agent selection)
 * - "Create Agent" button at the bottom
 * - Touch-friendly 44px minimum row height
 * - Handles empty state gracefully
 *
 * Requirements: REQ-3 (Agent Management)
 *
 * Reference: clipendra-repo ChatListPanel pattern
 *
 * @param agents - Array of agents for the current project
 * @param currentAgentId - ID of the currently selected agent (null if none)
 * @param onSelectAgent - Callback when an agent is selected
 * @param onSettings - Callback when settings icon is clicked
 * @param onCreateAgent - Callback when "Create Agent" button is clicked
 * @param isLoading - Show loading state while fetching agents
 */
export function AgentList({
  agents,
  currentAgentId,
  onSelectAgent,
  onSettings,
  onCreateAgent,
  isLoading = false,
}: AgentListProps) {
  /**
   * Handle agent row click - selects the agent
   */
  const handleAgentClick = useCallback(
    (agent: Agent) => {
      onSelectAgent(agent);
    },
    [onSelectAgent]
  );

  /**
   * Handle settings icon click - opens settings without selecting agent
   * Uses stopPropagation to prevent triggering agent selection
   */
  const handleSettingsClick = useCallback(
    (event: React.MouseEvent, agent: Agent) => {
      event.stopPropagation();
      onSettings(agent);
    },
    [onSettings]
  );

  /**
   * Get the initials for an agent's avatar
   */
  const getAgentInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  /**
   * Get avatar background color based on agent name
   * Uses a simple hash to assign consistent colors
   */
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
    ];

    // Simple hash based on first character
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  /**
   * Check if there are any agents to display
   */
  const hasAgents = agents.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Agents
        </h2>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <svg
              className="w-6 h-6 text-gray-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasAgents && (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-12 h-12 mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 text-center mb-1">
              No agents yet
            </p>
            <p className="text-xs text-gray-400 text-center">
              Create an agent to get started
            </p>
          </div>
        )}

        {/* Agent Items */}
        {!isLoading && hasAgents && (
          <ul className="py-1">
            {agents.map((agent) => {
              const isSelected = agent.id === currentAgentId;
              const avatarColor = getAvatarColor(agent.name);

              return (
                <li key={agent.id}>
                  <button
                    onClick={() => handleAgentClick(agent)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 transition-colors
                      min-h-[44px]
                      ${isSelected
                        ? 'bg-primary-50 hover:bg-primary-100'
                        : 'hover:bg-gray-50'
                      }
                    `}
                    aria-selected={isSelected}
                    role="option"
                  >
                    {/* Avatar */}
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-primary-500' : avatarColor}
                      `}
                    >
                      <span className="text-sm font-medium text-white">
                        {getAgentInitial(agent.name)}
                      </span>
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className={`font-medium truncate ${
                          isSelected ? 'text-primary-700' : 'text-gray-900'
                        }`}
                      >
                        {agent.name}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isSelected ? 'text-primary-500' : 'text-gray-500'
                        }`}
                      >
                        {agent.session_id ? 'Active session' : 'No active session'}
                      </p>
                    </div>

                    {/* Settings Button */}
                    <button
                      onClick={(e) => handleSettingsClick(e, agent)}
                      className={`
                        p-2 rounded-lg transition-colors flex-shrink-0
                        min-w-[44px] min-h-[44px] flex items-center justify-center
                        ${isSelected
                          ? 'hover:bg-primary-200 text-primary-600'
                          : 'hover:bg-gray-200 text-gray-500'
                        }
                      `}
                      aria-label={`Settings for ${agent.name}`}
                      title={`Settings for ${agent.name}`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create Agent Button */}
      {onCreateAgent && (
        <div className="flex-shrink-0 border-t border-gray-200 p-3">
          <button
            onClick={onCreateAgent}
            disabled={isLoading}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2
              bg-primary-500 hover:bg-primary-600 text-white font-medium
              rounded-lg transition-colors min-h-[44px]
              ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {/* Plus Icon */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Create Agent</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AgentList;
