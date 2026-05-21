import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  private reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-slate-900 text-lg font-bold mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-slate-500 text-sm mb-6 text-center">{this.state.message}</Text>
        <Button label="Try Again" onPress={this.reset} />
      </View>
    );
  }
}
