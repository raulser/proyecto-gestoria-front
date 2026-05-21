import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideBuilding2,
  LucideCalendarDays,
  LucideCircleCheck,
  LucideDownload,
  LucideFileText,
  LucideFileUp,
  LucideLayoutDashboard,
  LucideLogOut,
  LucidePlus,
  LucideSearch,
  LucideSettings,
  LucideUpload,
  LucideUsers,
} from '@lucide/angular';

type View = 'dashboard' | 'clientes' | 'documentos' | 'subir' | 'configuracion';
type DocumentStatus = 'PENDIENTE' | 'RECIBIDO' | 'REVISADO' | 'RECHAZADO';
type ClientType = 'Autonomo' | 'Empresa';

interface Client {
  id: number;
  name: string;
  nif: string;
  email: string;
  phone: string;
  type: ClientType;
  active: boolean;
  advisor: string;
}

interface DocumentItem {
  id: number;
  clientId: number;
  type: string;
  year: number;
  quarter: string;
  month: string;
  fileName: string;
  status: DocumentStatus;
  comment: string;
  uploadedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message: string | null;
  success: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    LucideBuilding2,
    LucideCalendarDays,
    LucideCircleCheck,
    LucideDownload,
    LucideFileText,
    LucideFileUp,
    LucideLayoutDashboard,
    LucideLogOut,
    LucidePlus,
    LucideSearch,
    LucideSettings,
    LucideUpload,
    LucideUsers,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);
  readonly apiBaseUrl = 'http://localhost:30001';

  activeView: View = 'dashboard';
  activeQuarter = 'T2';
  selectedYear = 2026;
  searchTerm = '';
  apiStatus = 'Sin comprobar';

  readonly menuItems: Array<{ view: View; label: string; icon: string }> = [
    { view: 'dashboard', label: 'Panel', icon: 'dashboard' },
    { view: 'clientes', label: 'Clientes', icon: 'users' },
    { view: 'documentos', label: 'Documentos', icon: 'documents' },
    { view: 'subir', label: 'Subir', icon: 'upload' },
    { view: 'configuracion', label: 'Configuracion', icon: 'settings' },
  ];

  readonly quarters = ['T1', 'T2', 'T3', 'T4'];
  readonly documentTypes = ['Facturas emitidas', 'Facturas recibidas', 'Tickets', 'Nominas', 'Contratos', 'Otros'];

  clients: Client[] = [
    {
      id: 1,
      name: 'Cliente A Servicios',
      nif: 'B12884590',
      email: 'administracion@clientea.es',
      phone: '976 100 200',
      type: 'Empresa',
      active: true,
      advisor: 'Raul',
    },
    {
      id: 2,
      name: 'Ana Lopez Autonoma',
      nif: '25111222H',
      email: 'ana.lopez@gmail.com',
      phone: '620 334 441',
      type: 'Autonomo',
      active: true,
      advisor: 'Raul',
    },
    {
      id: 3,
      name: 'Talleres Norte SL',
      nif: 'B50999123',
      email: 'gestoria@talleresnorte.es',
      phone: '976 880 120',
      type: 'Empresa',
      active: true,
      advisor: 'Marta',
    },
    {
      id: 4,
      name: 'Inversiones Plaza',
      nif: 'B88112044',
      email: 'admin@plaza.es',
      phone: '911 223 700',
      type: 'Empresa',
      active: false,
      advisor: 'Raul',
    },
  ];

  documents: DocumentItem[] = [
    {
      id: 1,
      clientId: 1,
      type: 'Facturas recibidas',
      year: 2026,
      quarter: 'T1',
      month: 'Marzo',
      fileName: 'facturas_recibidas_marzo.zip',
      status: 'REVISADO',
      comment: 'Completo',
      uploadedAt: '2026-04-04',
    },
    {
      id: 2,
      clientId: 1,
      type: 'Tickets',
      year: 2026,
      quarter: 'T2',
      month: 'Abril',
      fileName: 'tickets_abril.pdf',
      status: 'RECIBIDO',
      comment: 'Faltan tickets de combustible',
      uploadedAt: '2026-05-08',
    },
    {
      id: 3,
      clientId: 2,
      type: 'Facturas emitidas',
      year: 2026,
      quarter: 'T2',
      month: 'Abril',
      fileName: 'emitidas_abril.xlsx',
      status: 'PENDIENTE',
      comment: 'Recordatorio enviado',
      uploadedAt: '2026-05-01',
    },
    {
      id: 4,
      clientId: 3,
      type: 'Contratos',
      year: 2026,
      quarter: 'T2',
      month: 'Mayo',
      fileName: 'contrato_nuevo_empleado.pdf',
      status: 'RECHAZADO',
      comment: 'Falta firma',
      uploadedAt: '2026-05-13',
    },
  ];

  newClient = {
    name: '',
    nif: '',
    email: '',
    phone: '',
    type: 'Empresa' as ClientType,
  };

  uploadForm = {
    clientId: 1,
    type: 'Facturas recibidas',
    year: 2026,
    quarter: 'T2',
    month: 'Mayo',
    fileName: '',
  };

  filteredClients(): Client[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.clients;
    }

    return this.clients.filter((client) =>
      [client.name, client.nif, client.email, client.type, client.advisor].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }

  filteredDocuments(): DocumentItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.documents.filter((document) => {
      const client = this.clientName(document.clientId).toLowerCase();
      return (
        !term ||
        [document.type, document.fileName, document.status, document.comment, client].some((value) =>
          value.toLowerCase().includes(term),
        )
      );
    });
  }

  clientName(clientId: number): string {
    return this.clients.find((client) => client.id === Number(clientId))?.name ?? 'Sin cliente';
  }

  quarterStatus(clientId: number, quarter: string): DocumentStatus | 'SIN_DATOS' {
    const docs = this.documents.filter(
      (document) => document.clientId === clientId && document.quarter === quarter && document.year === this.selectedYear,
    );

    if (docs.length === 0) {
      return 'SIN_DATOS';
    }

    if (docs.some((document) => document.status === 'RECHAZADO')) {
      return 'RECHAZADO';
    }

    if (docs.every((document) => document.status === 'REVISADO')) {
      return 'REVISADO';
    }

    if (docs.some((document) => document.status === 'PENDIENTE')) {
      return 'PENDIENTE';
    }

    return 'RECIBIDO';
  }

  documentsForQuarter(): DocumentItem[] {
    return this.documents.filter((document) => document.year === this.selectedYear && document.quarter === this.activeQuarter);
  }

  completionPercent(): number {
    const possible = this.clients.filter((client) => client.active).length * this.quarters.length;
    const reviewed = this.clients
      .filter((client) => client.active)
      .flatMap((client) => this.quarters.map((quarter) => this.quarterStatus(client.id, quarter)))
      .filter((status) => status === 'REVISADO').length;

    return Math.round((reviewed / possible) * 100);
  }

  pendingCount(): number {
    return this.documents.filter((document) => document.status === 'PENDIENTE' || document.status === 'RECHAZADO').length;
  }

  addClient(): void {
    if (!this.newClient.name.trim() || !this.newClient.nif.trim() || !this.newClient.email.trim()) {
      return;
    }

    this.clients = [
      {
        id: Math.max(...this.clients.map((client) => client.id)) + 1,
        name: this.newClient.name.trim(),
        nif: this.newClient.nif.trim(),
        email: this.newClient.email.trim(),
        phone: this.newClient.phone.trim(),
        type: this.newClient.type,
        active: true,
        advisor: 'Raul',
      },
      ...this.clients,
    ];

    this.newClient = { name: '', nif: '', email: '', phone: '', type: 'Empresa' };
  }

  registerUpload(): void {
    const fileName = this.uploadForm.fileName.trim() || `${this.uploadForm.type.toLowerCase().replaceAll(' ', '_')}.pdf`;

    this.documents = [
      {
        id: Math.max(...this.documents.map((document) => document.id)) + 1,
        clientId: Number(this.uploadForm.clientId),
        type: this.uploadForm.type,
        year: Number(this.uploadForm.year),
        quarter: this.uploadForm.quarter,
        month: this.uploadForm.month,
        fileName,
        status: 'RECIBIDO',
        comment: 'Pendiente de revision',
        uploadedAt: new Date().toISOString().slice(0, 10),
      },
      ...this.documents,
    ];

    this.activeView = 'documentos';
  }

  setStatus(document: DocumentItem, status: DocumentStatus): void {
    document.status = status;
  }

  checkApi(): void {
    this.apiStatus = 'Comprobando';
    this.http.get<ApiResponse<string>>(`${this.apiBaseUrl}/api/health`).subscribe({
      next: (response) => {
        this.apiStatus = response.success ? `Conectado: ${response.data}` : 'Respuesta no valida';
      },
      error: () => {
        this.apiStatus = 'No disponible';
      },
    });
  }
}
