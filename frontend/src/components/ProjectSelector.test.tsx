/**
 * ProjectSelector Component Tests
 *
 * Tests for the ProjectSelector component including:
 * - Project selection from dropdown
 * - New project creation flow
 * - Loading and error states
 * - Dropdown open/close behavior
 * - Keyboard navigation
 *
 * Requirements: REQ-2 (Project Management)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSelector } from './ProjectSelector';
import type { Project } from '@shared/types';

// Mock DirectoryBrowser component
vi.mock('./DirectoryBrowser', () => ({
  DirectoryBrowser: ({
    open,
    onClose,
    onSelect,
  }: {
    open: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="directory-browser-modal" role="dialog">
        <button onClick={onClose}>Close Browser</button>
        <button onClick={() => onSelect('/home/test/project')}>Select Directory</button>
      </div>
    );
  },
}));

// Sample projects for testing
const mockProjects: Project[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'project-one',
    working_directory: '/home/dev/project-one',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'project-two',
    working_directory: '/home/dev/project-two',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
  },
];

describe('ProjectSelector', () => {
  const defaultProps = {
    projects: mockProjects,
    currentProject: mockProjects[0],
    onSelect: vi.fn(),
    onCreateProject: vi.fn().mockResolvedValue(mockProjects[0]),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with current project name displayed', () => {
      render(<ProjectSelector {...defaultProps} />);

      expect(screen.getByText('project-one')).toBeInTheDocument();
    });

    it('renders "Select Project" when no current project', () => {
      render(<ProjectSelector {...defaultProps} currentProject={null} />);

      expect(screen.getByText('Select Project')).toBeInTheDocument();
    });

    it('renders "Loading..." when isLoading is true', () => {
      render(<ProjectSelector {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('has proper accessibility attributes on trigger button', () => {
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Dropdown Behavior', () => {
    it('opens dropdown when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ProjectSelector {...defaultProps} />
          <button>Outside</button>
        </div>
      );

      // Open dropdown
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByText('Outside'));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      // Open dropdown
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('does not open dropdown when loading', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} isLoading={true} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Project Selection', () => {
    it('displays all projects in dropdown', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      // Both projects should appear in the dropdown (project-one appears twice: trigger + dropdown)
      const projectOneElements = screen.getAllByText('project-one');
      expect(projectOneElements.length).toBeGreaterThanOrEqual(2); // trigger + dropdown
      expect(screen.getByText('project-two')).toBeInTheDocument();
    });

    it('calls onSelect when a project is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<ProjectSelector {...defaultProps} onSelect={onSelect} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      // Click on the second project
      const projectTwo = screen.getByRole('option', { name: /project-two/i });
      await user.click(projectTwo);

      expect(onSelect).toHaveBeenCalledWith(mockProjects[1]);
    });

    it('closes dropdown after selecting a project', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const projectTwo = screen.getByRole('option', { name: /project-two/i });
      await user.click(projectTwo);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('highlights currently selected project', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const selectedOption = screen.getByRole('option', { name: /project-one/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('shows project path in option', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByText('/home/dev/project-one')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no projects', async () => {
      const user = userEvent.setup();
      render(
        <ProjectSelector
          {...defaultProps}
          projects={[]}
          currentProject={null}
        />
      );

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    it('shows "Create a new project" hint in empty state', async () => {
      const user = userEvent.setup();
      render(
        <ProjectSelector
          {...defaultProps}
          projects={[]}
          currentProject={null}
        />
      );

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByText(/create a new project to get started/i)).toBeInTheDocument();
    });
  });

  describe('New Project Creation', () => {
    it('shows "New Project" button in dropdown', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('opens DirectoryBrowser when "New Project" is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      expect(screen.getByTestId('directory-browser-modal')).toBeInTheDocument();
    });

    it('calls onCreateProject when directory is selected', async () => {
      const user = userEvent.setup();
      const onCreateProject = vi.fn().mockResolvedValue(mockProjects[0]);
      render(<ProjectSelector {...defaultProps} onCreateProject={onCreateProject} />);

      // Open dropdown and click New Project
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Select directory from browser
      const selectButton = screen.getByText('Select Directory');
      await user.click(selectButton);

      await waitFor(() => {
        expect(onCreateProject).toHaveBeenCalledWith('/home/test/project');
      });
    });

    it('calls onSelect with new project after creation', async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: '3',
        user_id: 'user-1',
        name: 'new-project',
        working_directory: '/home/test/project',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const onCreateProject = vi.fn().mockResolvedValue(newProject);
      const onSelect = vi.fn();

      render(
        <ProjectSelector
          {...defaultProps}
          onCreateProject={onCreateProject}
          onSelect={onSelect}
        />
      );

      // Open dropdown and click New Project
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Select directory from browser
      const selectButton = screen.getByText('Select Directory');
      await user.click(selectButton);

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(newProject);
      });
    });

    it('shows error toast when project creation fails', async () => {
      const user = userEvent.setup();
      const onCreateProject = vi.fn().mockRejectedValue(new Error('Directory already registered'));

      render(<ProjectSelector {...defaultProps} onCreateProject={onCreateProject} />);

      // Open dropdown and click New Project
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Select directory from browser
      const selectButton = screen.getByText('Select Directory');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create project/i)).toBeInTheDocument();
      });
    });

    it('shows user-friendly message for duplicate path error', async () => {
      const user = userEvent.setup();
      const onCreateProject = vi.fn().mockRejectedValue(new Error('already registered'));

      render(<ProjectSelector {...defaultProps} onCreateProject={onCreateProject} />);

      // Open dropdown and click New Project
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Select directory from browser
      const selectButton = screen.getByText('Select Directory');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText(/this directory is already registered/i)).toBeInTheDocument();
      });
    });

    it('closes DirectoryBrowser when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      // Open dropdown and click New Project
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      expect(screen.getByTestId('directory-browser-modal')).toBeInTheDocument();

      // Close browser
      const closeButton = screen.getByText('Close Browser');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('directory-browser-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading Overlay', () => {
    it('shows loading overlay during project creation', async () => {
      const user = userEvent.setup();
      // Create a promise that won't resolve immediately
      let resolvePromise: (value: Project) => void;
      const onCreateProject = vi.fn().mockImplementation(
        () =>
          new Promise<Project>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<ProjectSelector {...defaultProps} onCreateProject={onCreateProject} />);

      // Open dropdown and click New Project
      const trigger = screen.getByRole('button', { name: /current project/i });
      await user.click(trigger);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Select directory from browser
      const selectButton = screen.getByText('Select Directory');
      await user.click(selectButton);

      // Should show loading overlay
      await waitFor(() => {
        expect(screen.getByText(/creating project/i)).toBeInTheDocument();
      });

      // Resolve the promise to complete the test
      resolvePromise!(mockProjects[0]);
    });
  });
});
