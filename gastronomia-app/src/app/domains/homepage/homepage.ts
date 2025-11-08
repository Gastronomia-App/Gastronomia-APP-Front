import { Component, OnInit, signal, inject, DestroyRef, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { Validators } from '@angular/forms';
import { Form } from '../../shared/components/form/form';
import { FormConfig, FormSubmitEvent } from '../../shared/models';
import { BusinessRegistrationRequest } from '../../shared/models/business.model';
import { Footer } from "../../shared/components/footer/footer";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [RouterModule, CommonModule, Form, Footer], 
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css'],
})
export class HomePage implements OnInit, AfterViewInit {
  private destroyRef = inject(DestroyRef);
  private elementRef = inject(ElementRef);

  images = [
    '/assets/images/food-carousel-1.png',
    '/assets/images/food-carousel-2.png',
    '/assets/images/food-carousel-3.png',
    '/assets/images/food-carousel-4.png',
    '/assets/images/food-carousel-5.png',
  ];

  currentImage = signal(0);
  isScrolled = signal(false);

  features: Feature[] = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13 .5c0-.276-.226-.506-.498-.465-1.703.257-2.94 2.012-3 8.462a.5.5 0 0 0 .498.5c.56.01 1 .13 1 1.003v5.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5zM4.25 0a.25.25 0 0 1 .25.25v5.122a.128.128 0 0 0 .256.006l.233-5.14A.25.25 0 0 1 5.24 0h.522a.25.25 0 0 1 .25.238l.233 5.14a.128.128 0 0 0 .256-.006V.25A.25.25 0 0 1 6.75 0h.29a.5.5 0 0 1 .498.458l.423 5.07a1.69 1.69 0 0 1-1.059 1.711l-.053.022a.92.92 0 0 0-.58.884L6.47 15a.971.971 0 1 1-1.942 0l.202-6.855a.92.92 0 0 0-.58-.884l-.053-.022a1.69 1.69 0 0 1-1.059-1.712L3.462.458A.5.5 0 0 1 3.96 0z"/>
      </svg>`,
      title: 'Gestión de Mesas',
      description: 'Administrá el estado de tus mesas en tiempo real y optimizá la rotación.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5M11.5 4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
        <path d="M2.354.646a.5.5 0 0 0-.801.13l-.5 1A.5.5 0 0 0 1 2v13H.5a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H15V2a.5.5 0 0 0-.053-.224l-.5-1a.5.5 0 0 0-.8-.13L13 1.293l-.646-.647a.5.5 0 0 0-.708 0L11 1.293l-.646-.647a.5.5 0 0 0-.708 0L9 1.293 8.354.646a.5.5 0 0 0-.708 0L7 1.293 6.354.646a.5.5 0 0 0-.708 0L5 1.293 4.354.646a.5.5 0 0 0-.708 0L3 1.293zm-.217 1.198.51.51a.5.5 0 0 0 .707 0L4 1.707l.646.647a.5.5 0 0 0 .708 0L6 1.707l.646.647a.5.5 0 0 0 .708 0L8 1.707l.646.647a.5.5 0 0 0 .708 0L10 1.707l.646.647a.5.5 0 0 0 .708 0L12 1.707l.646.647a.5.5 0 0 0 .708 0l.509-.51.137.274V15H2V2.118z"/>
      </svg>`,
      title: 'Pedidos y Ventas',
      description: 'Registrá ventas rápidamente y llevá un control detallado de cada transacción.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
        <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
        <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/>
      </svg>`,
      title: 'Inventario',
      description: 'Controlá tu stock en tiempo real y recibí alertas de productos bajos.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
      </svg>`,
      title: 'Empleados',
      description: 'Gestioná perfiles, horarios y permisos de tu equipo de trabajo.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"/>
      </svg>`,
      title: 'Gastos',
      description: 'Llevá un registro preciso de todos tus gastos y proveedores.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
        <path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
      </svg>`,
      title: 'Clientes',
      description: 'Administrá tu base de clientes y fidelizá a tus comensales.'
    },
  ];

  benefits: Benefit[] = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
      </svg>`,
      title: 'Simple y Moderno',
      description: 'Interfaz intuitiva y fácil de usar, sin curva de aprendizaje.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
        <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686"/>
      </svg>`,
      title: 'Control de Acceso',
      description: 'Roles y permisos personalizados para cada miembro del equipo.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H6a.5.5 0 0 0-.5.5M5 5a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
      </svg>`,
      title: 'Reportes en Tiempo Real',
      description: 'Visualizá estadísticas y métricas clave de tu negocio al instante.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484q-.121.12-.242.234c-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 0 2.04 4.327Z"/>
      </svg>`,
      title: 'Actualizado Siempre',
      description: 'Mejoras y nuevas funcionalidades de forma automática.'
    },
  ];

  // Form configuration for business registration
  businessFormConfig: FormConfig<BusinessRegistrationRequest> = {
    title: 'Registrá tu Negocio',
    sections: [
      {
        title: 'Datos del Negocio',
        fields: [
          {
            name: 'name',
            label: 'Nombre del Negocio',
            type: 'text',
            placeholder: 'Ej: Restaurante El Buen Sabor',
            required: true,
            validators: [Validators.required, Validators.minLength(3)],
            fullWidth: true
          },
          {
            name: 'email',
            label: 'Email del Negocio',
            type: 'email',
            placeholder: 'contacto@negocio.com',
            required: true,
            validators: [Validators.required, Validators.email],
            fullWidth: false
          },
          {
            name: 'phoneNumber',
            label: 'Teléfono',
            type: 'text',
            placeholder: '+54 11 1234-5678',
            required: true,
            validators: [Validators.required],
            fullWidth: false
          },
          {
            name: 'address',
            label: 'Dirección',
            type: 'text',
            placeholder: 'Calle 123, Ciudad',
            required: true,
            validators: [Validators.required],
            fullWidth: true
          },
          {
            name: 'description',
            label: 'Descripción (opcional)',
            type: 'textarea',
            placeholder: 'Breve descripción de tu negocio',
            required: false,
            rows: 3,
            maxLength: 300,
            fullWidth: true
          }
        ]
      },
      {
        title: 'Datos del Propietario',
        fields: [
          {
            name: 'ownerName',
            label: 'Nombre',
            type: 'text',
            placeholder: 'Juan',
            required: true,
            validators: [Validators.required],
            fullWidth: false
          },
          {
            name: 'ownerLastName',
            label: 'Apellido',
            type: 'text',
            placeholder: 'Pérez',
            required: true,
            validators: [Validators.required],
            fullWidth: false
          },
          {
            name: 'ownerEmail',
            label: 'Email Personal',
            type: 'email',
            placeholder: 'juan@email.com',
            required: true,
            validators: [Validators.required, Validators.email],
            fullWidth: false
          },
          {
            name: 'ownerPhone',
            label: 'Teléfono Personal',
            type: 'text',
            placeholder: '+54 11 9876-5432',
            required: true,
            validators: [Validators.required],
            fullWidth: false
          },
          {
            name: 'ownerUsername',
            label: 'Usuario',
            type: 'text',
            placeholder: 'juanperez',
            required: true,
            validators: [Validators.required, Validators.minLength(4)],
            fullWidth: false,
            helpText: 'Mínimo 4 caracteres'
          },
          {
            name: 'ownerPassword',
            label: 'Contraseña',
            type: 'password',
            placeholder: '••••••••',
            required: true,
            validators: [Validators.required, Validators.minLength(6)],
            fullWidth: false,
            helpText: 'Mínimo 6 caracteres'
          }
        ]
      }
    ]
  };

  ngOnInit() {
    // Forzar scroll al inicio al cargar la página
    window.scrollTo(0, 0);
    
    // También intentar en el contenedor main si existe
    setTimeout(() => {
      const mainElement = document.querySelector('main.homepage-main');
      if (mainElement) {
        mainElement.scrollTop = 0;
      }
    }, 0);

    // Carousel auto-rotation
    interval(4000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentImage.update(current => (current + 1) % this.images.length);
      });
  }

  ngAfterViewInit() {
    // Forzar scroll al inicio después de que la vista esté lista
    setTimeout(() => {
      const mainElement = this.elementRef.nativeElement.closest('main');
      if (mainElement) {
        mainElement.scrollTop = 0;
        
        // Establecer listener para el scroll del contenedor main
        mainElement.addEventListener('scroll', () => {
          const scrollTop = mainElement.scrollTop;
          this.isScrolled.set(scrollTop > 50);
        });
      }
      
      // También forzar en window como fallback
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 100);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Detectar scroll en window como fallback
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    this.isScrolled.set(scrollY > 50);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      // Scroll directo al elemento con comportamiento suave
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  onBusinessRegister(event: FormSubmitEvent<BusinessRegistrationRequest>): void {
    console.log('Business registration data:', event.data);
    // TODO: Implementar llamada al servicio para registrar el negocio
    alert('¡Registro exitoso! Por favor revisa tu email para confirmar tu cuenta.');
  }

  onFormCancel(): void {
    console.log('Form cancelled/cleared');
  }
}
