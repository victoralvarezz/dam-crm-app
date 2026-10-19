import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton
} from '@ionic/angular';

import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton
  ]
})
export class LoginPage {

  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  public cargando = signal(false);
  public errorMensaje = signal('');

  public loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public async iniciarSesion(): Promise<void> {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set('');

    try {
      const datos = this.loginForm.getRawValue();

      await this.supabase.login(datos.email, datos.password);

      // Entrar en la página principal
      await this.router.navigateByUrl('/home', {
        replaceUrl: true
      });

    } catch (error) {
      this.errorMensaje.set(
        'No se ha podido iniciar sesión. Comprueba tus datos.'
      );
      console.error('Error de autenticación');
    } finally {
      this.cargando.set(false);
    }
  }
}

