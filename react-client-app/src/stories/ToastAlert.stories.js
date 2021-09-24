import React from 'react';

import ToastAlert from '../components/ToastAlert';

export default {
  title: 'Components/ToastAlert',
  component: ToastAlert,
  argTypes: {
    status: {
      options: ['error', 'success', 'warning', 'info'],
      control: {type: 'radio'}
    }
  }
};

export const Template = (args) => <ToastAlert {...args}/>;


