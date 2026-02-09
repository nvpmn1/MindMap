// ============================================================================
// Smart Connection Mode - Intuitive Linking System
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ConnectionModeState {
  isActive: boolean;
  sourceNodeId: string | null;
  sourceHandle: string | null;
  targetNodeId: string | null;
}

interface ConnectionModeContextType {
  state: ConnectionModeState;
  startConnection: (nodeId: string, handlePosition: string) => void;
  setTargetNode: (nodeId: string | null) => void;
  confirmConnection: () => void;
  cancelConnection: () => void;
  isLinking: boolean;
}

const ConnectionModeContext = createContext<ConnectionModeContextType | null>(null);

export const ConnectionModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConnectionModeState>({
    isActive: false,
    sourceNodeId: null,
    sourceHandle: null,
    targetNodeId: null,
  });

  const startConnection = useCallback((nodeId: string, handlePosition: string) => {
    setState({
      isActive: true,
      sourceNodeId: nodeId,
      sourceHandle: handlePosition,
      targetNodeId: null,
    });
  }, []);

  const setTargetNode = useCallback((nodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      targetNodeId: nodeId,
    }));
  }, []);

  const confirmConnection = useCallback(() => {
    // This will be handled by the editor component
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const cancelConnection = useCallback(() => {
    setState({
      isActive: false,
      sourceNodeId: null,
      sourceHandle: null,
      targetNodeId: null,
    });
  }, []);

  return (
    <ConnectionModeContext.Provider
      value={{
        state,
        startConnection,
        setTargetNode,
        confirmConnection,
        cancelConnection,
        isLinking: state.isActive,
      }}
    >
      {children}
    </ConnectionModeContext.Provider>
  );
};

export const useConnectionMode = () => {
  const ctx = useContext(ConnectionModeContext);
  if (!ctx) {
    throw new Error('useConnectionMode must be used within ConnectionModeProvider');
  }
  return ctx;
};
