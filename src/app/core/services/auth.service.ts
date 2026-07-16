import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, switchMap, map, BehaviorSubject } from 'rxjs';
import { environment } from '@env/environment';
import { User, AuthTokens, LoginCredentials, RegisterData, ApiMessage } from '../models';
import { CartService } from './cart.service';

const TOKEN_KEY = 'cc_access_token';
const REFRESH_TOKEN_KEY = 'cc_refresh_token';
const USER_KEY = 'cc_user';
const CART_SESSION_KEY = 'cc_cart_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private cartService = inject(CartService);

  // State using signals
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  private isLoadingSignal = signal<boolean>(false);
  
  // Computed values
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isLoading = this.isLoadingSignal.asReadonly();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if we have a stored token and load user
    if (this.getAccessToken()) {
      this.loadCurrentUser();
    }
  }
  
  /**
   * Register a new user
   */
  register(data: RegisterData): Observable<User> {
    this.isLoadingSignal.set(true);
    return this.http.post<User>(`${this.apiUrl}/register`, data).pipe(
      tap(() => this.isLoadingSignal.set(false)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Login with email and password
   */
  login(credentials: LoginCredentials): Observable<AuthTokens> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthTokens>(`${this.apiUrl}/login`, credentials).pipe(
      tap(tokens => this.storeTokens(tokens)),
      switchMap(tokens => this.fetchCurrentUser().pipe(map(() => tokens))),
      tap(() => this.isLoadingSignal.set(false)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Logout user
   */
  logout(): void {
    this.http.post<ApiMessage>(`${this.apiUrl}/logout`, {}).subscribe();
    this.clearAuth();
    this.cartService.resetCart();
    this.router.navigate(['/']);
  }
  
  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }
    
    return this.http.post<AuthTokens>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
      tap(tokens => this.storeTokens(tokens)),
      catchError(() => {
        this.clearAuth();
        return of(null);
      })
    );
  }
  
  /**
   * Get current user profile
   */
  loadCurrentUser(): void {
    if (!this.getAccessToken()) return;
    this.fetchCurrentUser().subscribe();
  }

  /**
   * Fetch the current user profile and update the signal, waiting for the
   * response — used by login() so navigation after login (e.g. returnUrl
   * redirects) only happens once currentUser is actually populated.
   */
  private fetchCurrentUser(): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        this.storeUser(user);
      }),
      catchError((error: any) => {
        // Only clear auth on genuine authentication failure (401).
        // Server errors (500) or network errors must NOT log the user out —
        // the session is still valid, the server is just temporarily broken.
        const status = error?.status ?? error?.original?.status;
        if (status === 401) {
          this.clearAuth();
        }
        return of(null);
      })
    );
  }
  
  /**
   * Login / register via Google Identity Services
   * Sends the ID token received from the Google button callback to the backend for verification.
   */
  loginWithGoogle(idToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/google`, { id_token: idToken }).pipe(
      tap(tokens => this.storeTokens(tokens)),
      switchMap(tokens => this.fetchCurrentUser().pipe(map(() => tokens))),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/forgot-password`, { email });
  }
  
  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/reset-password`, {
      token,
      new_password: newPassword
    });
  }
  
  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
  
  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  
  /**
   * Store tokens in localStorage
   */
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
  
  /**
   * Store user in localStorage
   */
  private storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  
  /**
   * Clear all auth data
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CART_SESSION_KEY);
    this.currentUserSignal.set(null);
  }
}
