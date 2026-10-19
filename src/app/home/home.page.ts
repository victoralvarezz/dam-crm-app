
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonInput,
  IonButton, IonList, IonLabel
} from '@ionic/angular';

import { SupabaseService } from '../services/supabase';
import { Client } from '../models/client.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonInput,
    IonButton, IonList, IonLabel
  ]
})
export class HomePage implements OnInit {

  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  public usuario = this.supabase.currentUser;
  public rol = this.supabase.userRole;

  public clientes: Client[] = [];
  public editandoId: string | null = null;
  public mensaje = '';

  public clientForm = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],
    empresa: ['', Validators.required],
    email: ['', [
      Validators.required,
      Validators.email
    ]]
  });

  // Comprobar el login al abrir la página
  public async ngOnInit(): Promise<void> {
    try {
      await this.supabase.initSession();

      if (!this.usuario()) {
        await this.router.navigateByUrl('/login');
        return;
      }

      await this.cargarClientes();
    } catch (error) {
      this.mensaje = 'Error al iniciar la página.';
    }
  }

  // READ: consultar clientes
  public async cargarClientes(): Promise<void> {
    try {
      this.clientes = await this.supabase.getClients();
    } catch (error) {
      this.mensaje = 'No se pudieron cargar los clientes.';
    }
  }

  // CREATE y UPDATE
  public async guardarCliente(): Promise<void> {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    if (!this.usuario()) {
      await this.router.navigateByUrl('/login');
      return;
    }

    if (this.rol() !== 'admin') {
      this.mensaje = 'No tienes permisos de administrador.';
      return;
    }

    try {
      const datos = this.clientForm.getRawValue();

      if (this.editandoId) {
        await this.supabase.updateClient(
          this.editandoId,
          datos
        );

        this.mensaje = 'Cliente actualizado correctamente.';
      } else {
        await this.supabase.createClient(datos);

        this.mensaje = 'Cliente añadido correctamente.';
      }

      this.cancelarEdicion();
      await this.cargarClientes();

    } catch (error) {
      this.mensaje = 'Error al guardar. Comprueba los datos y permisos.';
    }
  }

  // Preparar la edición
  public editarCliente(cliente: Client): void {
    if (!this.usuario() || this.rol() !== 'admin') {
      return;
    }

    this.editandoId = cliente.id ?? null;

    this.clientForm.patchValue({
      nombre: cliente.nombre,
      empresa: cliente.empresa,
      email: cliente.email
    });
  }

  // DELETE: eliminar cliente
  public async eliminarCliente(cliente: Client): Promise<void> {
    if (!cliente.id || !this.usuario() || this.rol() !== 'admin') {
      return;
    }

    if (!confirm('¿Quieres eliminar este cliente?')) {
      return;
    }

    try {
      await this.supabase.deleteClient(cliente.id);
      this.mensaje = 'Cliente eliminado correctamente.';
      await this.cargarClientes();
    } catch (error) {
      this.mensaje = 'No se pudo eliminar el cliente.';
    }
  }

  public cancelarEdicion(): void {
    this.editandoId = null;
    this.clientForm.reset();
  }

  // Cerrar sesión
  public async cerrarSesion(): Promise<void> {
    await this.supabase.logout();
    await this.router.navigateByUrl('/login', {
      replaceUrl: true
    });
  }
}
