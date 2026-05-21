import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
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
type Role = 'ADMIN' | 'ASESOR' | 'CLIENTE';
type DocumentStatus = 'PENDIENTE' | 'RECIBIDO' | 'REVISADO' | 'RECHAZADO';
type ClientType = 'AUTONOMO' | 'EMPRESA';
type DocumentType = 'FACTURA_EMITIDA' | 'FACTURA_RECIBIDA' | 'TICKET' | 'NOMINA' | 'CONTRATO' | 'OTRO';

interface ApiResponse<T> {
  data: T;
  message: string | null;
  success: boolean;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  companyId: number;
  companyName: string;
  clientId: number | null;
}

interface AuthResponse {
  token: string;
  user: UserResponse;
}

interface ClientResponse {
  id: number;
  name: string;
  nif: string;
  email: string;
  phone: string | null;
  type: ClientType;
  active: boolean;
  createdAt: string;
}

interface DocumentResponse {
  id: number;
  clientId: number;
  clientName: string;
  uploadedById: number;
  uploadedByName: string;
  type: DocumentType;
  year: number;
  quarter: number;
  month: number | null;
  status: DocumentStatus;
  originalFilename: string;
  size: number;
  contentType: string | null;
  advisorComment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface QuarterStatusResponse {
  status: string;
  documentsCount: number;
}

interface ClientQuarterResponse {
  clientId: number;
  clientName: string;
  type: ClientType;
  active: boolean;
  quarters: Record<string, QuarterStatusResponse>;
}

interface DashboardResponse {
  year: number;
  clients: ClientQuarterResponse[];
  totals: {
    totalClients: number;
    missingQuarters: number;
    receivedDocuments: number;
    reviewedDocuments: number;
    rejectedDocuments: number;
  };
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
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'gestoria_token';

  readonly apiBaseUrl = 'http://localhost:30001';
  readonly menuItems: Array<{ view: View; label: string; icon: string }> = [
    { view: 'dashboard', label: 'Panel', icon: 'dashboard' },
    { view: 'clientes', label: 'Clientes', icon: 'users' },
    { view: 'documentos', label: 'Documentos', icon: 'documents' },
    { view: 'subir', label: 'Subir', icon: 'upload' },
    { view: 'configuracion', label: 'Configuracion', icon: 'settings' },
  ];
  readonly quarters = [1, 2, 3, 4];
  readonly documentTypes: DocumentType[] = ['FACTURA_EMITIDA', 'FACTURA_RECIBIDA', 'TICKET', 'NOMINA', 'CONTRATO', 'OTRO'];
  readonly statuses: DocumentStatus[] = ['PENDIENTE', 'RECIBIDO', 'REVISADO', 'RECHAZADO'];

  token = localStorage.getItem(this.tokenKey) ?? '';
  currentUser: UserResponse | null = null;
  activeView: View = 'dashboard';
  activeQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  selectedYear = new Date().getFullYear();
  searchTerm = '';
  apiStatus = 'Sin comprobar';
  loading = false;
  notice = '';
  error = '';

  clients: ClientResponse[] = [];
  documents: DocumentResponse[] = [];
  dashboard: DashboardResponse | null = null;
  selectedFile: File | null = null;

  loginForm = {
    email: 'admin@gestoria.local',
    password: 'Admin123!',
  };

  newClient = {
    name: '',
    nif: '',
    email: '',
    phone: '',
    type: 'EMPRESA' as ClientType,
    active: true,
  };

  uploadForm = {
    clientId: null as number | null,
    type: 'FACTURA_RECIBIDA' as DocumentType,
    year: new Date().getFullYear(),
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    month: new Date().getMonth() + 1,
  };

  ngOnInit(): void {
    if (this.token) {
      this.loadSession();
    }
  }

  login(): void {
    this.loading = true;
    this.clearMessages();
    this.http.post<ApiResponse<AuthResponse>>(`${this.apiBaseUrl}/api/auth/login`, this.loginForm).subscribe({
      next: (response) => {
        this.token = response.data.token;
        this.currentUser = response.data.user;
        localStorage.setItem(this.tokenKey, this.token);
        this.loading = false;
        this.notice = `Sesion iniciada como ${this.currentUser.role}`;
        this.loadWorkspace();
      },
      error: (error) => {
        this.loading = false;
        this.error = this.apiError(error, 'No se pudo iniciar sesion');
      },
    });
  }

  logout(): void {
    this.token = '';
    this.currentUser = null;
    this.clients = [];
    this.documents = [];
    this.dashboard = null;
    localStorage.removeItem(this.tokenKey);
  }

  loadSession(): void {
    this.http.get<ApiResponse<UserResponse>>(`${this.apiBaseUrl}/api/auth/me`, { headers: this.authHeaders() }).subscribe({
      next: (response) => {
        this.currentUser = response.data;
        this.loadWorkspace();
      },
      error: () => this.logout(),
    });
  }

  loadWorkspace(): void {
    this.loadClients();
    this.loadDocuments();
    this.loadDashboard();
    this.checkApi();
  }

  loadClients(): void {
    this.http.get<ApiResponse<ClientResponse[]>>(`${this.apiBaseUrl}/api/clients`, { headers: this.authHeaders() }).subscribe({
      next: (response) => {
        this.clients = response.data;
        if (!this.uploadForm.clientId && this.clients.length > 0) {
          this.uploadForm.clientId = this.clients[0].id;
        }
      },
      error: (error) => (this.error = this.apiError(error, 'No se pudieron cargar clientes')),
    });
  }

  loadDocuments(): void {
    const url = `${this.apiBaseUrl}/api/documents?year=${this.selectedYear}`;
    this.http.get<ApiResponse<DocumentResponse[]>>(url, { headers: this.authHeaders() }).subscribe({
      next: (response) => (this.documents = response.data),
      error: (error) => (this.error = this.apiError(error, 'No se pudieron cargar documentos')),
    });
  }

  loadDashboard(): void {
    this.http
      .get<ApiResponse<DashboardResponse>>(`${this.apiBaseUrl}/api/dashboard/summary?year=${this.selectedYear}`, {
        headers: this.authHeaders(),
      })
      .subscribe({
        next: (response) => (this.dashboard = response.data),
        error: (error) => (this.error = this.apiError(error, 'No se pudo cargar el panel')),
      });
  }

  addClient(): void {
    if (!this.canManageClients() || !this.newClient.name.trim() || !this.newClient.nif.trim() || !this.newClient.email.trim()) {
      return;
    }

    this.clearMessages();
    this.http.post<ApiResponse<ClientResponse>>(`${this.apiBaseUrl}/api/clients`, this.newClient, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.notice = 'Cliente creado';
        this.newClient = { name: '', nif: '', email: '', phone: '', type: 'EMPRESA', active: true };
        this.loadClients();
        this.loadDashboard();
      },
      error: (error) => (this.error = this.apiError(error, 'No se pudo crear el cliente')),
    });
  }

  registerUpload(): void {
    if (!this.uploadForm.clientId || !this.selectedFile) {
      this.error = 'Selecciona cliente y archivo';
      return;
    }

    this.clearMessages();
    const formData = new FormData();
    formData.append('clientId', String(this.uploadForm.clientId));
    formData.append('type', this.uploadForm.type);
    formData.append('year', String(this.uploadForm.year));
    formData.append('quarter', String(this.uploadForm.quarter));
    formData.append('month', String(this.uploadForm.month));
    formData.append('file', this.selectedFile);

    this.http.post<ApiResponse<DocumentResponse>>(`${this.apiBaseUrl}/api/documents`, formData, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.notice = 'Documento subido';
        this.selectedFile = null;
        this.activeView = 'documentos';
        this.loadDocuments();
        this.loadDashboard();
      },
      error: (error) => (this.error = this.apiError(error, 'No se pudo subir el documento')),
    });
  }

  setStatus(document: DocumentResponse, status: DocumentStatus): void {
    if (!this.canReviewDocuments()) {
      return;
    }

    this.http
      .patch<ApiResponse<DocumentResponse>>(
        `${this.apiBaseUrl}/api/documents/${document.id}/status`,
        { status, advisorComment: document.advisorComment },
        { headers: this.authHeaders() },
      )
      .subscribe({
        next: () => {
          this.notice = 'Estado actualizado';
          this.loadDocuments();
          this.loadDashboard();
        },
        error: (error) => (this.error = this.apiError(error, 'No se pudo cambiar el estado')),
      });
  }

  downloadDocument(document: DocumentResponse): void {
    this.downloadBlob(`/api/documents/${document.id}/download`, document.originalFilename);
  }

  downloadZip(): void {
    this.downloadBlob(`/api/documents/zip?year=${this.selectedYear}&quarter=${this.activeQuarter}`, `documentos-${this.selectedYear}-T${this.activeQuarter}.zip`);
  }

  checkApi(): void {
    this.apiStatus = 'Comprobando';
    this.http.get<ApiResponse<string>>(`${this.apiBaseUrl}/api/health`).subscribe({
      next: (response) => (this.apiStatus = response.success ? `Conectado: ${response.data}` : 'Respuesta no valida'),
      error: () => (this.apiStatus = 'No disponible'),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.item(0) ?? null;
  }

  filteredClients(): ClientResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.clients;
    }
    return this.clients.filter((client) =>
      [client.name, client.nif, client.email, client.phone ?? '', this.clientTypeLabel(client.type)].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }

  filteredDocuments(): DocumentResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.documents;
    }
    return this.documents.filter((document) =>
      [
        document.clientName,
        this.documentTypeLabel(document.type),
        document.originalFilename,
        document.status,
        document.advisorComment ?? '',
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }

  documentsForQuarter(): DocumentResponse[] {
    return this.documents.filter((document) => document.year === this.selectedYear && document.quarter === this.activeQuarter);
  }

  quarterStatus(clientId: number, quarter: number): string {
    return this.dashboard?.clients.find((client) => client.clientId === clientId)?.quarters[String(quarter)]?.status ?? 'FALTA';
  }

  completionPercent(): number {
    const activeClients = this.dashboard?.clients.filter((client) => client.active) ?? [];
    const possible = activeClients.length * this.quarters.length;
    if (possible === 0) {
      return 0;
    }
    const reviewed = activeClients
      .flatMap((client) => this.quarters.map((quarter) => client.quarters[String(quarter)]?.status))
      .filter((status) => status === 'REVISADO').length;
    return Math.round((reviewed / possible) * 100);
  }

  pendingCount(): number {
    return this.documents.filter((document) => document.status === 'PENDIENTE' || document.status === 'RECHAZADO').length;
  }

  activeClientCount(): number {
    return this.clients.filter((client) => client.active).length;
  }

  canManageClients(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'ASESOR';
  }

  canReviewDocuments(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'ASESOR';
  }

  clientTypeLabel(type: ClientType): string {
    return type === 'AUTONOMO' ? 'Autonomo' : 'Empresa';
  }

  documentTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      FACTURA_EMITIDA: 'Factura emitida',
      FACTURA_RECIBIDA: 'Factura recibida',
      TICKET: 'Ticket',
      NOMINA: 'Nomina',
      CONTRATO: 'Contrato',
      OTRO: 'Otro',
    };
    return labels[type];
  }

  monthLabel(month: number | null): string {
    const labels = ['-', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return month ? labels[month] : '-';
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }

  private downloadBlob(path: string, fallbackFilename: string): void {
    this.http
      .get(`${this.apiBaseUrl}${path}`, {
        headers: this.authHeaders(),
        observe: 'response',
        responseType: 'blob',
      })
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const filename = this.filenameFromResponse(response) ?? fallbackFilename;
          const url = URL.createObjectURL(response.body ?? new Blob());
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (error) => (this.error = this.apiError(error, 'No se pudo descargar')),
      });
  }

  private filenameFromResponse(response: HttpResponse<Blob>): string | null {
    const disposition = response.headers.get('content-disposition');
    const match = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
    const filename = match?.[1] ?? match?.[2];
    return filename ? decodeURIComponent(filename) : null;
  }

  private clearMessages(): void {
    this.notice = '';
    this.error = '';
  }

  private apiError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = (error as { error?: ApiResponse<unknown> }).error;
      return body?.message ?? fallback;
    }
    return fallback;
  }
}
