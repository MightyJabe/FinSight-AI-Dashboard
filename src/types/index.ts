/**
 * Centralized type exports for the FinSight AI Dashboard application
 */

// Core financial types
export * from './finance';

// Platform and investment types
export * from './platform';

// Cryptocurrency types
export * from './crypto';

// Re-export commonly used types with cleaner names
export type { NextRequest, NextResponse } from 'next/server';
