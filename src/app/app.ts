import {Component, ViewChild} from '@angular/core';
import {Country, MapComponent} from './components/map.component';
import {FormsModule} from '@angular/forms';
import {CountryService, SqlCountry} from './services/country.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container" [class.success-mode]="submitted">
      <!-- Interface principale avec carte en arrière-plan -->
      @if (!submitted) {
        <!-- Carte en plein écran -->
        <app-map
          #mapComponent
          [selectedCountries]="selectedCountries"
          [selectedCountry]="selectedCountry">
        </app-map>

        <!-- Overlay avec les contrôles flottants -->
        <div class="overlay">
          <!-- Header flottant -->
          <div class="floating-header">
            <h1 class="app-title">🌍 BOUFFE-TROTTEUR</h1>
            <p class="app-subtitle">Découvrez votre prochaine destination culinaire</p>
          </div>

          <!-- Section de contrôle principale -->
          <div class="main-controls">
            @if (inputCountry) {
              <div class="reference-country">
                <span class="reference-label">📍 Dernier pays visité:</span>
                <span class="reference-name">{{ inputCountry }}</span>
              </div>
            }

            <button
              class="btn-generate"
              (click)="generateDistantCountries()"
              [disabled]="isLoading"
            >
              @if (isLoading) {
                <span class="spinner"></span>
                <span class="suspense-text">{{ suspenseMessage }}</span>
              } @else if (!selectedCountries.length) {
                <span class="btn-icon">🎯</span>
                <span class="btn-text">Trouver 3 pays distants</span>
              } @else {
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Recommencer</span>
              }
            </button>

            @if (errorMessage) {
              <div class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errorMessage }}
              </div>
            }
          </div>

          <!-- Panel des pays trouvés -->
          @if (selectedCountries.length > 0) {
            <div class="countries-panel">
              <div class="panel-header">
                <h3>🎲 Destinations trouvées</h3>
                <span class="distance-info">Distantes de {{ inputCountry }}</span>
              </div>

              <div class="country-cards">
                @for (country of selectedCountries; track country.name; let i = $index) {
                  <div class="country-card"
                       (click)="selectedCountry = country"
                       [class.selected]="selectedCountry?.name === country.name">
                    <div class="card-content">
                      <div class="country-header">
                        <div class="country-number">{{ i + 1 }}</div>
                        @if (country.flag) {
                          <img [src]="country.flag" class="country-flag" alt="Drapeau {{ country.name }}">
                        }
                      </div>
                      <div class="country-info">
                        <span class="country-name">{{ country.name }}</span>
                        @if (country.distance) {
                          <span class="country-distance">🛫 {{ Math.round(country.distance) }} km</span>
                        }
                      </div>
                    </div>
                    @if (selectedCountry?.name === country.name) {
                      <div class="selection-indicator">✓</div>
                    }
                  </div>
                }
              </div>

              <button
                class="btn-validate"
                (click)="selectCountry()"
                [disabled]="!selectedCountry || isLoading"
              >
                @if (isLoading) {
                  <span class="spinner"></span>
                  <span>Validation...</span>
                } @else {
                  <span class="btn-icon">🎉</span>
                  <span class="btn-text">Valider ma sélection</span>
                }
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- Écran de succès -->
        <div class="success-screen">
          <div class="success-background"></div>
          <div class="success-content">
            <div class="success-header">
              <h1 class="success-title">🌍 BOUFFE-TROTTEUR</h1>
              <div class="celebration">🎉 Félicitations! 🎉</div>
            </div>

            <div class="result-card">
              <p class="result-text">Votre prochaine bouffe sera sur le thème du:</p>
              <div class="selected-country">
                @if (selectedCountry?.flag) {
                  <img [src]="selectedCountry?.flag" class="success-flag" alt="Drapeau {{ selectedCountry?.name }}">
                }
                <span class="country-name-large">{{ selectedCountry?.name }}</span>
              </div>
            </div>

            <button class="btn-back" (click)="reset()">
              <span class="btn-icon">👈</span>
              <span>Nouvelle aventure</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  imports: [
    MapComponent,
    FormsModule,
  ],
  styles: [`
    .app-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Overlay pour les contrôles flottants */
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      padding: 20px;
      gap: 20px;
    }

    .overlay > * {
      pointer-events: auto;
    }

    /* Header flottant */
    .floating-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: slideInFromTop 0.6s ease-out;
    }

    .app-title {
      margin: 0 0 8px 0;
      font-size: 2.2rem;
      font-weight: bold;
      background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFD93D);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .app-subtitle {
      margin: 0;
      color: #666;
      font-size: 1rem;
      font-style: italic;
    }

    /* Contrôles principaux */
    .main-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: slideInFromLeft 0.6s ease-out 0.2s both;
    }

    .reference-country {
      background: rgba(78, 205, 196, 0.95);
      backdrop-filter: blur(10px);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(78, 205, 196, 0.3);
    }

    .reference-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .reference-name {
      font-weight: bold;
      font-size: 16px;
    }

    .btn-generate {
      background: linear-gradient(45deg, #FF6B6B, #FFD93D, #4ECDC4);
      background-size: 200% 200%;
      color: white;
      border: none;
      padding: 18px 32px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 60px;
      min-width: 280px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
      animation: gradientShift 3s ease infinite;
    }

    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }

    .btn-generate:hover:not(:disabled) {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .btn-generate:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      font-size: 20px;
    }

    .btn-text {
      font-size: 16px;
    }

    /* Panel des pays */
    .countries-panel {
      align-self: start;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      max-height: 50vh;
      overflow-y: auto;
      animation: slideInFromRight 0.6s ease-out 0.4s both;
    }

    .panel-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .panel-header h3 {
      margin: 0 0 8px 0;
      font-size: 1.3rem;
      color: #333;
    }

    .distance-info {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }

    .country-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .country-card {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 16px;
      padding: 16px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .country-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(78, 205, 196, 0.1), transparent);
      transition: left 0.5s ease;
    }

    .country-card:hover::before {
      left: 100%;
    }

    .country-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .country-card.selected {
      border-color: #4ECDC4;
      background: rgba(78, 205, 196, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(78, 205, 196, 0.3);
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      z-index: 1;
    }

    .country-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .country-number {
      background: linear-gradient(45deg, #FF6B6B, #FFD93D);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      flex-shrink: 0;
    }

    .selected .country-number {
      background: linear-gradient(45deg, #4ECDC4, #45B7B8);
    }

    .country-flag {
      width: 45px;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .country-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .country-name {
      font-weight: 600;
      color: #333;
      font-size: 18px;
    }

    .country-distance {
      font-size: 13px;
      color: #666;
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 12px;
      border-radius: 15px;
      align-self: flex-start;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .selection-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #4ECDC4;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
    }

    .btn-validate {
      background: linear-gradient(45deg, #4ECDC4, #45B7B8);
      color: white;
      border: none;
      padding: 16px 28px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 54px;
    }

    .btn-validate:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(78, 205, 196, 0.4);
    }

    .btn-validate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Écran de succès */
    .success-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .success-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      opacity: 0.95;
    }

    .success-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      animation: successPop 0.8s ease-out;
    }

    .success-title {
      font-size: 2.5rem;
      margin-bottom: 16px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .celebration {
      font-size: 1.5rem;
      margin-bottom: 32px;
      animation: bounce 2s infinite;
    }

    .result-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 32px;
      margin: 32px 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .result-text {
      font-size: 1.2rem;
      margin-bottom: 24px;
      opacity: 0.9;
    }

    .selected-country {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .success-flag {
      width: 80px;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .country-name-large {
      font-size: 2.5rem;
      font-weight: bold;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .btn-back {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 16px 32px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-back:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    /* Spinner et messages d'erreur */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .error-message {
      background: rgba(214, 48, 49, 0.95);
      backdrop-filter: blur(10px);
      color: white;
      padding: 16px 20px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 400px;
      text-align: left;
      box-shadow: 0 4px 20px rgba(214, 48, 49, 0.3);
    }

    .suspense-text {
      font-size: 14px;
    }

    /* Animations */
    @keyframes slideInFromTop {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInFromLeft {
      from {
        opacity: 0;
        transform: translateX(-50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes successPop {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .overlay {
        padding: 16px;
        gap: 16px;
      }

      .floating-header {
        padding: 20px;
      }

      .app-title {
        font-size: 1.8rem;
      }

      .app-subtitle {
        font-size: 0.9rem;
      }

      .btn-generate {
        min-width: 260px;
        padding: 16px 24px;
      }

      .countries-panel {
        padding: 20px;
        max-height: 45vh;
      }

      .country-card {
        padding: 14px;
      }

      .country-name {
        font-size: 16px;
      }

      .country-flag {
        width: 40px;
      }

      .success-title {
        font-size: 2rem;
      }

      .country-name-large {
        font-size: 2rem;
      }

      .success-flag {
        width: 60px;
      }
      .countries-panel{
        align-self: unset;
      }
    }

    @media (min-width: 1024px) {
      .overlay {
        padding: 52px;
        gap: 24px;
      }

      .country-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }
    }
  `]
})
export class AppComponent {
  @ViewChild('mapComponent') mapComponent!: MapComponent;

  selectedCountries: Country[] = [];
  inputCountry: string = '';
  minDistance: number = 1500;
  isLoading: boolean = false;
  errorMessage: string = '';
  suspenseMessage: string = '';
  doneCountry$: Observable<SqlCountry>;
  // Expose Math pour le template
  Math = Math;
  selectedCountry: Country | null = null;
  submitted = false;
  allCountries: SqlCountry[] = [];

  constructor(private countryService: CountryService) {
    this.doneCountry$ = this.countryService.getDoneCountry();
    this.countryService.getAllMyCountries().subscribe((countries) => {
      this.allCountries = countries;
    })

    this.doneCountry$.pipe().subscribe((country) => this.inputCountry = country.name);
  }

  generateDistantCountries(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedCountries = [];
    // Messages de suspense qui changent pendant l'animation
    const suspenseMessages = [
      '🔍 Recherche de pays lointains...',
      '🌍 Exploration de la planète...',
      '📍 Sélection des destinations...',
      '✨ Finalisation des choix...'
    ];

    let messageIndex = 0;
    this.suspenseMessage = suspenseMessages[0];

    // Démarrer l'animation de suspense sur la carte
    this.mapComponent.startSuspenseAnimation();

    // Changer les messages pendant l'animation
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % suspenseMessages.length;
      this.suspenseMessage = suspenseMessages[messageIndex];
    }, 1250);

    // Faire l'appel API en parallèle mais attendre 5 secondes minimum
    const apiCall = this.countryService.getDistantCountries(
      this.inputCountry?.trim(),
      this.minDistance,
      3,
      this.allCountries
    );

    const suspenseDelay = new Promise(resolve => setTimeout(resolve, 5000));

    // Attendre à la fois l'API et le délai de suspense
    Promise.all([apiCall.toPromise(), suspenseDelay])
      .then(([countries]) => {
        // Arrêter l'animation et les messages
        clearInterval(messageInterval);
        this.mapComponent.stopSuspenseAnimation();

        // Mapper les résultats
        this.selectedCountries = (countries || []).map(country => ({
          name: country.name,
          lat: country.lat2,
          lng: country.lon2,
          distance: country.distance,
          flag: country.flag
        }));

        if (this.selectedCountries.length === 0) {
          this.errorMessage = `Aucun pays trouvé à plus de ${this.minDistance}km de "${this.inputCountry}". Essayez avec une distance plus petite.`;
        }

        this.isLoading = false;
        this.suspenseMessage = '';
      })
      .catch((error) => {
        clearInterval(messageInterval);
        this.mapComponent.stopSuspenseAnimation();
        console.error('Erreur lors de la recherche:', error);
        this.errorMessage = `Pays "${this.inputCountry}" non trouvé. Vérifiez l'orthographe.`;
        this.isLoading = false;
        this.suspenseMessage = '';
      });
  }

  selectCountry() {
    if (this.selectedCountry && this.selectedCountry.name !== '') {
      this.isLoading = true;
      this.countryService.postNextCountry(this.selectedCountry.name).subscribe(() => {
        this.submitted = true;
        this.isLoading = false;
      })
    }
  }

  reset() {
    this.submitted = false;
    this.inputCountry = this.selectedCountry?.name ?? '';
    this.selectedCountry = null;
    this.selectedCountries = [];
  }
}
