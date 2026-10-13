import { AssistantState } from '../types/live';
import type { OrbState } from 'thinking-orbs';

export const ALL_ORB_STATES: { state: OrbState; label: string; description: string }[] = [
  { state: 'working', label: 'Working', description: 'Particles on tilted orbits' },
  { state: 'searching', label: 'Searching', description: 'A scan meridian sweeps a dotted globe' },
  { state: 'solving', label: 'Solving', description: 'Bands scramble in quarter turns, then click back' },
  { state: 'listening', label: 'Listening', description: 'A waveform rolls through latitude rings' },
  { state: 'connecting', label: 'Connecting', description: 'A constellation wires itself, packets running edges' },
  { state: 'weaving', label: 'Weaving', description: 'Three strands plait around the sphere' },
  { state: 'composing', label: 'Composing', description: 'An undulating multi-band sash' },
  { state: 'breathing', label: 'Breathing', description: 'A face-on ring slowly morphing' },
  { state: 'shaping', label: 'Shaping', description: 'A dotted outline morphs circle → triangle → square' },
];

export function mapAssistantStateToOrbState(
  assistantState: AssistantState,
  customThinkingState?: OrbState
): OrbState {
  switch (assistantState) {
    case 'disconnected':
      return 'breathing';
    case 'connecting':
      return 'connecting';
    case 'listening':
      return 'listening';
    case 'speaking':
      return 'composing';
    case 'thinking':
      return customThinkingState || 'searching';
    default:
      return 'working';
  }
}
