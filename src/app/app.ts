import {Component, ViewChild} from '@angular/core';
import {Country, MapComponent} from './components/map.component';
import {FormsModule} from '@angular/forms';
import {CountryService, SqlCountry} from './services/country.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      @if (!submitted) {
        <div class="header">
          <h1>BOUFFE-TROTTEUR</h1>

          <div class="input-section">
            <div class="input-row">
              <div class="input-group">
                <label class="input-label">Dernier pays visité:</label>
                <input
                  disabled
                  type="text"
                  [(ngModel)]="inputCountry"
                  placeholder="Entrez un pays de référence"
                  class="country-input"
                  (keyup.enter)="generateDistantCountries()"
                >
              </div>

              <button
                class="btn-generate"
                (click)="generateDistantCountries()"
                [disabled]="!inputCountry.trim() || isLoading"
              >
                @if (isLoading) {
                  <span class="spinner"></span>
                  <span class="suspense-text">{{ suspenseMessage }}</span>
                } @else if (!selectedCountries.length) {
                  <span class="btn-icon">🌍</span>
                  <span class="btn-text">Trouver 3 pays distants</span>
                } @else {
                  <span class="btn-icon">🌍</span>
                  <span class="btn-text">Recommencer</span>
                }
              </button>
            </div>
          </div>

          @if (errorMessage) {
            <div class="error-message">
              {{ errorMessage }}
            </div>
          }
        </div>

        @if (selectedCountries.length > 0) {
          <div class="countries-section">
            <h3>Pays trouvés (distants de {{ inputCountry }}):</h3>

            <div class="country-cards">
              @for (country of selectedCountries; track country.name; let i = $index) {
                <div class="country-card"
                     (click)="selectedCountry = country"
                     [class.selected]="selectedCountry?.name === country.name">
                  <div class="country-number">{{ i + 1 }}</div>
                  <div class="country-info">
                    <span class="country-name">{{ country.name }}</span>
                    @if (country.distance) {
                      <span class="country-distance">{{ Math.round(country.distance) }} km</span>
                    }
                  </div>
                  @if (country.flag) {
                    <img [src]="country.flag" class="country-flag" alt="Drapeau {{ country.name }}">
                  }
                </div>
              }
            </div>

            <button
              class="btn-go"
              (click)="selectCountry()"
              [disabled]="!selectedCountry || isLoading"
            >
              @if (isLoading) {
                <span class="spinner"></span>
                <span>Validation...</span>
              } @else {
                <span class="btn-text">Valider ma sélection</span>
              }
            </button>
          </div>
        }

        <app-map
          #mapComponent
          [selectedCountries]="selectedCountries"
          [selectedCountry]="selectedCountry">
        </app-map>
      } @else {
        <div class="success-screen">
          <div class="success-header">
            <h1>BOUFFE-TROTTEUR</h1>
            <div class="success-content">
              <h2>Félicitations!</h2>
              <p>Votre prochaine bouffe sera sur le thème du:</p>
              <div class="selected-country">
                <span class="country-name-large">{{ selectedCountry?.name }}</span>
                @if (selectedCountry?.flag) {
                  <img [src]="selectedCountry?.flag" class="success-flag" alt="Drapeau {{ selectedCountry?.name }}">
                }
              </div>
            </div>
            <button class="btn-back" (click)="reset()">
              <span>← Retour en arrière</span>
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
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
    }

    .header h1 {
      color: #333;
      margin-bottom: 24px;
      font-size: 2.5rem;
    }

    .input-section {
      margin-bottom: 24px;
    }

    .input-row {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 350px;
    }

    .input-label {
      font-weight: 600;
      color: #555;
      text-align: center;
    }

    .country-input {
      padding: 14px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 12px;
      font-size: 16px;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.2s;
      text-align: center;
    }

    .country-input:focus {
      outline: none;
      border-color: #4ECDC4;
    }

    .btn-generate {
      background: linear-gradient(45deg, #FF6B6B, #FFD93D);
      color: white;
      border: none;
      padding: 16px 24px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 54px;
      width: 100%;
      max-width: 350px;
    }

    .btn-generate:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .btn-generate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      font-size: 18px;
    }

    .btn-text {
      text-align: center;
    }

    .btn-go {
      background: linear-gradient(45deg, #6bcbff, #FFD93D);
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 25px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 56px;
      width: 100%;
      max-width: 300px;
      margin: 24px auto 0;
    }

    .btn-go:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .btn-go:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-back {
      background: linear-gradient(45deg, #74b9ff, #a29bfe);
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-top: 24px;
    }

    .btn-back:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      background: #ffe6e6;
      color: #d63031;
      padding: 16px 20px;
      border-radius: 12px;
      margin: 16px auto;
      max-width: 400px;
      border-left: 4px solid #d63031;
      text-align: left;
    }

    .countries-section {
      margin-bottom: 32px;
      text-align: center;
    }

    .countries-section h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.2rem;
      padding: 0 16px;
    }

    .country-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .country-card {
      background: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .country-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .country-card.selected {
      border-color: #4ECDC4;
      background: #f0fdfc;
    }

    .country-flag {
      width: 40px;
      height: auto;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .country-number {
      background: #FF6B6B;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      flex-shrink: 0;
    }

    .selected .country-number {
      background: #4ECDC4;
    }

    .country-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      text-align: left;
    }

    .country-name {
      font-weight: 600;
      color: #333;
      font-size: 18px;
    }

    .country-distance {
      font-size: 14px;
      color: #666;
      background: #f8f9fa;
      padding: 4px 10px;
      border-radius: 12px;
      align-self: flex-start;
    }

    .success-screen {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-header {
      text-align: center;
      padding: 32px 16px;
    }

    .success-header h1 {
      color: #333;
      margin-bottom: 32px;
      font-size: 2.5rem;
    }

    .success-content h2 {
      color: #4ECDC4;
      margin-bottom: 16px;
      font-size: 1.8rem;
    }

    .success-content p {
      color: #666;
      margin-bottom: 24px;
      font-size: 1.1rem;
    }

    .selected-country {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      margin: 24px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .country-name-large {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
      text-align: center;
    }

    .success-flag {
      width: 80px;
      height: auto;
      border-radius: 8px;
    }

    .suspense-text {
      text-align: center;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .container {
        padding: 12px;
      }

      .header h1 {
        font-size: 2rem;
      }

      .country-input {
        padding: 12px 14px;
        font-size: 16px;
      }

      .btn-generate {
        padding: 14px 20px;
        font-size: 15px;
      }

      .btn-go {
        padding: 14px 24px;
        font-size: 16px;
      }

      .country-card {
        padding: 14px;
        gap: 12px;
      }

      .country-name {
        font-size: 16px;
      }

      .country-number {
        width: 28px;
        height: 28px;
        font-size: 14px;
      }

      .country-flag {
        width: 35px;
      }

      .countries-section h3 {
        font-size: 1.1rem;
        padding: 0 8px;
      }

      .success-header h1 {
        font-size: 2rem;
      }

      .success-content h2 {
        font-size: 1.5rem;
      }

      .country-name-large {
        font-size: 1.6rem;
      }

      .success-flag {
        width: 60px;
      }

      .selected-country {
        padding: 20px;
        margin: 20px 0;
      }
    }

    @media (min-width: 768px) {
      .input-row {
        flex-direction: row;
        justify-content: center;
        align-items: flex-end;
        gap: 20px;
      }

      .input-group {
        max-width: 300px;
      }

      .btn-generate {
        max-width: 280px;
      }

      .country-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        max-width: 900px;
        margin: 0 auto 16px;
      }

      .country-card {
        min-height: 80px;
      }

      .btn-go {
        max-width: 250px;
      }
    }

    @media (min-width: 1024px) {
      .container {
        padding: 20px;
      }

      .country-cards {
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
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

  constructor(private countryService: CountryService) {
    this.doneCountry$ = this.countryService.getDoneCountry();
    this.doneCountry$.pipe().subscribe((country) => this.inputCountry = country.name)
  }

  generateDistantCountries(): void {
    if (!this.inputCountry.trim()) {
      this.errorMessage = 'Veuillez entrer un pays de référence.';
      return;
    }

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
      this.inputCountry.trim(),
      this.minDistance,
      3
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
