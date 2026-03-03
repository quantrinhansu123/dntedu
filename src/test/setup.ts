import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.alert
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
