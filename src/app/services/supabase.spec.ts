import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { SupabaseService } from './supabase';

describe('SupabaseService', () => {
  it('debe estar disponible', () => {
    TestBed.configureTestingModule({});
    expect(SupabaseService).toBeDefined();
  });
});
