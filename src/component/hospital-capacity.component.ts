import {Component, OnInit} from '@angular/core';
import {IManagedObject} from "@c8y/client/lib/src/inventory/IManagedObject";
import APIService from "../service/api.service";
import * as _ from 'lodash';
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
mapboxgl.accessToken = 'pk.eyJ1Ijoia2hlaW5yaWNoMTg4IiwiYSI6ImNrODMwdmhjMzA1OWwzZm9kejZueDc3cWsifQ.0dS6yYqm_PommnbVWXYZxw';

@Component({
    selector: 'hospital-capacity',
    templateUrl: 'hospital-capacity.components.html',
    styleUrls: ['./hospital-capacity.component.css'],
})
export class HospitalCapacityComponent implements OnInit{
    private _allHospitalsByStates: _.Dictionary<IManagedObject[]>;

    public hospitals: IManagedObject[] = [];
    public loadedFinish = false;

    constructor(private apiService: APIService) {}

    ngOnInit(): void {
        this.apiService.auth()
            .then(() => {
                return this.apiService.getHospitals()
            })
            .then(hospitals => {
                console.log(hospitals);
                this.hospitals = hospitals;
                this._allHospitalsByStates = _.groupBy(hospitals, 'Bundesland');
                this.loadedFinish = true;
            })
            .then(() => {
                this.createMap();
            })
    }
    getStates() {
        return Object.keys(this._allHospitalsByStates);
    }
    getHospitalsForState(county: string) {
        return this._allHospitalsByStates[county];
    }
    getNormalHospitalKPIS(county: string, type: string) {
        const hospitalsInCounty = this._allHospitalsByStates[county];

        const freeNormal = _.sumBy(hospitalsInCounty, `Bettenkapazitaet.${type}.Frei`);
        const maxNormal = _.sumBy(hospitalsInCounty, `Bettenkapazitaet.${type}.Max`);
        const coronaNormal = _.sumBy(hospitalsInCounty, `Bettenkapazitaet.${type}.DavonBelegtmitCovid`);
        const notFreeNormal = _.sumBy(hospitalsInCounty, `Bettenkapazitaet.${type}.Belegt`);
        const sollNormal = _.sumBy(hospitalsInCounty, `Bettenkapazitaet.${type}.Soll`);

        return {
            freeNormal,
            maxNormal,
            coronaNormal,
            notFreeNormal,
            sollNormal
        };
    }
    createMap() {
        const map = new mapboxgl.Map({
            container: 'YOUR_CONTAINER_ELEMENT_ID',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [ 10.293, 50.8476],
            zoom: 5
        });

        map.on('load', () => {
            map.addSource('states', {
                type: 'geojson',
                data: 'https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/117a0a13dca574f8ecb48c6bcacf0580feaf499e/2_bundeslaender/2_hoch.geojson',
            });
            this.getStates().forEach(state => {
                const kpis = this.getNormalHospitalKPIS(state, 'Normalbetten');
                const capacity = (kpis.notFreeNormal / kpis.sollNormal) * 100;
                const color = this.getColorForCapacity(Math.round(capacity));
                map.addLayer(
                    {
                        'id': 'counties-highlighted',
                        'type': 'fill',
                        'source': 'states',
                        filter: [
                            '==', 'NAME_1', state
                        ],
                        'paint': {
                            'fill-outline-color': '#000',
                            'fill-color': color,
                            'fill-opacity': 0.75
                        },
                    },
                    'waterway-label'
                );
            });
            map.on('click', 'counties-highlighted', e => {
                const state = e.features[0].properties.NAME_1;
                const kpis = this.getNormalHospitalKPIS(state, 'Normalbetten');
                const capacity = Math.round((kpis.notFreeNormal / kpis.sollNormal) * 100);
                const color = this.getColorForCapacity(capacity);
                new mapboxgl.Popup({closeButton: false, closeOnClick: true})
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="background: #fff; opacity: 0.9; padding: 5px; color: ${color}">
                            <h3>${state}</h3>
                            <h5>Auslastung: ${capacity}%</h5>
                            <h5>Freie Betten: ${kpis.freeNormal}</h5>
                        </div>`)
                    .addTo(map);
            });
            // Change the cursor to a pointer when the mouse is over the states layer.
            map.on('mouseenter', 'counties-highlighted', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Change it back to a pointer when it leaves.
            map.on('mouseleave', 'counties-highlighted', () => {
                map.getCanvas().style.cursor = '';
            });
        });
    }
    private getColorForCapacity(capacity: number) {
        if (capacity >= 70) {
            return '#d50000'
        } else if (capacity < 70 && capacity >=50) {
            return '#ffd600'
        } else {
            return '#00c853';
        }
    }
}
