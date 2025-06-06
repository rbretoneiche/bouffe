// Installation requise : npm install leaflet @types/leaflet

// map.component.ts
import {Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges} from '@angular/core';
import * as L from 'leaflet';

export interface Country {
  name: string;
  lat: number;
  lng: number;
  distance?: number; // Distance depuis le pays de référence
  flag?: string; // Distance depuis le pays de référence
}

@Component({
  selector: 'app-map',
  template: `
    <div class="map-container">
      <div id="map" class="map"></div>
      @if (selectedCountries.length > 0) {
        <div class="map-controls">
          <button class="btn btn-primary" (click)="centerOnCountries()">
            Centrer sur les pays
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .map {
      height: 500px;
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .map-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }
  `]
})
export class MapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedCountries: Country[] = [];
  @Input() selectedCountry: Country | null = null;

  private map!: L.Map;
  private markers: L.Marker[] = [];
  private suspenseMarkers: L.Marker[] = [];
  private suspenseInterval: any;

  // Icône personnalisée pour les marqueurs finaux
  private customIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
        <path fill="#FF6B6B" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="#fff" cx="12.5" cy="12.5" r="5"/>
      </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41]
  });
  private customSelectedIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
        <path fill="#706bff" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="#fff" cx="12.5" cy="12.5" r="5"/>
      </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41]
  });

  // Icône pour l'animation de suspense (plus transparente)
  private suspenseIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="33" viewBox="0 0 20 33">
        <path fill="#FFD93D" fill-opacity="0.7" stroke="#fff" stroke-width="2" d="M10 0C4.5 0 0 4.5 0 10c0 10 10 23 10 23s10-13 10-23C20 4.5 15.5 0 10 0z"/>
        <circle fill="#fff" fill-opacity="0.9" cx="10" cy="10" r="4"/>
      </svg>
    `),
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [0, -33]
  });

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.stopSuspenseAnimation();
    if (this.map) {
      this.map.remove();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['selectedCountries'] || changes['selectedCountry']) && this.map) {
      this.updateMarkers();
    }
  }

  private initMap(): void {
    // Initialiser la carte
    this.map = L.map('map', {
      center: [20, 0], // Centre du monde
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);

    // Attendre que la carte soit prête avant d'ajouter les marqueurs
    this.map.whenReady(() => {
      this.updateMarkers();
    });
  }

  private updateMarkers(): void {
    // Supprimer les anciens marqueurs
    this.clearMarkers();

    // Ajouter les nouveaux marqueurs
    this.selectedCountries.forEach((country, index) => {
      const marker = L.marker([country.lat, country.lng], {
        icon: this.selectedCountry === country ? this.customSelectedIcon : this.customIcon
      }).addTo(this.map);

      // Popup avec informations du pays
      marker.bindPopup(`
        <div style="text-align: center; min-width: 150px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${country.name}</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">
            Latitude: ${country.lat.toFixed(4)}<br>
            Longitude: ${country.lng.toFixed(4)}
            ${country.distance ? `<br>Distance: ${Math.round(country.distance)} km` : ''}
          </p>
          <div style="margin-top: 8px; font-size: 11px; color: #999;">
            Pays ${index + 1}/3
          </div>
        </div>
      `);

      this.markers.push(marker);
    });

    // Centrer automatiquement sur les pays si il y en a
    if (this.selectedCountries.length > 0) {
      setTimeout(() => this.centerOnCountries(), 100);
    }
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }

  public centerOnCountries(): void {
    if (this.selectedCountries.length === 0) return;

    if (this.selectedCountries.length === 1) {
      // Un seul pays : centrer dessus
      const country = this.selectedCountries[0];
      this.map.setView([country.lat, country.lng], 6);
    } else {
      // Plusieurs pays : ajuster la vue pour tous les inclure
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  public resetView(): void {
    this.map.setView([20, 0], 2);
  }

  // Nouvelle méthode pour démarrer l'animation de suspense
  public startSuspenseAnimation(): void {
    this.stopSuspenseAnimation();
    this.clearMarkers();

    let animationCount = 0;
    const maxAnimations = 25; // Nombre total de pins à afficher pendant l'animation

    this.suspenseInterval = setInterval(() => {
      // Supprimer les anciens marqueurs de suspense
      this.clearSuspenseMarkers();

      // Créer 3-5 nouveaux marqueurs aléatoires
      const markerCount = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < markerCount; i++) {
        const lat = (Math.random() - 0.5) * 160; // -80 à 80
        const lng = (Math.random() - 0.5) * 360; // -180 à 180

        const marker = L.marker([lat, lng], {
          icon: this.suspenseIcon
        }).addTo(this.map);

        // Animation d'apparition
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.style.opacity = '0';
          markerElement.style.transform = 'scale(0.5)';
          markerElement.style.transition = 'all 0.3s ease-out';

          setTimeout(() => {
            markerElement.style.opacity = '0.7';
            markerElement.style.transform = 'scale(1)';
          }, 50);
        }

        this.suspenseMarkers.push(marker);
      }

      animationCount++;

      // Arrêter l'animation après le nombre maximum
      if (animationCount >= maxAnimations) {
        this.stopSuspenseAnimation();
      }
    }, 200); // Nouvelle animation toutes les 200ms
  }

  // Méthode pour arrêter l'animation de suspense
  public stopSuspenseAnimation(): void {
    if (this.suspenseInterval) {
      clearInterval(this.suspenseInterval);
      this.suspenseInterval = null;
    }
    this.clearSuspenseMarkers();
  }

  // Méthode pour supprimer les marqueurs de suspense
  private clearSuspenseMarkers(): void {
    this.suspenseMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.suspenseMarkers = [];
  }
}
