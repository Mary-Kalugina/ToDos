import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Tabs from './Tabs';
import '@testing-library/jest-dom';


test('renders tabs', () => {
  const { getByText } = render(<Tabs tab="ex1-tabs-1" toggler={() => {}} />);
  const allTab = getByText('All');
  const activeTab = getByText('Active');
  const completedTab = getByText('Completed');

  expect(allTab).toBeInTheDocument();
  expect(activeTab).toBeInTheDocument();
  expect(completedTab).toBeInTheDocument();
});

test('calls toggler function when tab is clicked', () => {
  const mockToggler = jest.fn();
  const { getByText } = render(<Tabs tab="ex1-tabs-1" toggler={mockToggler} />);
  const activeTab = getByText('Active');

  fireEvent.click(activeTab);

  expect(mockToggler).toHaveBeenCalledWith('ex1-tabs-2');
});
