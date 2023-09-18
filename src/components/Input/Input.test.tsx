import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Input from './Input';
import '@testing-library/jest-dom';

test('should call the add function when Enter is pressed', () => {
  const addMock = jest.fn();
  const { getByLabelText } = render(<Input add={addMock} />);
  const input = getByLabelText('What needs to be done?');

  fireEvent.change(input, { target: { value: 'Test Task' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

  expect(addMock).toHaveBeenCalledWith('Test Task');
});
