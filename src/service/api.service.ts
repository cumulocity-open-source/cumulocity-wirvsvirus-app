import {Injectable} from '@angular/core';
import {Client} from '@c8y/client';
import {baseUrl, auth} from '../../globals';
import {IdReference} from '@c8y/client/lib/src/inventory/InventoryService';

@Injectable()

export default class APIService {
    private client: Client;
    constructor() {
    }
    async auth() {
        this.client = await Client.authenticate({
            tenant: auth.tenant,
            user: auth.user,
            password: auth.password
        }, baseUrl);
    }
    getHospitals() {
        const filter: object = {
            pageSize: 10000,
            withTotalPages: true
        };
        const query = {type: 'Krankenhaus'};
        return this.client.inventory.listQuery(query, filter)
            .then(result => {
                return result.data
            })
    }
    getInventoryDetail(id: IdReference) {
        return this.client.inventory.detail(id)
            .then((result) => {
                return result.data.childAssets.references
            });
    }
}
