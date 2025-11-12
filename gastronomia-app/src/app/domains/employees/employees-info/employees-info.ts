import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Business, Employee } from '../../../shared/models';
import { EmployeeService } from '../services/employee.service';
import { BusinessService } from '../../business/services';

@Component({
  selector: 'app-employees-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employees-info.html',
  styleUrl: './employees-info.css',
})
export class EmployeesInfo {
  readonly employee = signal<Employee | null>(null);
  readonly business = signal<Business | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor(
    private employeeService: EmployeeService,
    private businessService: BusinessService
  ) {
    this.loadData();
  }

  private loadData(): void {
    this.employeeService.getCurrentEmployee().subscribe({
      next: data => this.employee.set(data),
      error: err => {
        console.error('Error loading employee info', err);
        this.error.set('No se pudo cargar el perfil del empleado');
        this.loading.set(false);
      }
    });

    this.businessService.getMyBusiness().subscribe({
      next: data => {
        this.business.set(data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading business info', err);
        this.error.set('No se pudo cargar la información del negocio');
        this.loading.set(false);
      }
    });
  }

  // ---------- UI helpers ----------

  roleLabel(role?: string | null): string {
  if (!role) return '—';

  const r = String(role).toUpperCase();

  switch (r) {
    case 'OWNER':
      return 'Propietario';
    case 'ADMIN':
      return 'Administrador';
    case 'CASHIER':
      return 'Cajero';
    case 'WAITER':
      return 'Mozo';
    default:
      return '—';
  }
}


accessLevelNumber(): 1 | 2 | 3 | 4 {
  const r = String((this.employee() as any)?.role ?? '').toUpperCase();
  switch (r) {
    case 'OWNER':  return 4;
    case 'ADMIN':  return 3;
    case 'CASHIER':return 2;
    case 'WAITER': return 1;
    default:       return 1;
  }
}

// Clase CSS para colorear el badge del nivel
accessLevelClass(): 'level-1' | 'level-2' | 'level-3' | 'level-4' {
  return ('level-' + this.accessLevelNumber()) as any;
}

// Descripción debajo de “Nivel de acceso”
accessSubtitle(): string {
  const r = String((this.employee() as any)?.role ?? '').toUpperCase();
  switch (r) {
    case 'OWNER':
      return 'Acceso total. Administra todo el sistema y la configuración del negocio.';
    case 'ADMIN':
      return 'Acceso alto. Gestiona usuarios, productos, mesas y ventas.';
    case 'CASHIER':
      return 'Acceso medio. Factura, cobra y consulta ventas del día.';
    case 'WAITER':
      return 'Acceso básico. Toma pedidos y gestiona mesas asignadas.';
    default:
      return '—';
  }
}

  formatDate(d?: string | Date | null): string {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  fullName(): string {
    const e: any = this.employee();
    if (!e) return '—';
    const name = (e.name ?? e.fullName ?? '').toString().trim();
    const last = (e.lastName ?? '').toString().trim();
    const combined = [name, last].filter(Boolean).join(' ');
    return combined || '—';
  }

  email(): string {
    return (this.employee() as any)?.email ?? '—';
  }

  phone(): string {
    return (this.employee() as any)?.phoneNumber ?? '—';
  }

  businessName(): string {
    return (this.business() as any)?.name ?? '—';
  }

  businessAddress(): string {
    const a: any = (this.business() as any)?.address;
    if (!a) return '—';
    const street = [a.street, a.number].filter(Boolean).join(' ');
    const rest = [a.city, a.province, a.country].filter(Boolean).join(', ');
    const out = [street, rest].filter(Boolean).join(' – ');
    return out || '—';
  }

  accountStatus(): 'Activa' | 'Inactiva' | 'Pendiente' {
    const e: any = this.employee();
    if (e?.active === false) return 'Inactiva';
    if (String(e?.status ?? '').toLowerCase() === 'pending') return 'Pendiente';
    return 'Activa';
  }

  accessLevel(): string {
    return this.roleLabel((this.employee() as any)?.role);
  }
}
