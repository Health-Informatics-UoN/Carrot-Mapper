import React from '../../_snowpack/pkg/react.js';

import ToastAlert from '../components/ToastAlert.js';

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


