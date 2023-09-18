import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToDos from './ToDos';
import '@testing-library/jest-dom';

describe('Todos Component', () => {
  const addTask = (taskText: string) => {
    const inputField = screen.getByLabelText('What needs to be done?');
    fireEvent.change(inputField, { target: { value: taskText } });
    fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' });
  };

  const toggleTask = (taskId: string) => {
    const checkbox = screen.getByLabelText('...' + taskId);
    if (checkbox) {
      fireEvent.click(checkbox);
    }
  };

  beforeEach(() => {
    render(<ToDos />);
  });

  it('renders todos correctly', () => {
    expect(screen.getByText('todos')).toBeInTheDocument();

    expect(screen.getByLabelText('What needs to be done?')).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('active');

    expect(screen.getByText('Сделать покупки')).toBeInTheDocument();
    expect(screen.getByText('Прочитать книгу')).toBeInTheDocument();
  });

  it('allows adding a new task', () => {
    addTask('New Task');

    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('allows toggling a task', () => {
    toggleTask('2gh');

    expect(screen.getByText('Сделать покупки')).toHaveStyle({ textDecoration: 'line-through' });
  });

  it('allows clearing completed tasks', () => {
    toggleTask('2gh'); 

    const clearButton = screen.getByText('Clear completed');
    fireEvent.click(clearButton);

    expect(screen.queryByText('Сделать покупки')).not.toBeInTheDocument();
  });

  it('displays the correct number of items left', () => {
    expect(screen.getByText(/(\d+) items? left/)).toHaveTextContent('1 item left');

    toggleTask('2gh'); 
    expect(screen.getByText(/(\d+) items? left/)).toHaveTextContent('0 item left');
  });

  it('allows filtering tasks by tabs', async () => {
    const activeTab = screen.getByRole('tab', { name: 'Active' });
    fireEvent.click(activeTab);

    await waitFor(() => {
      expect(screen.queryByText('Прочитать книгу')).not.toBeInTheDocument();
    });

    expect(activeTab).toHaveClass('active');
    expect(screen.queryByText('Сделать покупки')).toBeInTheDocument();
    expect(screen.queryByText('Прочитать книгу')).not.toBeInTheDocument();

    const completedTab = screen.getByRole('tab', { name: 'Completed' });
    fireEvent.click(completedTab);

    expect(completedTab).toHaveClass('active');
    expect(screen.queryByText('Сделать покупки')).not.toBeInTheDocument();
    expect(screen.queryByText('Прочитать книгу')).toBeInTheDocument();
  });
});
