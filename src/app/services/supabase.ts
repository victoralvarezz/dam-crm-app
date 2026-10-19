
import { Injectable, signal } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  User
} from '@supabase/supabase-js';

import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  // Usuario conectado y su rol
  public currentUser = signal<User | null>(null);
  public userRole = signal<'admin' | 'user' | null>(null);

  constructor() {
    // Conectar con nuestro proyecto de Supabase
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // Recuperar la sesión al abrir la aplicación
    void this.initSession();

    // Detectar cambios de sesión
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);

      if (session?.user) {
        void this.loadRole(session.user.id);
      } else {
        this.userRole.set(null);
      }
    });
  }

  // Recuperar la sesión guardada
  public async initSession(): Promise<void> {
    const { data: { session } } =
      await this.supabase.auth.getSession();

    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadRole(session.user.id);
    }
  }

  // Iniciar sesión
  public async login(
    email: string,
    password: string
  ): Promise<void> {

    const { data, error } =
      await this.supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    if (data.user) {
      this.currentUser.set(data.user);
      await this.loadRole(data.user.id);
    }
  }

  // Obtener el rol del usuario
  private async loadRole(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (this.currentUser()?.id !== userId) {
      return;
    }

    if (error || !data) {
      this.userRole.set(null);
    } else {
      this.userRole.set(data.role);
    }
  }

  // Cerrar sesión
  public async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    this.currentUser.set(null);
    this.userRole.set(null);
  }

  // Obtener todos los clientes
  public async getClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  // Insertar un cliente
  public async createClient(client: Client): Promise<void> {
    const { error } = await this.supabase
      .from('clients')
      .insert([{
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email
      }]);

    if (error) {
      throw error;
    }
  }

  // Actualizar un cliente
  public async updateClient(
    id: string,
    client: Partial<Client>
  ): Promise<void> {

    const { error } = await this.supabase
      .from('clients')
      .update({
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  // Eliminar un cliente
  public async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
