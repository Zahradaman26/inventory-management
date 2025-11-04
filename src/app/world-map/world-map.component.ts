import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.css']
})
export class WorldMapComponent implements OnInit {
  private map!: L.Map;

  private markers = [
    { lat: 35.8617, lng: 104.1954, label: 'China : 250' },
    { lat: 25.2744, lng: 133.7751, label: 'Australia : 250' },
    { lat: 36.77, lng: -119.41, label: 'USA : 82%' },
    { lat: 55.37, lng: -3.41, label: 'UK : 250' },
    { lat: 25.20, lng: 55.27, label: 'UAE : 250' }
  ];

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('world-map', {
      center: [20, 0],
      zoom: 2,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markers.forEach(marker => {
      L.circleMarker([marker.lat, marker.lng], {
        radius: 5,
        fillColor: '#fff',
        color: '#000',
        weight: 1,
        opacity: 0.4,
        fillOpacity: 1
      }).bindPopup(marker.label).addTo(this.map);
    });
  }
}
